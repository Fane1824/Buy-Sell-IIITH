// filepath: backend/models/Item.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  vendor: String,
  category: String,
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;