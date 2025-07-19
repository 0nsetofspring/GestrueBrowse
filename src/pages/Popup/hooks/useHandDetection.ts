import { useRef, useCallback, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/hand-pose-detection';
import { StaticGesture, DynamicGesture } from '../enums/gesture';
import { recognizeStaticGesture, recognizeDynamicGesture, GestureHistory } from '../utils/gestureRecognizer';

// 랜드마크 인덱스 정의 (gestureRecognizer.ts에서 복사)
const LANDMARK_INDICES = {
  WRIST: 0,
  THUMB_TIP: 4,
  THUMB_IP: 3,
  THUMB_MCP: 2,
  INDEX_TIP: 8,
  INDEX_PIP: 6,
  INDEX_MCP: 5,
  MIDDLE_TIP: 12,
  MIDDLE_PIP: 10,
  MIDDLE_MCP: 9,
  RING_TIP: 16,
  RING_PIP: 14,
  RING_MCP: 13,
  PINKY_TIP: 20,
  PINKY_PIP: 18,
  PINKY_MCP: 17,
} as const;
import { GestureSettings, DEFAULT_GESTURE_SETTINGS } from '../types/gestureSettings';

// 제스처를 브라우저 액션으로 변환하는 함수
const mapGestureToAction = (staticGesture: StaticGesture, dynamicGesture: DynamicGesture): string | null => {
  // 동적 제스처 우선 처리 (스와이프)
  if (dynamicGesture !== DynamicGesture.NONE) {
    switch (dynamicGesture) {
      case DynamicGesture.SWIPE_UP:
        return 'scroll-up';
      case DynamicGesture.SWIPE_DOWN:
        return 'scroll-down';
      case DynamicGesture.SWIPE_LEFT:
        return 'right'; // 왼쪽 스와이프 → 다음 탭
      case DynamicGesture.SWIPE_RIGHT:
        return 'left'; // 오른쪽 스와이프 → 이전 탭
      default:
        break;
    }
  }

  // 정적 제스처 처리
  switch (staticGesture) {
    case StaticGesture.UP:
      return 'scroll-up';
    case StaticGesture.DOWN:
      return 'scroll-down';
    case StaticGesture.LEFT:
      return 'right'; // 왼쪽 가리키기 → 다음 탭
    case StaticGesture.RIGHT:
      return 'left'; // 오른쪽 가리키기 → 이전 탭
    case StaticGesture.STOP:
      return 'stop';
    default:
      return null;
  }
};

// Background script로 제스처 액션 전송
const sendGestureToBackground = (action: string) => {
  console.log('🔄 제스처 액션 전송:', action);
  chrome.runtime.sendMessage({
    type: 'gesture',
    gesture: action
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('제스처 전송 실패:', chrome.runtime.lastError.message);
    } else {
      console.log('✅ 제스처 액션 전송 성공:', response);
    }
  });
};

export const useHandDetection = (settings: GestureSettings = DEFAULT_GESTURE_SETTINGS) => {
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<handpose.HandDetector | null>(null);
  const gestureHistoryRef = useRef<GestureHistory>(new GestureHistory(settings.general.historyLength));

  // 제스처 상태
  const [currentStaticGesture, setCurrentStaticGesture] = useState<StaticGesture>(StaticGesture.NONE);
  const [currentDynamicGesture, setCurrentDynamicGesture] = useState<DynamicGesture>(DynamicGesture.NONE);
  const [gestureConfidence, setGestureConfidence] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // 쿨다운 상태와 타이머를 위한 ref
  const [isGestureOnCooldown, setIsGestureOnCooldown] = useState(false);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 마지막으로 전송된 액션을 추적하여 중복 전송 방지
  const lastSentActionRef = useRef<string | null>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  // 🔥 제스처 지속 시간 추적 시스템
  const gestureStartTimeRef = useRef<number | null>(null);
  const currentGestureRef = useRef<string | null>(null);
  const [gestureHoldProgress, setGestureHoldProgress] = useState<number>(0); // 0~1 사이 값
  const GESTURE_HOLD_DURATION = 300; // 0.5초에서 0.3초로 줄임

  // 제스처 지속 시간 체크 및 액션 실행
  const checkGestureHoldAndExecute = useCallback((gestureKey: string, action: string) => {
    const now = Date.now();

    // 새로운 제스처인 경우 시작 시간 기록
    if (currentGestureRef.current !== gestureKey) {
      gestureStartTimeRef.current = now;
      currentGestureRef.current = gestureKey;
      setGestureHoldProgress(0);
      console.log('🔄 새로운 제스처 시작:', gestureKey, '액션:', action);
    }

    // 지속 시간 계산
    if (gestureStartTimeRef.current) {
      const elapsed = now - gestureStartTimeRef.current;
      const progress = Math.min(elapsed / GESTURE_HOLD_DURATION, 1);
      setGestureHoldProgress(progress);

      // 0.3초 지속되면 액션 실행
      if (elapsed >= GESTURE_HOLD_DURATION && action !== lastSentActionRef.current) {
        console.log('✅ 제스처 0.3초 유지 완료, 액션 실행:', action);
        sendGestureToBackground(action);
        lastSentActionRef.current = action;
        setCurrentAction(action);

        // 쿨다운 시작
        setIsGestureOnCooldown(true);
        cooldownTimerRef.current = setTimeout(() => {
          setIsGestureOnCooldown(false);
          gestureHistoryRef.current.clearDynamicGestures();
          console.log('쿨다운 종료. 다음 제스처 인식 가능.');
        }, 1000);
      }
    }
  }, []);

  // 제스처가 변경되거나 없어지면 초기화 (더 관대하게)
  const resetGestureHold = useCallback(() => {
    if (currentGestureRef.current) {
      console.log('🔄 제스처 초기화');
      gestureStartTimeRef.current = null;
      currentGestureRef.current = null;
      setGestureHoldProgress(0);
    }
  }, []);

  const createHandDetector = useCallback(async () => {
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
      return false;
    }
  }, []);

  const detectHandsWithTensorFlow = useCallback(async (videoRef: React.RefObject<HTMLVideoElement>) => {
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

        // 제스처 인식 처리
        if (hands && Array.isArray(hands) && hands.length > 0) {
          const hand = hands[0] as any;
          const landmarks = hand.keypoints?.map((point: any) => ({ x: point.x, y: point.y })) || [];

          // 제스처 히스토리에 랜드마크 추가
          gestureHistoryRef.current.addLandmarks(landmarks);

          // 정적 제스처 인식
          const staticGesture = recognizeStaticGesture(landmarks, settings);
          gestureHistoryRef.current.addStaticGesture(staticGesture);

          // 동적 제스처 인식
          const previousLandmarks = gestureHistoryRef.current.getPreviousLandmarks();
          // const recentDynamicGestures = gestureHistoryRef.current.getRecentDynamicGestures();
          // 1. 현재 프레임의 '잠재적' 제스처를 가져옵니다.
          const potentialGesture = previousLandmarks
            ? recognizeDynamicGesture(landmarks, previousLandmarks, settings)
            : DynamicGesture.NONE;

          // 2. 히스토리에 추가
          gestureHistoryRef.current.addDynamicGesture(potentialGesture);

          // 3. 히스토리를 확인하여 제스처를 '확정'
          let recognizedDynamicGesture = DynamicGesture.NONE;

          if (!isGestureOnCooldown && potentialGesture !== DynamicGesture.NONE) {
            const recentHistory = gestureHistoryRef.current.getRecentDynamicGestures(settings.dynamic.minFrames);

            if (recentHistory.length >= settings.dynamic.minFrames) {
              const consistentCount = recentHistory.filter(g => g === potentialGesture).length;

              // minConsistentFrames 기준으로 일관성 검사
              if (consistentCount >= settings.dynamic.minConsistentFrames) {
                recognizedDynamicGesture = potentialGesture;

                console.log('✅ 동적 제스처 최종 감지:', recognizedDynamicGesture);

                // 쿨다운 시작
                setIsGestureOnCooldown(true);
                cooldownTimerRef.current = setTimeout(() => {
                  setIsGestureOnCooldown(false);
                  gestureHistoryRef.current.clearDynamicGestures();
                  console.log('쿨다운 종료. 다음 제스처 인식 가능.');
                }, 1000); // 0.5초 쿨다운 (원하는 시간으로 조절)
              }
            }
          }

          // recognizedDynamicGesture를 상태로 저장하거나, UI에 표시, 메시지 전송 등 원하는 곳에 활용

          // 디버깅 정보 수집
          let debugData = null;
          if (previousLandmarks) {
            const wrist = landmarks[LANDMARK_INDICES.WRIST];
            const prevWrist = previousLandmarks[LANDMARK_INDICES.WRIST];
            const middleFingerMcp = landmarks[LANDMARK_INDICES.MIDDLE_MCP];
            const prevMiddleFingerMcp = previousLandmarks[LANDMARK_INDICES.MIDDLE_MCP];

            const deltaX = (wrist.x + middleFingerMcp.x) / 2 - (prevWrist.x + prevMiddleFingerMcp.x) / 2;
            const deltaY = (wrist.y + middleFingerMcp.y) / 2 - (prevWrist.y + prevMiddleFingerMcp.y) / 2;

            const currentRecentHistory = gestureHistoryRef.current.getRecentDynamicGestures();

            debugData = {
              deltaX,
              deltaY,
              movementThreshold: settings.dynamic.movementThreshold,
              recentGestures: currentRecentHistory
            };

            console.log('동적 제스처 분석:', {
              potential: potentialGesture,
              recognized: recognizedDynamicGesture,
              deltaX: deltaX.toFixed(4),
              deltaY: deltaY.toFixed(4),
              settings: {
                movementThreshold: settings.dynamic.movementThreshold,
                minFrames: settings.dynamic.minFrames,
                minConsistentFrames: settings.dynamic.minConsistentFrames
              }
            });
          }

          // 동적 제스처 결과 로그
          if (recognizedDynamicGesture !== DynamicGesture.NONE) {
            console.log('동적 제스처 감지:', recognizedDynamicGesture);
          }

          // 디버그 정보 업데이트
          setDebugInfo(debugData);

          // 제스처 상태 업데이트
          setCurrentStaticGesture(staticGesture);
          if (recognizedDynamicGesture !== DynamicGesture.NONE) {
            setCurrentDynamicGesture(recognizedDynamicGesture);
          }

          console.log('staticGesture', staticGesture);
          console.log('recognizedDynamicGesture', recognizedDynamicGesture);

          // 제스처 액션 처리 및 브라우저 제어
          const currentAction = mapGestureToAction(staticGesture, recognizedDynamicGesture);

          if (currentAction && !isGestureOnCooldown) {
            // 동적 제스처가 있는 경우에만 지속 시간 체크
            if (recognizedDynamicGesture !== DynamicGesture.NONE) {
              const gestureKey = `${staticGesture}-${recognizedDynamicGesture}`;
              console.log('🔍 동적 제스처 액션 매핑:', { staticGesture, recognizedDynamicGesture, action: currentAction });
              checkGestureHoldAndExecute(gestureKey, currentAction);
            } else {
              // 정적 제스처만 있는 경우 즉시 실행
              console.log('🔍 정적 제스처 즉시 실행:', { staticGesture, action: currentAction });
              sendGestureToBackground(currentAction);
              lastSentActionRef.current = currentAction;
              setCurrentAction(currentAction);
              
              // 쿨다운 시작
              setIsGestureOnCooldown(true);
              cooldownTimerRef.current = setTimeout(() => {
                setIsGestureOnCooldown(false);
                gestureHistoryRef.current.clearDynamicGestures();
                console.log('쿨다운 종료. 다음 제스처 인식 가능.');
              }, 1000);
            }
          } else if (!currentAction) {
            // 제스처가 없어지면 초기화
            resetGestureHold();
            if (lastSentActionRef.current) {
              lastSentActionRef.current = null;
              setCurrentAction(null);
            }
          }

          // 제스처 신뢰도 계산 (최근 제스처들의 일관성) - 더 안정적으로
          const recentStaticGestures = gestureHistoryRef.current.getRecentStaticGestures(settings.general.confidenceFrames);
          const confidence = recentStaticGestures.length > 0
            ? recentStaticGestures.filter(g => g === staticGesture).length / recentStaticGestures.length
            : 0;
          setGestureConfidence(confidence);
        } else {
          // 손이 감지되지 않으면 제스처 초기화
          setCurrentStaticGesture(StaticGesture.NONE);
          setCurrentDynamicGesture(DynamicGesture.NONE);
          setGestureConfidence(0);
        }

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
  }, [isGestureOnCooldown, settings]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  const disposeDetector = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.dispose();
      detectorRef.current = null;
    }
    if (processingCanvasRef.current) {
      processingCanvasRef.current = null;
    }
    // 제스처 히스토리 초기화
    gestureHistoryRef.current.clear();
    setCurrentStaticGesture(StaticGesture.NONE);
    setCurrentDynamicGesture(DynamicGesture.NONE);
    setGestureConfidence(0);
  }, []);

  return {
    createHandDetector,
    detectHandsWithTensorFlow,
    disposeDetector,
    processingCanvasRef,
    currentStaticGesture,
    currentDynamicGesture,
    gestureConfidence,
    debugInfo,
    currentAction,
    gestureHoldProgress
  };
}; 