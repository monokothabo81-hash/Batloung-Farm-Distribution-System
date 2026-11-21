const express = require('express');
const router = express.Router();
const controller = require('../controllers/fruitController');

router.get('/stock', controller.getStock);
router.get('/stock/low', controller.getLowStock);
router.get('/', controller.getFruits);
router.get('/:id', controller.getFruitById);
router.post('/', controller.createFruit);
router.put('/:id', controller.updateFruit);
router.delete('/:id', controller.deleteFruit);

module.exports = router;
