import React from 'react';
import logo from '../../assets/img/logo.svg';
import './Popup.css';

const Popup: React.FC = () => {
  const handleSendGesture = (gesture: string) => {
    chrome.runtime.sendMessage({
      type: "gesture",
      gesture: gesture
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => handleSendGesture('left')}
              style={{
                padding: '10px 15px',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                minWidth: '80px'
              }}
            >
              Left
            </button>
            <button
              onClick={() => handleSendGesture('right')}
              style={{
                padding: '10px 15px',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                minWidth: '80px'
              }}
            >
              Right
            </button>
            <button
              onClick={() => handleSendGesture('scroll-up')}
              style={{
                padding: '10px 15px',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                minWidth: '80px'
              }}
            >
              Scroll Up
            </button>
            <button
              onClick={() => handleSendGesture('scroll-down')}
              style={{
                padding: '10px 15px',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                minWidth: '80px'
              }}
            >
              Scroll Down
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Popup;