import React from 'react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const CameraView: React.FC<CameraViewProps> = ({ videoRef, canvasRef }) => {
  return (
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
            backgroundColor: '#000',
            transform: 'scaleX(-1)'
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
  );
}; 