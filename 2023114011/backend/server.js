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
const CAS = require('cas-authentication');
const session = require('express-session');

const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Secret key for session encryption
    resave: false, // Do not resave unchanged sessions
    saveUninitialized: true, // Save new sessions
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


const cas = new CAS({
  cas_url: process.env.CAS_URL || 'https://login.iiit.ac.in/cas', // CAS server URL
  service_url: process.env.SERVICE_URL || 'http://localhost:5001', 
  cas_version: '3.0', // CAS protocol version
});

// CAS middleware
app.use((req, res, next) => {
  req.cas = cas;
  next();
});


app.post('/register', async (req, res) => {
  const { firstName, lastName, email, age, contactNumber, password, isCasUser } = req.body; // 

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = isCasUser ? null : await bcrypt.hash(password, 10); 

    const newUser = new User({
      firstName,
      lastName,
      email,
      age,
      contactNumber,
      password: hashedPassword,
      isCasUser 
    });

    await newUser.save();
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error); // log error details
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
    console.error('Login error:', error); // log the error details
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// authenticates the user
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
    console.error('Authentication error:', error);
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

// fetches user details
app.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.status(200).json(user);
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// updates user details
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

// fetches items
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

// fetches a single item by ID
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

// adds an item
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

// adds an item to the cart
app.post('/cart', authenticate, async (req, res) => {
  const { itemId } = req.body;

  try {
    const user = await User.findById(req.userId);
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.vendor === user.firstName + ' ' + user.lastName) {
      // seller attempting to add their own product to cart
      return res.status(200).json({ success: false, message: 'You cannot purchase your own product' });
    }

    if (user.cart.includes(itemId)) {
      // buyer trying to add the same item to cart multiple times
      return res.status(200).json({ success: true, message: 'Item already in cart' });
    }

    user.cart.push(itemId);
    await user.save();
    res.status(200).json({ success: true, message: 'Item added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// fetches cart items
app.get('/cart', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('cart');
    res.status(200).json(user.cart);
  } catch (error) {
    console.error('Fetch cart items error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// removes an item from the cart
app.delete('/cart/:itemId', authenticate, async (req, res) => {
  const { itemId } = req.params;

  try {
    const user = await User.findById(req.userId);

    if (!user.cart.includes(itemId)) {
      return res.status(400).json({ success: false, message: 'Item not in cart' });
    }

    user.cart = user.cart.filter(id => id.toString() !== itemId);
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

      // remove item from the carts of all users
      await User.updateMany(
        { cart: item._id },
        { $pull: { cart: item._id } }
      );

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

// fetches pending orders for the user
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

// fetches completed orders for the user
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

// Fetch pending orders for the user
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

// verify OTP
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

// complete transaction
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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.post('/chat', authenticate, async (req, res) => {
  const { message } = req.body;

  try {
    console.log('Sending message to AI model:', message);

    const result = await model.generateContent(message);
    const reply = result.response.text();

    console.log('Received response from AI model:', reply);

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat error:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});
app.get('/api/auth/cas/login', cas.bounce, async (req, res) => {
  const username = req.session.cas_user;
  const email = `${username}`;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      // redirect to registration page with email pre-filled
      return res.redirect(`http://localhost:5173/register?email=${email}`);
    }

    // user exists, create JWT token and redirect to profile
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.redirect(`http://localhost:5173/profile?token=${token}`);
  } catch (error) {
    console.error('CAS login error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

app.post('/register/cas', async (req, res) => {
  const { firstName, lastName, email, age, contactNumber } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      age,
      contactNumber,
      isCasUser: true
    });

    await newUser.save();
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ success: true, token, message: 'User registered successfully' });
  } catch (error) {
    console.error('CAS registration error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});