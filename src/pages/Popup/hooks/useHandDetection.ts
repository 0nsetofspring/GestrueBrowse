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

export const useHandDetection = (settings: GestureSettings = DEFAULT_GESTURE_SETTINGS) => {
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<handpose.HandDetector | null>(null);
  const gestureHistoryRef = useRef<GestureHistory>(new GestureHistory(settings.general.historyLength));
  
  // 제스처 상태
  const [currentStaticGesture, setCurrentStaticGesture] = useState<StaticGesture>(StaticGesture.NONE);
  const [currentDynamicGesture, setCurrentDynamicGesture] = useState<DynamicGesture>(DynamicGesture.NONE);
  const [gestureConfidence, setGestureConfidence] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<any>(null);

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
          const recentDynamicGestures = gestureHistoryRef.current.getRecentDynamicGestures();
          
          // 디버깅 정보 수집
          let debugData = null;
          if (previousLandmarks) {
            const wrist = landmarks[LANDMARK_INDICES.WRIST];
            const prevWrist = previousLandmarks[LANDMARK_INDICES.WRIST];
            const middleFingerMcp = landmarks[LANDMARK_INDICES.MIDDLE_MCP];
            const prevMiddleFingerMcp = previousLandmarks[LANDMARK_INDICES.MIDDLE_MCP];
            
            const deltaX = (wrist.x + middleFingerMcp.x) / 2 - (prevWrist.x + prevMiddleFingerMcp.x) / 2;
            const deltaY = (wrist.y + middleFingerMcp.y) / 2 - (prevWrist.y + prevMiddleFingerMcp.y) / 2;
            
            debugData = {
              deltaX,
              deltaY,
              movementThreshold: settings.dynamic.movementThreshold,
              recentGestures: recentDynamicGestures
            };
            
            console.log('동적 제스처 분석:', {
              currentLandmarks: landmarks.length,
              previousLandmarks: previousLandmarks.length,
              recentDynamicGestures: recentDynamicGestures.length,
              deltaX: deltaX.toFixed(4),
              deltaY: deltaY.toFixed(4),
              settings: {
                movementThreshold: settings.dynamic.movementThreshold,
                minFrames: settings.dynamic.minFrames,
                minConsistentFrames: settings.dynamic.minConsistentFrames
              }
            });
          }
          
          const dynamicGesture = previousLandmarks 
            ? recognizeDynamicGesture(landmarks, previousLandmarks, recentDynamicGestures, settings)
            : DynamicGesture.NONE;
          gestureHistoryRef.current.addDynamicGesture(dynamicGesture);
          
          // 동적 제스처 결과 로그
          if (dynamicGesture !== DynamicGesture.NONE) {
            console.log('동적 제스처 감지:', dynamicGesture);
          }
          
          // 디버그 정보 업데이트
          setDebugInfo(debugData);
          
          // 제스처 상태 업데이트
          setCurrentStaticGesture(staticGesture);
          setCurrentDynamicGesture(dynamicGesture);
          
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
      debugInfo
    };
}; 