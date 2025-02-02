import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import '../design/profile.css'; 

function Profile() {
  const [user, setUser] = useState({});
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      navigate('/profile', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:5001/profile', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setSuccess(response.data.message);
        fetchUserDetails();
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="profile-container">
        <h1>Profile Page</h1>
        <form className="profile-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName || ''}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName || ''}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email || ''}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age || ''}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="contactNumber"
            placeholder="Contact Number"
            value={formData.contactNumber || ''}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
          />
          <button type="submit">Update Profile</button>
        </form>
        {error && <p>{error}</p>}
        {success && <p className="success">{success}</p>}
        <button className="sell-items-button" onClick={() => navigate('/sell-items')}>Sell Items</button>
      </div>
    </div>
  );
}

export default Profile;