const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const auth = require('../middleware/auth');

// Use the upload middleware from your controller
router.post('/', auth, itemController.upload.array('images'), itemController.createItem);
router.get('/', itemController.getAllItems);
router.patch('/:id/claim', auth, itemController.claimItem);

module.exports = router;