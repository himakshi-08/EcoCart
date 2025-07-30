const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const { 
  getAllItems, 
  createItem, 
  claimItem 
} = require('../controllers/itemController');

// Configure Multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.get('/', getAllItems);
router.post('/', auth, upload.array('images', 3), createItem);
router.patch('/:id/claim', auth, claimItem);

module.exports = router;