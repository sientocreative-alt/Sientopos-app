const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Token format: "Bearer <token>"
    const tokenString = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

    try {
        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
