import React, { useState } from 'react';
import logo from '../../assets/img/logo.svg';
import './Popup.css';

const Popup: React.FC = () => {
  const [gesture, setGesture] = useState('');

  const handleSendGesture = () => {
    if (gesture.trim()) {
      chrome.runtime.sendMessage({
        type: "gesture",
        gesture: gesture.trim()
      });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div style={{ marginTop: '20px' }}>
          <input
            type="text"
            value={gesture}
            onChange={e => setGesture(e.target.value)}
            placeholder="제스처 입력 (예: left, right)"
            style={{ padding: '8px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            onClick={handleSendGesture}
            style={{
              marginLeft: '8px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px'
            }}
          >
            실행
          </button>
        </div>
      </header>
    </div>
  );
};

export default Popup;