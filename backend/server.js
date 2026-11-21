require('dotenv').config();

const express = require('express');
const cors = require('cors');

const supplierRoutes = require('./routes/supplierRoutes');
const fruitRoutes = require('./routes/fruitRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const salesRoutes = require('./routes/salesRoutes');
const reportRoutes = require('./routes/reportRoutes');

const { testConnection } = require('./config/db');
const sellingPrices = require('./config/sellingPrices');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Batloung Farm Distribution System API is running!'
    });
});

app.get('/api/health', async (req, res, next) => {
    try {
        await testConnection();
        res.status(200).json({ status: 'OK', database: 'connected' });
    } catch (error) {
        next(error);
    }
});

app.get('/api/prices', (req, res) => {
    res.status(200).json(sellingPrices);
});

app.use('/api/suppliers', supplierRoutes);
app.use('/api/fruits', fruitRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Batloung Farm API running on port ${PORT}`);
    });
}

module.exports = app;
