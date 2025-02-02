// filepath: /Users/ishaan/Desktop/IIIT/sem4/dass/Buy-Sell-IIITH/2023114011/frontend/src/components/navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import '../design/navbar.css'; // Import the CSS file

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav>
      <ul>
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/search-items">Search Items</Link></li>
        <li><Link to="/order-history">Order History</Link></li>
        <li><Link to="/my-cart">My Cart</Link></li>
        <li><Link to="/deliver-items">Deliver Items</Link></li>
        <li><Link to="/support">Support</Link></li>
        <li><button onClick={handleLogout}>Logout</button></li>
      </ul>
    </nav>
  );
}

export default Navbar;