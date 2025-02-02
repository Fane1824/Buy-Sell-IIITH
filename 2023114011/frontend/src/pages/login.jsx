import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../design/login.css'; 

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        navigate('/profile');
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const handleCASLogin = () => {
    window.location.href = 'http://localhost:5001/api/auth/cas/login';
  };

  return (
    <div className="login-container">
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      <button onClick={() => navigate('/register')}>Go to Registration</button>
      <button onClick={handleCASLogin}>Login with CAS</button>
    </div>
  );
}

export default Login;