const bcrypt = require("bcryptjs");

const MIN_PASSWORD_LENGTH = 10;

function validatePassword(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw Object.assign(new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`), { status: 400 });
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw Object.assign(new Error("Password must include at least one letter and one number."), { status: 400 });
  }
}

async function hashPassword(password) {
  validatePassword(password);
  return bcrypt.hash(password, 12);
}

function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { hashPassword, comparePassword, validatePassword };
