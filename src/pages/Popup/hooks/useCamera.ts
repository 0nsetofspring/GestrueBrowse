import { useCallback } from 'react';

export const useCamera = () => {
  const startCamera = useCallback(async (videoRef: React.RefObject<HTMLVideoElement>): Promise<boolean> => {
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
      console.error('카메라 시작 실패:', err);
      return false;
    }
  }, []);

  const stopCamera = useCallback((videoRef: React.RefObject<HTMLVideoElement>) => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  return {
    startCamera,
    stopCamera
  };
}; 