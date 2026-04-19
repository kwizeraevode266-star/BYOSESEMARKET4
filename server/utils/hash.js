const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePasswords(plain, hashed) {
    return await bcrypt.compare(plain, hashed);
}

module.exports = { hashPassword, comparePasswords };
