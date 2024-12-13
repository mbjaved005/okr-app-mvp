
const mongoose = require('mongoose');
const userSchema = require('./user');

// Compile the User model once and export it
const User = mongoose.model('User', userSchema);

module.exports = {
  User
};

