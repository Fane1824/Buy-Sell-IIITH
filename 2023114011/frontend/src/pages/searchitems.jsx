// filepath: frontend/src/pages/SearchItems.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/navbar';

function SearchItems() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    fetchItems();
  }, [search, selectedCategories]);

  const fetchItems = async () => {
    try {
      const response = await axios.get('http://localhost:5001/items', {
        params: {
          search: search || undefined,
          categories: selectedCategories.join(',') || undefined,
        },
      });
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div>
      <Navbar />
      <h1>Search Items</h1>
      <input
        type="text"
        placeholder="Search for items..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div>
        <h3>Categories</h3>
        {['Grocery', 'Misc', 'Books', 'Electronics', 'Food', 'Subscription'].map((category) => (
          <label key={category}>
            <input
              type="checkbox"
              value={category}
              checked={selectedCategories.includes(category)}
              onChange={() => handleCategoryChange(category)}
            />
            {category}
          </label>
        ))}
      </div>
      <div>
        <h2>Items</h2>
        {items.map((item) => (
          <div key={item._id}>
            <h3>
              <Link to={`/items/${item._id}`}>{item.name}</Link>
            </h3>
            <p>Description: {item.description}</p>
            <p>Price: ₹{item.price}</p>
            <p>Vendor: {item.vendor}</p>
            <p>Category: {item.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchItems;