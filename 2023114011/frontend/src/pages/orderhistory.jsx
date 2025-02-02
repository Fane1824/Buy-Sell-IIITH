import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/navbar';
import '../design/orderhistory.css'; 

function OrderHistory() {
  const [activeTab, setActiveTab] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingOrders();
    } else if (activeTab === 'bought') {
      fetchBoughtOrders();
    } else if (activeTab === 'sold') {
      fetchSoldOrders();
    }
  }, [activeTab]);

  const fetchPendingOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/orders/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const fetchBoughtOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/orders/bought', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching bought orders:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const fetchSoldOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/orders/sold', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching sold orders:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'pending':
        return (
          <div>
            {orders.map((order) => (
              <div key={order._id} className="order">
                <h3>{order.itemName}</h3>
                <p>Price: ₹{order.price}</p>
                <p>Seller: {order.sellerName}</p>
                <p>OTP: {order.unhashedOtp}</p>
              </div>
            ))}
          </div>
        );
      case 'bought':
        return (
          <div>
            {orders.map((order) => (
              <div key={order._id} className="order">
                <h3>{order.itemName}</h3>
                <p>Price: ₹{order.price}</p>
                <p>Seller: {order.sellerName}</p>
              </div>
            ))}
          </div>
        );
      case 'sold':
        return (
          <div>
            {orders.map((order) => (
              <div key={order._id} className="order">
                <h3>{order.itemName}</h3>
                <p>Price: ₹{order.price}</p>
                <p>Buyer: {order.buyerName}</p>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <Navbar />
      <div className="order-history-container">
        <h1>Order History</h1>
        <div className="tabs">
          <button onClick={() => setActiveTab('pending')} className={activeTab === 'pending' ? 'active' : ''}>
            Pending Orders
          </button>
          <button onClick={() => setActiveTab('bought')} className={activeTab === 'bought' ? 'active' : ''}>
            Items Bought
          </button>
          <button onClick={() => setActiveTab('sold')} className={activeTab === 'sold' ? 'active' : ''}>
            Items Sold
          </button>
        </div>
        <div className="tab-content">
          {error && <p className="error-message">{error}</p>}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default OrderHistory;