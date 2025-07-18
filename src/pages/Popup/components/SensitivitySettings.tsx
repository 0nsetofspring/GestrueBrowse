import React, { useState } from 'react';
import { GestureSettings, DEFAULT_GESTURE_SETTINGS, GESTURE_SENSITIVITY_PRESETS } from '../types/gestureSettings';

interface SensitivitySettingsProps {
  settings: GestureSettings;
  onSettingsChange: (settings: GestureSettings) => void;
  isVisible: boolean;
  onToggle: () => void;
}

const SensitivitySettings: React.FC<SensitivitySettingsProps> = ({
  settings,
  onSettingsChange,
  isVisible,
  onToggle
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');

  const handlePresetChange = (presetKey: keyof typeof GESTURE_SENSITIVITY_PRESETS) => {
    onSettingsChange(GESTURE_SENSITIVITY_PRESETS[presetKey].settings);
  };

  const handleCustomSettingChange = (
    category: keyof GestureSettings,
    key: string,
    value: number
  ) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    onSettingsChange(newSettings);
  };

  const getCurrentPreset = () => {
    for (const [key, preset] of Object.entries(GESTURE_SENSITIVITY_PRESETS)) {
      if (JSON.stringify(preset.settings) === JSON.stringify(settings)) {
        return key as keyof typeof GESTURE_SENSITIVITY_PRESETS;
      }
    }
    return null;
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 1001
        }}
      >
        ⚙️ 민감도 설정
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.95)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      zIndex: 1001,
      minWidth: '280px',
      maxHeight: '400px',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '14px' }}>제스처 민감도 설정</h3>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '0'
          }}
        >
          ✕
        </button>
      </div>

      {/* 탭 버튼 */}
      <div style={{ display: 'flex', marginBottom: '15px', borderBottom: '1px solid #444' }}>
        <button
          onClick={() => setActiveTab('preset')}
          style={{
            background: activeTab === 'preset' ? '#4CAF50' : 'transparent',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0'
          }}
        >
          프리셋
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          style={{
            background: activeTab === 'custom' ? '#4CAF50' : 'transparent',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0'
          }}
        >
          커스텀
        </button>
      </div>

      {activeTab === 'preset' && (
        <div>
          <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#ccc' }}>
            미리 정의된 민감도 설정을 선택하세요
          </p>
          {Object.entries(GESTURE_SENSITIVITY_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handlePresetChange(key as keyof typeof GESTURE_SENSITIVITY_PRESETS)}
              style={{
                display: 'block',
                width: '100%',
                background: getCurrentPreset() === key ? '#4CAF50' : '#333',
                border: '1px solid #555',
                color: 'white',
                padding: '8px 12px',
                margin: '5px 0',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                textAlign: 'left'
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'custom' && (
        <div>
          <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#ccc' }}>
            세부 설정을 직접 조정하세요
          </p>

          {/* 정적 제스처 설정 */}
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#4CAF50' }}>정적 제스처</h4>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px' }}>
                손가락 감지 임계값: {settings.static.fingerThreshold.toFixed(3)}
              </label>
              <input
                type="range"
                min="0.01"
                max="0.05"
                step="0.001"
                value={settings.static.fingerThreshold}
                onChange={(e) => handleCustomSettingChange('static', 'fingerThreshold', parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px' }}>
                방향 감지 임계값: {settings.static.directionThreshold.toFixed(3)}
              </label>
              <input
                type="range"
                min="0.05"
                max="0.15"
                step="0.005"
                value={settings.static.directionThreshold}
                onChange={(e) => handleCustomSettingChange('static', 'directionThreshold', parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px' }}>
                최대 허용 손가락 개수: {settings.static.maxExtendedFingers}
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={settings.static.maxExtendedFingers}
                onChange={(e) => handleCustomSettingChange('static', 'maxExtendedFingers', parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* 동적 제스처 설정 */}
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#FF9800' }}>동적 제스처</h4>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px' }}>
                움직임 임계값: {settings.dynamic.movementThreshold.toFixed(3)}
              </label>
              <input
                type="range"
                min="0.03"
                max="0.12"
                step="0.005"
                value={settings.dynamic.movementThreshold}
                onChange={(e) => handleCustomSettingChange('dynamic', 'movementThreshold', parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px' }}>
                최소 프레임 수: {settings.dynamic.minFrames}
              </label>
              <input
                type="range"
                min="3"
                max="8"
                step="1"
                value={settings.dynamic.minFrames}
                onChange={(e) => handleCustomSettingChange('dynamic', 'minFrames', parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px' }}>
                일관된 방향 최소 프레임: {settings.dynamic.minConsistentFrames}
              </label>
              <input
                type="range"
                min="2"
                max="5"
                step="1"
                value={settings.dynamic.minConsistentFrames}
                onChange={(e) => handleCustomSettingChange('dynamic', 'minConsistentFrames', parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* 기본 설정 초기화 버튼 */}
          <button
            onClick={() => onSettingsChange(DEFAULT_GESTURE_SETTINGS)}
            style={{
              background: '#666',
              border: 'none',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              width: '100%'
            }}
          >
            기본값으로 초기화
          </button>
        </div>
      )}
    </div>
  );
};

export default SensitivitySettings; 