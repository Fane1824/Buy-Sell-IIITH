const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  age: Number,
  contactNumber: String,
  password: { type: String, required: function() { return !this.isCasUser; } },
  cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  isCasUser: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

module.exports = User;