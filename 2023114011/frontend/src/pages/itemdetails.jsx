// filepath: /Users/ishaan/Desktop/IIIT/sem4/dass/Buy-Sell-IIITH/2023114011/frontend/src/pages/itemdetails.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/navbar';
import '../design/itemdetails.css'; // Import the CSS file

function ItemDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inCart, setInCart] = useState(false);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    fetchItemDetails();
    checkIfInCart();
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/items/${id}`);
      setItem(response.data);
      checkIfSeller(response.data.vendor);
    } catch (error) {
      console.error('Error fetching item details:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const checkIfSeller = async (vendor) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = response.data;
      if (vendor === user.firstName + ' ' + user.lastName) {
        setIsSeller(true);
      }
    } catch (error) {
      console.error('Error checking seller:', error);
    }
  };

  const checkIfInCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cartItems = response.data;
      setInCart(cartItems.some(cartItem => cartItem._id === id));
    } catch (error) {
      console.error('Error checking cart:', error);
    }
  };

  const handleAddToCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5001/cart', { itemId: id }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setSuccess(response.data.message);
        setError(''); // Clear any previous error
        setInCart(true); // Update the state to reflect the item is in the cart
      } else {
        setError(response.data.message);
        setSuccess(''); // Clear any previous success message
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('An error occurred. Please try again.');
      setSuccess(''); // Clear any previous success message
    }
  };

  const handleRemoveFromCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5001/cart/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setSuccess(response.data.message);
        setError(''); // Clear any previous error
        setInCart(false); // Update the state to reflect the item is not in the cart
      } else {
        setError(response.data.message);
        setSuccess(''); // Clear any previous success message
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      setError('An error occurred. Please try again.');
      setSuccess(''); // Clear any previous success message
    }
  };

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!item) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <Navbar />
      <div className="item-details-container">
        <h1>{item.name}</h1>
        <p>Description: {item.description}</p>
        <p>Price: ₹{item.price}</p>
        <p>Vendor: {item.vendor}</p>
        <p>Category: {item.category}</p>
        {!isSeller && (
          inCart ? (
            <button onClick={handleRemoveFromCart}>Remove from Cart</button>
          ) : (
            <button onClick={handleAddToCart}>Add to Cart</button>
          )
        )}
        {success && <p className="success-message">{success}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default ItemDetails;