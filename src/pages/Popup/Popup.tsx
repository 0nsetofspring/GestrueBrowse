import React, { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/hand-pose-detection';
import './Popup.css';

const Popup: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<handpose.HandDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false);

  // isActive 상태 변경 추적
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const createHandDetector = async () => {
    try {
      console.log('TensorFlow.js 초기화 시작...');

      // 처리용 캔버스 생성 (더 작은 크기로 성능 향상)
      processingCanvasRef.current = document.createElement('canvas');
      processingCanvasRef.current.width = 256;
      processingCanvasRef.current.height = 192;

      // TensorFlow.js 백엔드 설정
      console.log('TensorFlow.js 백엔드 설정 중...');
      await tf.ready();
      await tf.setBackend('webgl');
      console.log('TensorFlow.js 백엔드 설정 완료:', tf.getBackend());

      // 핸드 포즈 감지기 생성
      console.log('핸드 디텍터 생성 중...');
      const model = handpose.SupportedModels.MediaPipeHands;
      const detectorConfig = {
        runtime: 'tfjs',
        modelType: 'lite',
        maxHands: 1 // 최대 1개 손만 감지 (성능 향상)
      } as handpose.MediaPipeHandsTfjsModelConfig;

      detectorRef.current = await handpose.createDetector(model, detectorConfig);
      console.log('핸드 디텍터 생성 완료');
      return true;
    } catch (err: any) {
      console.error('TensorFlow.js 초기화 실패:', err);
      setError(`TensorFlow.js 초기화 실패: ${err?.message || String(err)}`);
      return false;
    }
  };

  const drawHandConnections = (ctx: CanvasRenderingContext2D, keypoints: any[], processingCanvas: HTMLCanvasElement, displayCanvas: HTMLCanvasElement) => {
    // 손가락 연결선 정의 (MediaPipe Hands 21개 랜드마크 기준)
    const connections = [
      // 엄지
      [0, 1], [1, 2], [2, 3], [3, 4],
      // 검지
      [0, 5], [5, 6], [6, 7], [7, 8],
      // 중지
      [0, 9], [9, 10], [10, 11], [11, 12],
      // 약지
      [0, 13], [13, 14], [14, 15], [15, 16],
      // 새끼
      [0, 17], [17, 18], [18, 19], [19, 20],
      // 손바닥 연결
      [5, 9], [9, 13], [13, 17]
    ];

    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 4;

    for (const [start, end] of connections) {
      if (keypoints[start as number] && keypoints[end as number]) {
        // 좌표를 캔버스 크기에 맞게 변환
        const startX = (keypoints[start as number].x / processingCanvas.width) * displayCanvas.width;
        const startY = (keypoints[start as number].y / processingCanvas.height) * displayCanvas.height;
        const endX = (keypoints[end as number].x / processingCanvas.width) * displayCanvas.width;
        const endY = (keypoints[end as number].y / processingCanvas.height) * displayCanvas.height;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }
  };

  // TensorFlow.js 손 감지 함수 (분리)
  const detectHandsWithTensorFlow = async () => {
    if (!videoRef.current || !detectorRef.current || !processingCanvasRef.current) {
      return null;
    }

    const processingCtx = processingCanvasRef.current.getContext('2d');
    if (!processingCtx) {
      return null;
    }

    try {
      if (videoRef.current.readyState >= 2) {
        // 비디오 프레임을 처리용 캔버스에 복사
        processingCtx.clearRect(0, 0, processingCanvasRef.current.width, processingCanvasRef.current.height);
        processingCtx.drawImage(videoRef.current, 0, 0, processingCanvasRef.current.width, processingCanvasRef.current.height);

        // TensorFlow.js 손 감지 실행 (타임아웃 설정)
        const hands = await Promise.race([
          detectorRef.current!.estimateHands(processingCanvasRef.current),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('손 감지 타임아웃')), 2000)
          )
        ]);

        // 메모리 정리 (주기적으로 실행)
        if (Math.random() < 0.1) { // 10% 확률로 메모리 정리
          tf.disposeVariables();
        }

        return hands;
      }
    } catch (err) {
      console.error('손 감지 에러:', err);
      // 에러 발생 시 TensorFlow.js 메모리 정리
      tf.disposeVariables();
    }
    return null;
  };

  // 렌더링 함수 (분리)
  const renderHandLandmarks = (hands: any[]) => {
    if (!canvasRef.current || !processingCanvasRef.current) {
      return;
    }

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) {
      return;
    }

    // 캔버스 초기화
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // 손이 감지된 경우 랜드마크 그리기
    if (hands && hands.length > 0) {
      for (const hand of hands) {
        if (hand.keypoints) {
          // 랜드마크 점 그리기
          for (const keypoint of hand.keypoints) {
            const canvasX = (keypoint.x / processingCanvasRef.current.width) * canvasRef.current.width;
            const canvasY = (keypoint.y / processingCanvasRef.current.height) * canvasRef.current.height;

            // 빨간색 원으로 랜드마크 표시
            canvasCtx.beginPath();
            canvasCtx.arc(canvasX, canvasY, 3, 0, 2 * Math.PI);
            canvasCtx.fillStyle = '#FF0000';
            canvasCtx.fill();

            // 흰색 테두리
            canvasCtx.beginPath();
            canvasCtx.arc(canvasX, canvasY, 3, 0, 2 * Math.PI);
            canvasCtx.strokeStyle = '#FFFFFF';
            canvasCtx.lineWidth = 1;
            canvasCtx.stroke();
          }

          // 손가락 연결선 그리기
          drawHandConnections(canvasCtx, hand.keypoints, processingCanvasRef.current, canvasRef.current);
        }
      }
    }
  };

  // 메인 루프 함수
  const detectHands = async () => {
    try {
      // 1. TensorFlow.js로 손 감지
      const hands = await detectHandsWithTensorFlow();

      // 2. 결과를 렌더링
      renderHandLandmarks(Array.isArray(hands) ? hands : []);

      // 3. 다음 프레임 요청 (성능 최적화를 위해 약간의 지연 추가)
      if (isActiveRef.current) {
        setTimeout(() => {
          if (isActiveRef.current) {
            animationFrameRef.current = requestAnimationFrame(detectHands);
          }
        }, 50); // 50ms 지연 (약 20 FPS)
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

  const startCamera = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('이 브라우저는 웹캠을 지원하지 않습니다.');
      }

      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });

      if (permissionStatus.state === 'denied') {
        throw new Error('카메라 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        return true;
      }
      return false;
    } catch (err: any) {

      let errorMessage = '웹캠에 접근할 수 없습니다.';

      if (err.name === 'NotAllowedError') {
        errorMessage = '카메라 권한이 거부되었습니다. 다음 단계를 따라주세요:\n1. 브라우저 주소창의 자물쇠 아이콘 클릭\n2. 카메라 권한을 "허용"으로 설정\n3. 페이지 새로고침 후 다시 시도';
      } else if (err.name === 'NotFoundError') {
        errorMessage = '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = '이 브라우저는 웹캠을 지원하지 않습니다.';
      } else if (err.message) {
        errorMessage = `오류: ${err.message}`;
      }

      setError(errorMessage);
      return false;
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
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

      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }

      if (processingCanvasRef.current) {
        processingCanvasRef.current = null;
      }

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }

      stopCamera();
      setIsActive(false);
      setError('');
    } else {
      // 웹캠과 핸드 트래킹 시작
      try {
        setIsLoading(true);
        setError('웹캠 및 TensorFlow.js 초기화 중...');

        const [cameraSuccess, detectorSuccess] = await Promise.all([
          startCamera(),
          createHandDetector()
        ]);

        if (cameraSuccess && detectorSuccess && detectorRef.current) {
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
        if (detectorRef.current) {
          detectorRef.current.dispose();
          detectorRef.current = null;
        }
        stopCamera();
      }
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h3>GestureExtension</h3>

        {/* 웹캠 컨테이너 */}
        <div className="camera-container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            {/* 비디오와 캔버스 오버레이 */}
            <div>
              <h4 style={{ margin: '0 0 5px 0', color: '#fff' }}>핸드 트래킹</h4>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '320px',
                    height: '240px',
                    border: '2px solid #ccc',
                    borderRadius: '8px',
                    backgroundColor: '#000'
                  }}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '320px',
                    height: '240px',
                    pointerEvents: 'none',
                    zIndex: 10
                  }}
                  width={320}
                  height={240}
                />
              </div>
            </div>
          </div>

          <div className="camera-controls">
            <button
              onClick={toggleCamera}
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