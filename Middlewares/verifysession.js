const User = require('../Models/Users');

function verifySession(requiredRole) {
    return async (req, res, next) => {
        if (!req.session.userId) {
            return res.redirect("/compte")
        }

        try {
            const user = await User.findById(req.session.userId);

            if (!user) {
                return res.status(403).json({ message: 'User not found' });
            }

            req.user = user;

            if (requiredRole && user.role !== requiredRole) {
                return res.status(403).json({ message: 'Access denied: insufficient permissions' });
            }

            next();
        } catch (error) {
            console.error('Error verifying session:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
}

module.exports = verifySession;