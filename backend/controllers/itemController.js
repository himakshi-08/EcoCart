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
      postedBy: req.user
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
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name')
      .populate('claimedBy', 'name');
    res.json({ success: true, data: items }); // <-- wrap in object
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Get Single Item
exports.getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('postedBy', 'name email');
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get items posted or claimed by current user
exports.getUserHub = async (req, res) => {
  try {
    const myPosts = await Item.find({ postedBy: req.user });
    const myClaims = await Item.find({ claimedBy: req.user });
    res.json({ success: true, myPosts, myClaims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    // Check ownership
    if (!item.postedBy || item.postedBy.toString() !== req.user) {
      return res.status(401).json({ error: 'Not authorized to delete this item' });
    }

    // Delete images from Cloudinary (only if they are Cloudinary URLs)
    if (item.images && item.images.length > 0) {
      for (const imgUrl of item.images) {
        try {
          if (imgUrl.includes('cloudinary.com')) {
            const parts = imgUrl.split('/');
            const fileName = parts[parts.length - 1].split('.')[0];
            const folder = parts[parts.length - 2];
            const publicId = `ecocart/items/${fileName}`;
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (err) {
          console.error('Failed to delete image from Cloudinary:', err);
        }
      }
    }

    await item.deleteOne();
    res.json({ success: true, message: 'Item removed' });
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
    item.claimedBy = req.user;
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
