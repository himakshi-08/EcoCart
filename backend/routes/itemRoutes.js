const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const auth = require('../middleware/auth');

// Create a new item (with image upload)
router.post('/', auth, itemController.upload.array('images'), itemController.createItem);

// Get all items
router.get('/', itemController.getAllItems);

// ✅ Get a single item by ID
router.get('/:id', itemController.getItem);

// Claim an item
router.patch('/:id/claim', auth, itemController.claimItem);

module.exports = router;
