const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'change_me_very_secret';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(payload) {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
    try {
        return { valid: true, payload: jwt.verify(token, SECRET) };
    } catch (e) {
        return { valid: false, error: e };
    }
}

module.exports = { generateToken, verifyToken };
