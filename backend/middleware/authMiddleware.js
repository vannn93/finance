const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    let token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Akses ditolak. Tidak ada token.' });
    }

    try {
        if (token.startsWith('Bearer ')) token = token.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Token tidak valid' });
    }
};
