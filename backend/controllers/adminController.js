const User = require('../models/User');
const Item = require('../models/Item');

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Dashboard Stats
exports.getStats = async (req, res) => {
    try {
        const totalItems = await Item.countDocuments();
        const totalUsers = await User.countDocuments();
        const claimedItems = await Item.countDocuments({ claimedBy: { $ne: null } });

        res.json({
            success: true,
            data: {
                totalItems,
                totalUsers,
                claimedItems,
                pendingItems: totalItems - claimedItems
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete any user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Safety: Don't let an admin delete themselves
        if (user._id.toString() === req.user) {
            return res.status(400).json({ error: 'Admins cannot delete themselves' });
        }

        await Item.deleteMany({ postedBy: user._id });
        await user.deleteOne();

        res.json({ success: true, message: 'User and their items removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
