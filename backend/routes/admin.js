const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
    getAllUsers,
    getStats,
    deleteUser
} = require('../controllers/adminController');

router.get('/users', auth, admin, getAllUsers);
router.get('/stats', auth, admin, getStats);
router.delete('/users/:id', auth, admin, deleteUser);

module.exports = router;
