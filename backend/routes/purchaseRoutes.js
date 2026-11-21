const express = require('express');
const router = express.Router();
const controller = require('../controllers/purchaseController');

router.get('/', controller.getPurchases);
router.post('/', controller.createPurchase);

module.exports = router;
