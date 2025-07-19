import React, { useRef, useState, useEffect } from 'react';
import { useHandDetection } from './hooks/useHandDetection';
import { useCamera } from './hooks/useCamera';
import { renderHandLandmarks } from './utils/handRenderer';
import { CameraView } from './components/CameraView';
import { ControlButton } from './components/ControlButton';
import GestureDisplay from './components/GestureDisplay';
import SensitivitySettings from './components/SensitivitySettings';
import { GestureSettings, DEFAULT_GESTURE_SETTINGS } from './types/gestureSettings';
import './Popup.css';

const Popup: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false);

  // isActive 상태 변경 추적
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 제스처 설정 상태
  const [gestureSettings, setGestureSettings] = useState<GestureSettings>(DEFAULT_GESTURE_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  // 커스텀 훅 사용
  const {
    createHandDetector,
    detectHandsWithTensorFlow,
    disposeDetector,
    processingCanvasRef,
    currentStaticGesture,
    currentDynamicGesture,
    gestureConfidence,
    debugInfo
  } = useHandDetection(gestureSettings);
  const { startCamera, stopCamera } = useCamera();

  // 메인 루프 함수
  const detectHands = async () => {
    try {
      // 1. TensorFlow.js로 손 감지
      const hands = await detectHandsWithTensorFlow(videoRef);

      // 2. 결과를 렌더링
      renderHandLandmarks(Array.isArray(hands) ? hands : [], canvasRef, processingCanvasRef);

      // 3. 다음 프레임 요청 (성능 최적화를 위해 약간의 지연 추가)
      if (isActiveRef.current) {
        setTimeout(() => {
          if (isActiveRef.current) {
            animationFrameRef.current = requestAnimationFrame(detectHands);
          }
        }, 20); // 50ms 지연 (약 20 FPS)
      }
    } catch (err) {
      console.error('메인 루프 에러:', err);
      // 에러 발생 시 잠시 대기 후 재시작
      if (isActiveRef.current) {
        setTimeout(() => {
          if (isActiveRef.current) {
            animationFrameRef.current = requestAnimationFrame(detectHands);
          }
        }, 1000);
      }
    }
  };

  const toggleCamera = async () => {
    if (isLoading) return;

    if (isActive) {
      // 웹캠과 핸드 트래킹 중지
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      disposeDetector();

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }

      stopCamera(videoRef);
      setIsActive(false);
      setError('');
    } else {
      // 웹캠과 핸드 트래킹 시작
      try {
        setIsLoading(true);
        setError('웹캠 및 TensorFlow.js 초기화 중...');

        const [cameraSuccess, detectorSuccess] = await Promise.all([
          startCamera(videoRef),
          createHandDetector()
        ]);

        if (cameraSuccess && detectorSuccess) {
          // 비디오가 완전히 로드될 때까지 기다리기
          if (videoRef.current) {
            await new Promise<void>((resolve) => {
              const checkVideoReady = () => {
                if (videoRef.current && videoRef.current.readyState >= 2) {
                  resolve();
                } else {
                  setTimeout(checkVideoReady, 100);
                }
              };
              checkVideoReady();
            });
          }

          setIsActive(true);
          setError('');
          detectHands();
        } else {
          setError('초기화 실패');
        }
      } catch (err: any) {
        setError('초기화를 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (isActive) {
        // toggleCamera() 대신 직접 정리
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        disposeDetector();
        stopCamera(videoRef);
      }
    };
  }, [isActive, disposeDetector, stopCamera]);

  return (
    <div className="App">
      <header className="App-header">
        <h3>GestureExtension</h3>

        {/* 웹캠 컨테이너 */}
        <div className="camera-container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <CameraView videoRef={videoRef} canvasRef={canvasRef} />

            {/* 제스처 표시 */}
            {isActive && (
              <GestureDisplay
                staticGesture={currentStaticGesture}
                dynamicGesture={currentDynamicGesture}
                confidence={gestureConfidence}
                debugInfo={debugInfo}
              />
            )}

            {/* 민감도 설정 */}
            <SensitivitySettings
              settings={gestureSettings}
              onSettingsChange={setGestureSettings}
              isVisible={showSettings}
              onToggle={() => setShowSettings(!showSettings)}
            />
          </div>

          <div className="camera-controls">
            <ControlButton
              isActive={isActive}
              isLoading={isLoading}
              onClick={toggleCamera}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

export default Popup;