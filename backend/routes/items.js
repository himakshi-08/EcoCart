const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllItems,
  createItem,
  claimItem,
  getItem,
  getUserHub,
  deleteItem,
  upload // Import the upload middleware
} = require('../controllers/itemController');

router.get('/', getAllItems);
router.get('/hub', auth, getUserHub);
router.get('/:id', getItem);
router.post('/', auth, upload.array('images', 3), createItem);
router.patch('/:id/claim', auth, claimItem);
router.delete('/:id', auth, deleteItem);

module.exports = router;