const Item = require('../models/Item');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Configure local temporary storage for multer
const storage = multer.diskStorage({}); // Use memory or temp disk before Cloudinary

// Multer instance for routes
exports.upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});

// Improved file cleanup
const cleanupFiles = (files) => {
  if (!files || !files.length) return;

  files.forEach(file => {
    try {
      const filePath = path.join(uploadDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up: ${filePath}`);
      }
    } catch (err) {
      console.error(`Cleanup failed for ${file.filename}:`, err);
    }
  });
};

// Create Item with Cloudinary integration
exports.createItem = async (req, res, next) => {
  try {
    const { title, description, category, condition, location } = req.body;

    if (!title || !description || !category || !condition || !location) {
      return res.status(400).json({ error: "Please provide all required fields" });
    }

    // Upload images to Cloudinary
    let images = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file =>
        cloudinary.uploader.upload(file.path, {
          folder: 'ecocart/items'
        })
      );
      const uploadResults = await Promise.all(uploadPromises);
      images = uploadResults.map(result => result.secure_url);

      // Clean up temp files
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }

    const item = new Item({
      title,
      description,
      category: category.toLowerCase(),
      condition,
      location,
      images,
      postedBy: req.user.id
    });

    await item.save();

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ error: 'Failed to create item' });
  }
};
// Get All Items with advanced filtering
exports.getAllItems = async (req, res) => {
  try {
    const items = await Item.find()
      .populate('postedBy', 'name')
      .populate('claimedBy', 'name');
    res.json({ success: true, data: items }); // <-- wrap in object
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Claim Item with validation
exports.claimItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.claimedBy) return res.status(400).json({ error: 'Item already claimed' });
    item.claimedBy = req.user._id;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Error handling middleware (add this to your server.js)
exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
