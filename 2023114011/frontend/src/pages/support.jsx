import { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/navbar';

function Support() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages([...messages, userMessage]);
    setInput('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5001/chat', { message: input }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const botMessage = { sender: 'bot', text: response.data.reply };
      setMessages([...messages, userMessage, botMessage]);
      setError(''); 
    } catch (error) {
      console.error('Error sending message:', error);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      <Navbar />
      <h1>Support</h1>
      <div className="chat-container">
        <div className="chat-box">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
        {error && <p>{error}</p>}
      </div>
    </div>
  );
}

export default Support;