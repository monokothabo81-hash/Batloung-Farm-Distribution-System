const express = require('express');
const router = express.Router();
const controller = require('../controllers/vendorController');

router.get('/balances', controller.getVendorBalances);
router.get('/', controller.getVendors);
router.get('/:id', controller.getVendorById);
router.post('/', controller.createVendor);
router.put('/:id', controller.updateVendor);

module.exports = router;
