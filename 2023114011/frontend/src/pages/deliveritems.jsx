// filepath: /Users/ishaan/Desktop/IIIT/sem4/dass/Buy-Sell-IIITH/2023114011/frontend/src/pages/deliveritems.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/navbar';
import '../design/deliveritems.css'; // Import the CSS file

function DeliverItems() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState({});
  const [verifiedOrders, setVerifiedOrders] = useState({});

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/orders/seller/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const handleOtpChange = (orderId, value) => {
    setOtp({ ...otp, [orderId]: value });
  };

  const handleVerifyOtp = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5001/orders/${orderId}/verify-otp`, { otp: otp[orderId] }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setVerifiedOrders({ ...verifiedOrders, [orderId]: true });
        setError('');
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const handleEndTransaction = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5001/orders/${orderId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setOrders(orders.filter(order => order._id !== orderId));
        setVerifiedOrders({ ...verifiedOrders, [orderId]: false });
        setError('');
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error completing transaction:', error);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="deliver-items-container">
        <h1>Deliver Items</h1>
        {error && <p className="error-message">{error}</p>}
        <div>
          {orders.map((order) => (
            <div key={order._id} className="order">
              <h3>{order.itemName}</h3>
              <p>Price: ₹{order.price}</p>
              <p>Buyer: {order.buyerName}</p>
              {verifiedOrders[order._id] ? (
                <button onClick={() => handleEndTransaction(order._id)}>End Transaction</button>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp[order._id] || ''}
                    onChange={(e) => handleOtpChange(order._id, e.target.value)}
                  />
                  <button onClick={() => handleVerifyOtp(order._id)}>Verify</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DeliverItems;