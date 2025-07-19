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
  currentAction?: string | null; // 추가: 현재 실행 중인 액션
  gestureHoldProgress?: number; // 추가: 제스처 지속 시간 진행률 (0~1)
}

const GestureDisplay: React.FC<GestureDisplayProps> = ({
  staticGesture,
  dynamicGesture,
  confidence,
  debugInfo,
  currentAction,
  gestureHoldProgress = 0
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
        return '👉';
      case StaticGesture.RIGHT:
        return '👈';
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

  // 액션에 따른 텍스트와 아이콘
  const getActionText = (action: string) => {
    switch (action) {
      case 'scroll-up':
        return '스크롤 위로';
      case 'scroll-down':
        return '스크롤 아래로';
      case 'left':
        return '이전 탭';
      case 'right':
        return '다음 탭';
      case 'stop':
        return '페이지 새로고침';
      default:
        return action;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'scroll-up':
        return '⬆️';
      case 'scroll-down':
        return '⬇️';
      case 'left':
        return '◀️';
      case 'right':
        return '▶️';
      case 'stop':
        return '🔄';
      default:
        return '⚡';
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
      {/* 현재 실행 중인 액션 표시 */}
      {currentAction && (
        <div style={{
          marginBottom: '8px',
          padding: '6px',
          background: 'rgba(76, 175, 80, 0.3)',
          borderRadius: '4px',
          border: '1px solid #4CAF50'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#4CAF50',
            fontWeight: 'bold'
          }}>
            <span style={{ fontSize: '14px' }}>{getActionIcon(currentAction)}</span>
            <span>실행: {getActionText(currentAction)}</span>
          </div>
        </div>
      )}

      {/* 제스처 지속 시간 진행률 표시 */}
      {gestureHoldProgress > 0 && gestureHoldProgress < 1 && (
        <div style={{
          marginBottom: '8px',
          padding: '6px',
          background: 'rgba(255, 193, 7, 0.2)',
          borderRadius: '4px',
          border: '1px solid #FFC107'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#FFC107',
            fontSize: '11px'
          }}>
            <span>⏱️</span>
            <span>제스처 유지 중: {Math.round(gestureHoldProgress * 100)}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '3px',
            background: '#333',
            borderRadius: '2px',
            marginTop: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${gestureHoldProgress * 100}%`,
              height: '100%',
              background: '#FFC107',
              transition: 'width 0.1s ease'
            }} />
          </div>
        </div>
      )}

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