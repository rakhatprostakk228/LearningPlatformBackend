const jwt = require('jsonwebtoken');
const Token = require('../models/Token');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No auth token' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
            
            const tokenDoc = await Token.findOne({
                userId: decoded.id,
                token: token
            });

            if (!tokenDoc) {
                return res.status(401).json({ 
                    message: 'Session expired', 
                    code: 'SESSION_EXPIRED'
                });
            }

            tokenDoc.lastUsed = new Date();
            await tokenDoc.save();

            req.user = decoded;
            req.token = token;
            req.tokenDoc = tokenDoc;
            
            next();
        } catch (err) {
            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token' });
            }
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }
            throw err;
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error during authentication' });
    }
};

module.exports = auth;