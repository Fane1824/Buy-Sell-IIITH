const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  age: Number,
  contactNumber: String,
  password: String,
  cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
});

const User = mongoose.model('User', userSchema);

module.exports = User;