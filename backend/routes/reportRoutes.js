const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportController');

router.get('/top-fruits', controller.getTopFruits);
router.get('/revenue', controller.getRevenue);
router.get('/highest-volume-vendor', controller.getHighestVolumeVendor);
router.get('/stock', controller.getStockReport);

module.exports = router;
