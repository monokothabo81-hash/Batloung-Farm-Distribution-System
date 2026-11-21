const db = require('../config/db');
const SIZES = ['SMALL', 'MEDIUM', 'LARGE'];

exports.getPurchases = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            `SELECT p.*, s.business_name
             FROM purchases p
             JOIN suppliers s ON s.supplier_id = p.supplier_id
             ORDER BY p.purchase_id DESC`
        );
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

exports.createPurchase = async (req, res, next) => {
    const { supplier_id, purchase_date, items } = req.body;

    if (!Number.isInteger(Number(supplier_id)) || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'A valid supplier_id and a non-empty items array are required' });
    }

    for (const item of items) {
        if (!Number.isInteger(Number(item.fruit_id)) ||
            !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0 ||
            !Number.isFinite(Number(item.unit_cost)) || Number(item.unit_cost) < 0 ||
            !SIZES.includes(item.packaging_size)) {
            return res.status(400).json({
                message: 'Each item needs fruit_id, positive whole-number quantity, non-negative unit_cost and valid packaging_size'
            });
        }
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [supplier] = await connection.query(
            'SELECT supplier_id FROM suppliers WHERE supplier_id = ?',
            [supplier_id]
        );
        if (!supplier.length) {
            await connection.rollback();
            return res.status(404).json({ message: 'Supplier not found' });
        }

        let total = 0;
        for (const item of items) {
            const [fruit] = await connection.query(
                'SELECT fruit_id FROM fruits WHERE fruit_id = ? AND status = ?',
                [item.fruit_id, 'ACTIVE']
            );
            if (!fruit.length) {
                throw Object.assign(new Error(`Active fruit ${item.fruit_id} was not found`), { statusCode: 400 });
            }
            total += Number(item.quantity) * Number(item.unit_cost);
        }

        const [purchaseResult] = await connection.query(
            'INSERT INTO purchases (supplier_id, purchase_date, total_amount) VALUES (?, COALESCE(?, CURRENT_DATE), ?)',
            [supplier_id, purchase_date || null, total]
        );
        const purchaseId = purchaseResult.insertId;

        for (const item of items) {
            await connection.query(
                `INSERT INTO purchase_details
                 (purchase_id, fruit_id, quantity, unit_cost, packaging_size)
                 VALUES (?, ?, ?, ?, ?)`,
                [purchaseId, item.fruit_id, item.quantity, item.unit_cost, item.packaging_size]
            );

            await connection.query(
                `INSERT INTO stock (fruit_id, packaging_size, available_quantity)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE available_quantity = available_quantity + VALUES(available_quantity)`,
                [item.fruit_id, item.packaging_size, item.quantity]
            );
        }

        await connection.commit();
        res.status(201).json({
            message: 'Purchase recorded and stock updated successfully',
            purchase_id: purchaseId,
            total_amount: Number(total.toFixed(2))
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};
