const Item = require('../models/Item');
const fs = require('fs');
const path = require('path');
const multer = require('multer');


// Configure upload directory
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Enhanced Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

exports.upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3 // Max 3 images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ErrorResponse('Only JPEG, PNG, and WebP images are allowed', 400), false);
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

// Create Item with enhanced validation
exports.createItem = async (req, res, next) => {
  try {
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'condition', 'location'];
    const missingFields = requiredFields.filter(field => !req.body[field]?.trim());
    
    if (missingFields.length) {
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Process images
    const images = req.files?.map(file => `/uploads/${file.filename}`) || [];

    // Create and save item
    const item = new Item({
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      category: req.body.category.trim().toLowerCase(),
      condition: req.body.condition,
      location: req.body.location.trim(),
      images, // <-- now an array of strings
      postedBy: req.user,
    });

    const savedItem = await item.save();

    res.status(201).json({
      success: true,
      data: savedItem
    });

  } catch (err) {
    next(err);
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