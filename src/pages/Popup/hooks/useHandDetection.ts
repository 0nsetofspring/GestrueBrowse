import { useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/hand-pose-detection';

export const useHandDetection = () => {
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<handpose.HandDetector | null>(null);

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
  }, []);

  return {
    createHandDetector,
    detectHandsWithTensorFlow,
    disposeDetector,
    processingCanvasRef
  };
}; 