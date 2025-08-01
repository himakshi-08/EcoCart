const Item = require('../models/Item');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ErrorResponse = require('../utils/errorResponse'); // ✅ Added for proper error handling

// Configure upload directory
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Uploads directory created');
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// Multer upload middleware
exports.upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 3 }, // 5MB per file, max 3 files
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ErrorResponse('Only JPEG, PNG, and WebP images are allowed', 400), false);
    }
  }
});

// Helper: Cleanup uploaded files if error occurs
const cleanupFiles = (files) => {
  if (!files || !files.length) return;
  files.forEach(file => {
    try {
      const filePath = path.join(uploadDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑 Cleaned up: ${filePath}`);
      }
    } catch (err) {
      console.error(`❌ Cleanup failed for ${file.filename}:`, err);
    }
  });
};

// ✅ Create Item
exports.createItem = async (req, res, next) => {
  try {
    const requiredFields = ['title', 'description', 'category', 'condition', 'location'];
    const missingFields = requiredFields.filter(field => !req.body[field]?.trim());

    if (missingFields.length) {
      cleanupFiles(req.files);
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Process images
    const images = req.files?.map(file => `/uploads/${file.filename}`) || [];

    // Create item
    const item = new Item({
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      category: req.body.category.trim().toLowerCase(),
      condition: req.body.condition,
      location: req.body.location.trim(),
      images,
      postedBy: req.user
    });

    const savedItem = await item.save();
    res.status(201).json({ success: true, data: savedItem });
  } catch (err) {
    cleanupFiles(req.files);
    next(err);
  }
};

// ✅ Get All Items
exports.getAllItems = async (req, res) => {
  try {
    const items = await Item.find()
      .populate('postedBy', 'name')
      .populate('claimedBy', 'name');

    // Add full image URL for frontend
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const itemsWithImages = items.map(item => ({
      ...item.toObject(),
      images: item.images.map(img => `${baseUrl}${img}`)
    }));

    res.json({ success: true, data: itemsWithImages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Single Item by ID
exports.getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('postedBy', 'name')
      .populate('claimedBy', 'name');

    if (!item) return res.status(404).json({ error: 'Item not found' });

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const itemWithImage = {
      ...item.toObject(),
      images: item.images.map(img => `${baseUrl}${img}`)
    };

    res.json({ success: true, item: itemWithImage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Claim Item
exports.claimItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.claimedBy) return res.status(400).json({ error: 'Item already claimed' });

    item.claimedBy = req.user._id;
    await item.save();

    res.json({ success: true, message: 'Item claimed successfully', data: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Error Handler Middleware
exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
