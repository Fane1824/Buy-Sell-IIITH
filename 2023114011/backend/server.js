// filepath: backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('./models/user');
const Item = require('./models/item');
const Order = require('./models/order');
const crypto = require('crypto');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001; // Change the port number here

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.post('/register', async (req, res) => {
  const { firstName, lastName, email, age, contactNumber, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      age,
      contactNumber,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error); // Log the error details
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error('Login error:', error); // Log the error details
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// Middleware to authenticate the user
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

// Route to fetch user details
app.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.status(200).json(user);
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// Route to update user details
app.put('/profile', authenticate, async (req, res) => {
  const { firstName, lastName, email, age, contactNumber, password } = req.body;

  try {
    const user = await User.findById(req.userId);

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.age = age || user.age;
    user.contactNumber = contactNumber || user.contactNumber;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// Route to fetch items
app.get('/items', async (req, res) => {
  const { search, categories } = req.query;
  const query = {};

  if (search) {
    query.name = { $regex: search, $options: 'i' }; // Case insensitive search
  }

  if (categories) {
    query.category = { $in: categories.split(',') };
  }

  try {
    const items = await Item.find(query);
    res.status(200).json(items);
  } catch (error) {
    console.error('Fetch items error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// Route to fetch a single item by ID
app.get('/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    console.error('Fetch item error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// Route to add an item
app.post('/items', authenticate, async (req, res) => {
  const { name, description, price, category } = req.body;

  try {
    const user = await User.findById(req.userId);
    const newItem = new Item({
      name,
      description,
      price,
      category,
      vendor: user.firstName + ' ' + user.lastName,
    });

    await newItem.save();
    res.status(201).json({ success: true, message: 'Item added successfully' });
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// Route to add an item to the cart
app.post('/cart', authenticate, async (req, res) => {
  const { itemId } = req.body;

  try {
    const user = await User.findById(req.userId);
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.vendor === user.firstName + ' ' + user.lastName) {
      return res.status(400).json({ success: false, message: 'You cannot purchase your own product' });
    }

    user.cart.push(itemId);
    await user.save();
    res.status(200).json({ success: true, message: 'Item added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// Route to fetch cart items
app.get('/cart', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('cart');
    res.status(200).json(user.cart);
  } catch (error) {
    console.error('Fetch cart error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// Route to remove an item from the cart
app.delete('/cart/:itemId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.cart = user.cart.filter(itemId => itemId.toString() !== req.params.itemId);
    await user.save();
    res.status(200).json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

app.post('/order', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('cart');
    const items = user.cart;

    if (items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in cart' });
    }

    const orders = await Promise.all(items.map(async (item) => {
      const otp = crypto.randomInt(100000, 999999).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);

      const order = new Order({
        itemName: item.name,
        sellerName: item.vendor,
        buyerName: `${user.firstName} ${user.lastName}`,
        price: item.price,
        status: 'pending',
        hashedOtp,
        unhashedOtp: otp,
      });

      await order.save();
      await Item.findByIdAndDelete(item._id);

      return order;
    }));

    user.cart = [];
    await user.save();

    res.status(200).json({ success: true, message: 'Order placed successfully', orders });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

app.get('/orders/pending', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const buyerName = `${user.firstName} ${user.lastName}`;
    const orders = await Order.find({ buyerName, status: 'pending' });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Fetch pending orders error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

app.get('/orders/seller/pending', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const sellerName = `${user.firstName} ${user.lastName}`;
    const orders = await Order.find({ sellerName, status: 'pending' });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Fetch pending orders error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

app.post('/orders/:orderId/verify-otp', authenticate, async (req, res) => {
  const { otp } = req.body;
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isMatch = await bcrypt.compare(otp, order.hashedOtp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// Complete transaction
app.post('/orders/:orderId/complete', authenticate, async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = 'completed';
    await order.save();

    res.status(200).json({ success: true, message: 'Transaction completed successfully' });
  } catch (error) {
    console.error('Complete transaction error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

app.get('/orders/bought', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const buyerName = `${user.firstName} ${user.lastName}`;
    const orders = await Order.find({ buyerName, status: 'completed' });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Fetch completed orders error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

app.get('/orders/sold', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const sellerName = `${user.firstName} ${user.lastName}`;
    const orders = await Order.find({ sellerName, status: 'completed' });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Fetch completed orders error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});