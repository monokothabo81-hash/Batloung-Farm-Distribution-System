const db = require('../config/db');
const SELLING_PRICES = require('../config/sellingPrices');
const SIZES = ['SMALL', 'MEDIUM', 'LARGE'];
const METHODS = ['CASH', 'MOBILE_MONEY', 'CREDIT'];

exports.getSales = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            `SELECT s.*, v.vendor_name
             FROM sales s
             JOIN vendors v ON v.vendor_id = s.vendor_id
             ORDER BY s.sale_id DESC`
        );
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

exports.createSale = async (req, res, next) => {
    const {
        vendor_id,
        sale_date,
        payment_method = 'CREDIT',
        amount_paid = 0,
        items
    } = req.body;

    if (!Number.isInteger(Number(vendor_id)) ||
        !Array.isArray(items) || items.length === 0 ||
        !METHODS.includes(payment_method)) {
        return res.status(400).json({
            message: 'A valid vendor_id, payment_method and non-empty items array are required'
        });
    }

    for (const item of items) {
        if (!Number.isInteger(Number(item.fruit_id)) ||
            !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0 ||
            !SIZES.includes(item.packaging_size)) {
            return res.status(400).json({
                message: 'Each item needs fruit_id, a positive whole-number quantity and a valid packaging_size'
            });
        }
    }

    // Combine repeated fruit/package lines before checking stock so the same
    // stock balance cannot be accidentally counted more than once.
    const requestedByStockKey = new Map();
    for (const item of items) {
        const key = `${item.fruit_id}:${item.packaging_size}`;
        requestedByStockKey.set(
            key,
            (requestedByStockKey.get(key) || 0) + Number(item.quantity)
        );
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [vendor] = await connection.query(
            'SELECT vendor_id FROM vendors WHERE vendor_id = ?',
            [vendor_id]
        );
        if (!vendor.length) {
            await connection.rollback();
            return res.status(404).json({ message: 'Vendor not found' });
        }

        let total = 0;

        // Validate that every fruit exists and calculate the complete sale total.
        for (const item of items) {
            const [fruit] = await connection.query(
                'SELECT fruit_id FROM fruits WHERE fruit_id = ? AND status = ?',
                [item.fruit_id, 'ACTIVE']
            );
            if (!fruit.length) {
                throw Object.assign(new Error(`Active fruit ${item.fruit_id} was not found`), { statusCode: 400 });
            }
            total += Number(item.quantity) * SELLING_PRICES[item.packaging_size];
        }

        // Lock and check each unique fruit/package stock balance once.
        for (const [key, requested] of requestedByStockKey.entries()) {
            const [fruitId, packagingSize] = key.split(':');
            const [stockRows] = await connection.query(
                `SELECT available_quantity FROM stock
                 WHERE fruit_id = ? AND packaging_size = ? FOR UPDATE`,
                [fruitId, packagingSize]
            );
            const available = stockRows.length ? Number(stockRows[0].available_quantity) : 0;
            if (available < requested) {
                throw Object.assign(
                    new Error(`Insufficient ${packagingSize.toLowerCase()} stock for fruit ID ${fruitId}. Available: ${available}, requested: ${requested}`),
                    { statusCode: 409 }
                );
            }
        }

        const paid = Number(amount_paid);
        if (!Number.isFinite(paid) || paid < 0 || paid > total) {
            throw Object.assign(new Error('amount_paid must be between 0 and the calculated sale total'), { statusCode: 400 });
        }

        const payment_status = paid === 0
            ? 'UNPAID'
            : paid < total
                ? 'PARTIALLY_PAID'
                : 'PAID';

        if (payment_method === 'CASH' && paid !== total) {
            throw Object.assign(new Error('Cash sales must be paid in full'), { statusCode: 400 });
        }

        const [saleResult] = await connection.query(
            `INSERT INTO sales
             (vendor_id, sale_date, payment_status, total_amount, payment_method, amount_paid)
             VALUES (?, COALESCE(?, CURRENT_DATE), ?, ?, ?, ?)`,
            [vendor_id, sale_date || null, payment_status, total, payment_method, paid]
        );
        const saleId = saleResult.insertId;

        for (const item of items) {
            await connection.query(
                `INSERT INTO sales_details
                 (sale_id, fruit_id, packaging_size, quantity, unit_price)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    saleId,
                    item.fruit_id,
                    item.packaging_size,
                    item.quantity,
                    SELLING_PRICES[item.packaging_size]
                ]
            );

            await connection.query(
                `UPDATE stock
                 SET available_quantity = available_quantity - ?
                 WHERE fruit_id = ? AND packaging_size = ? AND available_quantity >= ?`,
                [item.quantity, item.fruit_id, item.packaging_size, item.quantity]
            );
        }

        await connection.commit();
        res.status(201).json({
            message: 'Sale recorded and stock updated successfully',
            sale_id: saleId,
            total_amount: Number(total.toFixed(2)),
            amount_paid: Number(paid.toFixed(2)),
            outstanding_balance: Number((total - paid).toFixed(2)),
            payment_status
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};
