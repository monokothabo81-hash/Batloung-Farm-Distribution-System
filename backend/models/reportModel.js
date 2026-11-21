const db = require('../config/db');

exports.getTopFruits = async () => {
    const [rows] = await db.query(
        `SELECT f.fruit_id, f.fruit_name, SUM(sd.quantity) AS boxes_sold
         FROM sales_details sd
         JOIN fruits f ON f.fruit_id = sd.fruit_id
         GROUP BY f.fruit_id, f.fruit_name
         ORDER BY boxes_sold DESC
         LIMIT 5`
    );
    return rows;
};

exports.getRevenue = async (startDate, endDate) => {
    const [rows] = await db.query(
        `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue
         FROM sales
         WHERE sale_date BETWEEN ? AND ?`,
        [startDate, endDate]
    );
    return rows[0];
};

exports.getHighestVolumeVendor = async () => {
    const [rows] = await db.query(
        `SELECT v.vendor_id, v.vendor_name, SUM(sd.quantity) AS total_boxes
         FROM sales_details sd
         JOIN sales s ON s.sale_id = sd.sale_id
         JOIN vendors v ON v.vendor_id = s.vendor_id
         GROUP BY v.vendor_id, v.vendor_name
         ORDER BY total_boxes DESC
         LIMIT 1`
    );
    return rows[0] || null;
};

exports.getStockReport = async () => {
    const [rows] = await db.query(
        `SELECT f.fruit_id, f.fruit_name, st.packaging_size, st.available_quantity
         FROM stock st
         JOIN fruits f ON f.fruit_id = st.fruit_id
         ORDER BY f.fruit_name, FIELD(st.packaging_size, 'SMALL', 'MEDIUM', 'LARGE')`
    );
    return rows;
};
