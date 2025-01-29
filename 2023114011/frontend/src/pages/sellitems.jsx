// filepath: frontend/src/pages/SellItems.jsx
import { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/navbar';

function SellItems() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5001/items', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setSuccess(response.data.message);
        setFormData({ name: '', description: '', price: '', category: '' });
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      <Navbar />
      <h1>Sell Items Page</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Item Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Item Description"
          value={formData.description}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="price"
          placeholder="Price (in rupees)"
          value={formData.price}
          onChange={handleChange}
          required
        />
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          <option value="Grocery">Grocery</option>
          <option value="Misc">Misc</option>
          <option value="Books">Books</option>
          <option value="Electronics">Electronics</option>
          <option value="Food">Food</option>
          <option value="Subscription">Subscription</option>
        </select>
        <button type="submit">Add Item</button>
      </form>
      {error && <p>{error}</p>}
      {success && <p>{success}</p>}
    </div>
  );
}

export default SellItems;