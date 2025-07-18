export const drawHandConnections = (
  ctx: CanvasRenderingContext2D, 
  keypoints: any[], 
  processingCanvas: HTMLCanvasElement, 
  displayCanvas: HTMLCanvasElement
) => {
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

export const renderHandLandmarks = (
  hands: any[], 
  canvasRef: React.RefObject<HTMLCanvasElement>, 
  processingCanvasRef: React.RefObject<HTMLCanvasElement>
) => {
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
          const canvasX = (keypoint.x / processingCanvasRef.current!.width) * canvasRef.current.width;
          const canvasY = (keypoint.y / processingCanvasRef.current!.height) * canvasRef.current.height;

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