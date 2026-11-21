const db = require('../config/db');

const allowedFruits = ['Apples', 'Bananas', 'Oranges', 'Mangoes', 'Grapes'];
const allowedStatuses = ['ACTIVE', 'INACTIVE'];

exports.getFruits = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM fruits ORDER BY fruit_id');
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

exports.getFruitById = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM fruits WHERE fruit_id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: 'Fruit not found' });
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.createFruit = async (req, res, next) => {
    try {
        const { fruit_name, description = '', status = 'ACTIVE' } = req.body;
        if (!allowedFruits.includes(fruit_name)) {
            return res.status(400).json({ message: `fruit_name must be one of: ${allowedFruits.join(', ')}` });
        }
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'status must be ACTIVE or INACTIVE' });
        }

        const [result] = await db.query(
            'INSERT INTO fruits (fruit_name, description, status) VALUES (?, ?, ?)',
            [fruit_name, description, status]
        );

        // Create separate opening stock rows for all three package sizes.
        for (const size of ['SMALL', 'MEDIUM', 'LARGE']) {
            await db.query(
                'INSERT INTO stock (fruit_id, packaging_size, available_quantity) VALUES (?, ?, 0)',
                [result.insertId, size]
            );
        }

        res.status(201).json({ message: 'Fruit created successfully', fruit_id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'That fruit already exists' });
        }
        next(error);
    }
};

exports.updateFruit = async (req, res, next) => {
    try {
        const { fruit_name, description = '', status } = req.body;
        if (!allowedFruits.includes(fruit_name) || !allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Provide a valid fruit_name and status (ACTIVE or INACTIVE)' });
        }

        const [result] = await db.query(
            'UPDATE fruits SET fruit_name = ?, description = ?, status = ? WHERE fruit_id = ?',
            [fruit_name, description, status, req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ message: 'Fruit not found' });
        res.status(200).json({ message: 'Fruit updated successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'That fruit name is already in use' });
        }
        next(error);
    }
};

exports.deleteFruit = async (req, res, next) => {
    try {
        const [result] = await db.query('DELETE FROM fruits WHERE fruit_id = ?', [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ message: 'Fruit not found' });
        res.status(200).json({ message: 'Fruit deleted successfully' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'Fruit cannot be deleted because transactions or stock reference it' });
        }
        next(error);
    }
};

exports.getStock = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            `SELECT s.stock_id, f.fruit_id, f.fruit_name, s.packaging_size,
                    s.available_quantity
             FROM stock s
             JOIN fruits f ON f.fruit_id = s.fruit_id
             ORDER BY f.fruit_name, FIELD(s.packaging_size, 'SMALL', 'MEDIUM', 'LARGE')`
        );
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

exports.getLowStock = async (req, res, next) => {
    try {
        const threshold = Number(req.query.threshold ?? 10);
        if (!Number.isInteger(threshold) || threshold < 0) {
            return res.status(400).json({ message: 'threshold must be a non-negative whole number' });
        }
        const [rows] = await db.query(
            `SELECT f.fruit_id, f.fruit_name, s.packaging_size, s.available_quantity
             FROM stock s
             JOIN fruits f ON f.fruit_id = s.fruit_id
             WHERE s.available_quantity <= ?
             ORDER BY s.available_quantity ASC`,
            [threshold]
        );
        res.status(200).json({ threshold, items: rows });
    } catch (error) {
        next(error);
    }
};
