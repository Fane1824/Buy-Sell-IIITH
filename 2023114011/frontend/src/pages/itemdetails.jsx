// filepath: frontend/src/pages/ItemDetails.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/navbar';

function ItemDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/items/${id}`);
      setItem(response.data);
    } catch (error) {
      console.error('Error fetching item details:', error);
      setError('An error occurred. Please try again.');
    }
  };

  if (error) {
    return <p>{error}</p>;
  }

  if (!item) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <Navbar />
      <h1>{item.name}</h1>
      <p>Description: {item.description}</p>
      <p>Price: ₹{item.price}</p>
      <p>Vendor: {item.vendor}</p>
      <p>Category: {item.category}</p>
      <button>Add to Cart</button>
    </div>
  );
}

export default ItemDetails;