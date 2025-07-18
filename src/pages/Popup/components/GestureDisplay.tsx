import React from 'react';
import { StaticGesture, DynamicGesture } from '../enums/gesture';

interface GestureDisplayProps {
  staticGesture: StaticGesture;
  dynamicGesture: DynamicGesture;
  confidence: number;
  debugInfo?: {
    deltaX?: number;
    deltaY?: number;
    movementThreshold?: number;
    recentGestures?: DynamicGesture[];
  };
}

const GestureDisplay: React.FC<GestureDisplayProps> = ({
  staticGesture,
  dynamicGesture,
  confidence,
  debugInfo
}) => {
  // 제스처에 따른 색상과 아이콘 결정
  const getGestureColor = (gesture: StaticGesture | DynamicGesture) => {
    if (gesture === StaticGesture.NONE || gesture === DynamicGesture.NONE) {
      return '#666';
    }
    return '#4CAF50';
  };

  const getGestureIcon = (gesture: StaticGesture | DynamicGesture) => {
    switch (gesture) {
      case StaticGesture.STOP:
        return '✋';
      case StaticGesture.LEFT:
        return '👈';
      case StaticGesture.RIGHT:
        return '👉';
      case StaticGesture.UP:
        return '👆';
      case StaticGesture.DOWN:
        return '👇';
      case DynamicGesture.SWIPE_LEFT:
        return '⬅️';
      case DynamicGesture.SWIPE_RIGHT:
        return '➡️';
      case DynamicGesture.SWIPE_UP:
        return '⬆️';
      case DynamicGesture.SWIPE_DOWN:
        return '⬇️';
      default:
        return '❓';
    }
  };

  const getGestureText = (gesture: StaticGesture | DynamicGesture) => {
    switch (gesture) {
      case StaticGesture.STOP:
        return '정지';
      case StaticGesture.LEFT:
        return '왼쪽';
      case StaticGesture.RIGHT:
        return '오른쪽';
      case StaticGesture.UP:
        return '위쪽';
      case StaticGesture.DOWN:
        return '아래쪽';
      case DynamicGesture.SWIPE_LEFT:
        return '왼쪽 스와이프';
      case DynamicGesture.SWIPE_RIGHT:
        return '오른쪽 스와이프';
      case DynamicGesture.SWIPE_UP:
        return '위쪽 스와이프';
      case DynamicGesture.SWIPE_DOWN:
        return '아래쪽 스와이프';
      default:
        return '인식 안됨';
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      zIndex: 1000,
      minWidth: '120px'
    }}>
      <div style={{ marginBottom: '8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: getGestureColor(staticGesture)
        }}>
          <span style={{ fontSize: '16px' }}>{getGestureIcon(staticGesture)}</span>
          <span>정적: {getGestureText(staticGesture)}</span>
        </div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: getGestureColor(dynamicGesture)
        }}>
          <span style={{ fontSize: '16px' }}>{getGestureIcon(dynamicGesture)}</span>
          <span>동적: {getGestureText(dynamicGesture)}</span>
        </div>
      </div>

      {confidence > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '10px',
          color: '#FFD700'
        }}>
          <span>신뢰도:</span>
          <div style={{
            width: '40px',
            height: '4px',
            background: '#333',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${confidence * 100}%`,
              height: '100%',
              background: '#4CAF50',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span>{Math.round(confidence * 100)}%</span>
        </div>
      )}

      {/* 디버그 정보 표시 */}
      {debugInfo && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          background: 'rgba(255, 255, 0, 0.1)',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#FFD700'
        }}>
          <div>움직임: X={debugInfo.deltaX?.toFixed(4) || '0'}, Y={debugInfo.deltaY?.toFixed(4) || '0'}</div>
          <div>임계값: {debugInfo.movementThreshold?.toFixed(4) || '0'}</div>
          <div>최근 제스처: {debugInfo.recentGestures?.join(', ') || '없음'}</div>
        </div>
      )}
    </div>
  );
};

export default GestureDisplay; 