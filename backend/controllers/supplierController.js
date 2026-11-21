const db = require('../config/db');

exports.getSuppliers = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM suppliers ORDER BY supplier_id DESC'
        );
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

exports.getSupplierById = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM suppliers WHERE supplier_id = ?',
            [req.params.id]
        );
        if (!rows.length) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.createSupplier = async (req, res, next) => {
    try {
        const { business_name, contact_person, phone, province, address } = req.body;
        const allowedProvinces = [
            'Gauteng', 'Free State', 'KwaZulu-Natal', 'Western Cape',
            'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West'
        ];

        if (![business_name, contact_person, phone, province, address].every(
            value => typeof value === 'string' && value.trim()
        )) {
            return res.status(400).json({
                message: 'business_name, contact_person, phone, province and address are required'
            });
        }
        if (!allowedProvinces.includes(province)) {
            return res.status(400).json({ message: 'Invalid South African province' });
        }

        const [result] = await db.query(
            `INSERT INTO suppliers
             (business_name, contact_person, phone, province, address)
             VALUES (?, ?, ?, ?, ?)`,
            [business_name.trim(), contact_person.trim(), phone.trim(), province, address.trim()]
        );

        res.status(201).json({
            message: 'Supplier created successfully',
            supplier_id: result.insertId
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A supplier with that phone number already exists' });
        }
        next(error);
    }
};

exports.updateSupplier = async (req, res, next) => {
    try {
        const { business_name, contact_person, phone, province, address } = req.body;
        const allowedProvinces = [
            'Gauteng', 'Free State', 'KwaZulu-Natal', 'Western Cape',
            'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West'
        ];

        if (![business_name, contact_person, phone, province, address].every(
            value => typeof value === 'string' && value.trim()
        )) {
            return res.status(400).json({ message: 'All supplier fields are required for an update' });
        }
        if (!allowedProvinces.includes(province)) {
            return res.status(400).json({ message: 'Invalid South African province' });
        }

        const [result] = await db.query(
            `UPDATE suppliers
             SET business_name = ?, contact_person = ?, phone = ?, province = ?, address = ?
             WHERE supplier_id = ?`,
            [business_name.trim(), contact_person.trim(), phone.trim(), province, address.trim(), req.params.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.status(200).json({ message: 'Supplier updated successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'That phone number is already assigned to another supplier' });
        }
        next(error);
    }
};

exports.deleteSupplier = async (req, res, next) => {
    try {
        const [result] = await db.query(
            'DELETE FROM suppliers WHERE supplier_id = ?',
            [req.params.id]
        );
        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.status(200).json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'Supplier cannot be deleted because purchases reference it' });
        }
        next(error);
    }
};
