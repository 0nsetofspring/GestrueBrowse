import React from 'react';

interface ControlButtonProps {
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export const ControlButton: React.FC<ControlButtonProps> = ({ isActive, isLoading, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        backgroundColor: isLoading ? '#cccccc' : (isActive ? '#f44336' : '#4CAF50'),
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        margin: '5px',
        opacity: isLoading ? 0.6 : 1
      }}
    >
      {isLoading ? '초기화 중...' : (isActive ? '중지' : '시작')}
    </button>
  );
}; 