const db = require('../config/db');

exports.getVendors = async (req, res, next) => {
    try {
        const search = (req.query.search || '').trim();
        const [rows] = await db.query(
            `SELECT v.*,
                    COALESCE(SUM(s.total_amount - s.amount_paid), 0) AS outstanding_balance
             FROM vendors v
             LEFT JOIN sales s ON s.vendor_id = v.vendor_id
             WHERE (? = '' OR v.vendor_name LIKE ? OR v.phone_number LIKE ? OR v.location LIKE ?)
             GROUP BY v.vendor_id
             ORDER BY v.vendor_id DESC`,
            [search, `%${search}%`, `%${search}%`, `%${search}%`]
        );
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

exports.getVendorById = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            `SELECT v.*,
                    COALESCE(SUM(s.total_amount - s.amount_paid), 0) AS outstanding_balance
             FROM vendors v
             LEFT JOIN sales s ON s.vendor_id = v.vendor_id
             WHERE v.vendor_id = ?
             GROUP BY v.vendor_id`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Vendor not found' });
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.createVendor = async (req, res, next) => {
    try {
        const { vendor_name, phone_number, location, registration_date } = req.body;
        if (![vendor_name, phone_number, location].every(v => typeof v === 'string' && v.trim())) {
            return res.status(400).json({ message: 'vendor_name, phone_number and location are required' });
        }

        const [result] = await db.query(
            `INSERT INTO vendors (vendor_name, phone_number, location, registration_date)
             VALUES (?, ?, ?, COALESCE(?, CURRENT_DATE))`,
            [vendor_name.trim(), phone_number.trim(), location.trim(), registration_date || null]
        );
        res.status(201).json({ message: 'Vendor registered successfully', vendor_id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A vendor with that phone number already exists' });
        }
        next(error);
    }
};

exports.updateVendor = async (req, res, next) => {
    try {
        const { vendor_name, phone_number, location } = req.body;
        if (![vendor_name, phone_number, location].every(v => typeof v === 'string' && v.trim())) {
            return res.status(400).json({ message: 'vendor_name, phone_number and location are required' });
        }

        const [result] = await db.query(
            `UPDATE vendors SET vendor_name = ?, phone_number = ?, location = ?
             WHERE vendor_id = ?`,
            [vendor_name.trim(), phone_number.trim(), location.trim(), req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ message: 'Vendor not found' });
        res.status(200).json({ message: 'Vendor updated successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'That phone number belongs to another vendor' });
        }
        next(error);
    }
};

exports.getVendorBalances = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            `SELECT v.vendor_id, v.vendor_name, v.phone_number,
                    COALESCE(SUM(s.total_amount), 0) AS total_sales,
                    COALESCE(SUM(s.amount_paid), 0) AS total_paid,
                    COALESCE(SUM(s.total_amount - s.amount_paid), 0) AS outstanding_balance
             FROM vendors v
             LEFT JOIN sales s ON s.vendor_id = v.vendor_id
             GROUP BY v.vendor_id
             ORDER BY outstanding_balance DESC`
        );
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};
