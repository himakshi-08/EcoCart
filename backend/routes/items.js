const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllItems,
  createItem,
  claimItem,
  upload // Import the upload middleware
} = require('../controllers/itemController');

router.get('/', getAllItems);
router.post('/', auth, upload.array('images', 3), createItem);
router.patch('/:id/claim', auth, claimItem);

module.exports = router;