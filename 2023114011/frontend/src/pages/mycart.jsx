import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/navbar';
import '../design/mycart.css';

function MyCart() {
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems(response.data);
      calculateTotalCost(response.data);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const calculateTotalCost = (items) => {
    const total = items.reduce((sum, item) => sum + item.price, 0);
    setTotalCost(total);
  };

  const handleRemoveFromCart = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5001/cart/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setCartItems(cartItems.filter(item => item._id !== itemId));
        calculateTotalCost(cartItems.filter(item => item._id !== itemId));
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5001/order', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setSuccess(response.data.message);
        setCartItems([]);
        setTotalCost(0);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="my-cart-container">
        <h1>My Cart</h1>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <div>
          {cartItems.map((item) => (
            <div key={item._id} className="cart-item">
              <h3>{item.name}</h3>
              <p>Price: ₹{item.price}</p>
              <button onClick={() => handleRemoveFromCart(item._id)}>Remove from Cart</button>
            </div>
          ))}
        </div>
        <h2>Total Cost: ₹{totalCost}</h2>
        <button onClick={handlePlaceOrder}>Final Order</button>
      </div>
    </div>
  );
}

export default MyCart;