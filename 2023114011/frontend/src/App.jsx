import { useState } from 'react'
import './App.css'

import { Link } from 'react-router-dom';

function App() {
  return (
    <div>
      <h1>Welcome to the Website</h1>
      <Link to="/register">Go to Registration</Link>
    </div>
  );
}

export default App;

