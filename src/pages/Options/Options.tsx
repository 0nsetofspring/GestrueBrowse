import React, { useState, useEffect } from 'react';
import './Options.css';

interface ScrollSettings {
  scrollValue: number;
  scrollBehavior: 'auto' | 'smooth' | 'instant';
}

const Options: React.FC = () => {
  const [settings, setSettings] = useState<ScrollSettings>({
    scrollValue: 100,
    scrollBehavior: 'instant'
  });

  // 설정 로드
  useEffect(() => {
    chrome.storage.sync.get(['scrollValue', 'scrollBehavior'], (result) => {
      setSettings({
        scrollValue: result['scrollValue'] || 100,
        scrollBehavior: result['scrollBehavior'] || 'instant'
      });
    });
  }, []);

  // 설정 저장
  const saveSettings = (newSettings: ScrollSettings) => {
    chrome.storage.sync.set({
      scrollValue: newSettings.scrollValue,
      scrollBehavior: newSettings.scrollBehavior
    });
    setSettings(newSettings);
  };

  return (
    <div className="OptionsContainer">
      <h1>스크롤 설정</h1>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          스크롤 거리 (픽셀):
        </label>
        <input
          type="number"
          value={settings.scrollValue}
          onChange={(e) => saveSettings({
            ...settings,
            scrollValue: parseInt(e.target.value) || 100
          })}
          min="10"
          max="1000"
          style={{
            padding: '8px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            width: '100px'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          스크롤 동작:
        </label>
        <select
          value={settings.scrollBehavior}
          onChange={(e) => saveSettings({
            ...settings,
            scrollBehavior: e.target.value as 'auto' | 'smooth' | 'instant'
          })}
          style={{
            padding: '8px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            width: '150px'
          }}
        >
          <option value="instant">즉시 (instant)</option>
          <option value="smooth">부드럽게 (smooth)</option>
          <option value="auto">자동 (auto)</option>
        </select>
      </div>

      <div style={{
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        <h3>설정 미리보기</h3>
        <p><strong>스크롤 거리:</strong> {settings.scrollValue}px</p>
        <p><strong>스크롤 동작:</strong> {settings.scrollBehavior}</p>
      </div>
    </div>
  );
};

export default Options;
