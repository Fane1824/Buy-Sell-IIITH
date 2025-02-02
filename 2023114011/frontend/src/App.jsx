import { useState } from 'react'
import './App.css'

import { Link } from 'react-router-dom';

function App() {
  return (
    <div>
      <h1>Welcome to Buy-Sell IIITH</h1>
      <Link to="/registration">Go to Registration</Link>
      <Link to="/login">Go to Login</Link>
    </div>
  );
}

export default App;

