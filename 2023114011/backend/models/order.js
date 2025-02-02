const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  sellerName: { type: String, required: true },
  buyerName: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  hashedOtp: { type: String, required: true },
  unhashedOtp: { type: String, required: true },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;