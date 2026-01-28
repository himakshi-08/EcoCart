const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        // req.user is the ID from the auth middleware
        const user = await User.findById(req.user);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin portal only.' });
        }

        next();
    } catch (err) {
        res.status(500).json({ error: 'Server error during authorization' });
    }
};
