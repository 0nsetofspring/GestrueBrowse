import React, { useState } from 'react'; // useState를 import 합니다.
import logo from '../../assets/img/logo.svg';
import './Popup.css';

const Popup: React.FC = () => {
  const [isOn, setIsOn] = useState(false); // 토글 상태를 관리하는 useState 훅을 추가합니다.

  const handleToggle = () => {
    setIsOn(!isOn); // 토글 상태를 반전시키는 함수입니다.
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/pages/Popup/Popup.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React!
        </a>

        {/* 토글 버튼 추가 */}
        <div style={{ marginTop: '20px' }}>
          <button onClick={handleToggle} style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: isOn ? '#4CAF50' : '#f44336', // 상태에 따라 색상 변경
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}>
            {isOn ? 'On' : 'Off'}
          </button>
          <p>현재 상태: {isOn ? '켜짐' : '꺼짐'}</p>
        </div>
      </header>
    </div>
  );
};

export default Popup;