import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import Registration from './pages/registration.jsx';
import Login from './pages/login.jsx';
import Profile from './pages/profile.jsx';
import SearchItems from './pages/searchitems.jsx';
import OrderHistory from './pages/orderhistory.jsx';
import MyCart from './pages/mycart.jsx';
import DeliverItems from './pages/deliveritems.jsx';
import SellItems from './pages/sellitems.jsx';
import ItemDetails from './pages/itemdetails.jsx';
import Support from './pages/support.jsx';
import Register from './pages/register.jsx';

function PrivateRoute({ children }) {
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, document.title, location.pathname); // remove token from URL
      window.location.reload(); 
    }
  }, [location]);

  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/search-items" element={<PrivateRoute><SearchItems /></PrivateRoute>} />
        <Route path="/order-history" element={<PrivateRoute><OrderHistory /></PrivateRoute>} />
        <Route path="/my-cart" element={<PrivateRoute><MyCart /></PrivateRoute>} />
        <Route path="/deliver-items" element={<PrivateRoute><DeliverItems /></PrivateRoute>} />
        <Route path="/sell-items" element={<PrivateRoute><SellItems /></PrivateRoute>} />
        <Route path="/items/:id" element={<PrivateRoute><ItemDetails /></PrivateRoute>} />
        <Route path="/support" element={<PrivateRoute><Support /></PrivateRoute>} />
      </Routes>
    </Router>
  </StrictMode>,
);