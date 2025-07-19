import { StaticGesture, DynamicGesture } from '../enums/gesture';
import { GestureSettings } from '../types/gestureSettings';

// 손의 랜드마크 인덱스 정의
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

// 손가락이 펴져있는지 확인하는 함수 (설정 기반)
const isFingerExtended = (
  landmarks: any[],
  tipIndex: number,
  pipIndex: number,
  mcpIndex: number,
  fingerThreshold: number
): boolean => {
  const tip = landmarks[tipIndex];
  const pip = landmarks[pipIndex];
  const mcp = landmarks[mcpIndex];

  // 손가락이 펴져있는지 확인 (팁이 PIP보다 위에 있으면 펴진 것)
  return tip.y < (pip.y - fingerThreshold);
};

// 엄지가 펴져있는지 확인하는 함수 (엄지는 다른 방향, 설정 기반)
const isThumbExtended = (landmarks: any[], fingerThreshold: number): boolean => {
  const tip = landmarks[LANDMARK_INDICES.THUMB_TIP];
  const ip = landmarks[LANDMARK_INDICES.THUMB_IP];
  const mcp = landmarks[LANDMARK_INDICES.THUMB_MCP];

  // 엄지는 x축 기준으로 판단 (팁이 IP보다 바깥쪽에 있으면 펴진 것)
  return Math.abs(tip.x - mcp.x) > (Math.abs(ip.x - mcp.x) + fingerThreshold);
};

// 손의 방향을 판별하는 함수 (설정 기반)
const getHandDirection = (landmarks: any[], directionThreshold: number): 'left' | 'right' | 'up' | 'down' | 'none' => {
  const wrist = landmarks[LANDMARK_INDICES.WRIST];
  const middleTip = landmarks[LANDMARK_INDICES.MIDDLE_TIP];

  const deltaX = middleTip.x - wrist.x;
  const deltaY = middleTip.y - wrist.y;

  // console.log('--- getHandDirection Debug ---');
  // console.log('wrist:', { x: wrist.x.toFixed(4), y: wrist.y.toFixed(4) });
  // console.log('middleTip:', { x: middleTip.x.toFixed(4), y: middleTip.y.toFixed(4) });
  // console.log('Calculated deltaX:', deltaX.toFixed(4));
  // console.log('Calculated deltaY:', deltaY.toFixed(4)); // 이 값이 양수이고 충분히 커야 'down'
  // console.log('Current directionThreshold:', directionThreshold);
  // console.log('Math.abs(deltaX) > Math.abs(deltaY):', Math.abs(deltaX) > Math.abs(deltaY)); // true면 수평, false면 수직 판단
  // console.log('Is deltaY > directionThreshold for DOWN:', deltaY > directionThreshold); // 'down' 조건


  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > directionThreshold ? 'right' : 'left';
  } else {
    return deltaY > directionThreshold ? 'down' : 'up';
  }
};

// 정적 제스처를 판별하는 함수 (설정 기반)
export const recognizeStaticGesture = (landmarks: any[], settings: GestureSettings): StaticGesture => {
  if (!landmarks || landmarks.length < 21) {
    return StaticGesture.NONE;
  }

  // console.log('--- recognizeStaticGesture Debug ---');
  // console.log('landmarks:', landmarks);
  // console.log('fingerThreshold:', settings.static.fingerThreshold);
  // console.log('maxExtendedFingers:', settings.static.maxExtendedFingers);

  // 각 손가락이 펴져있는지 확인
  const indexExtended = isFingerExtended(
    landmarks,
    LANDMARK_INDICES.INDEX_TIP,
    LANDMARK_INDICES.INDEX_PIP,
    LANDMARK_INDICES.INDEX_MCP,
    settings.static.fingerThreshold
  );

  const middleExtended = isFingerExtended(
    landmarks,
    LANDMARK_INDICES.MIDDLE_TIP,
    LANDMARK_INDICES.MIDDLE_PIP,
    LANDMARK_INDICES.MIDDLE_MCP,
    settings.static.fingerThreshold
  );

  const ringExtended = isFingerExtended(
    landmarks,
    LANDMARK_INDICES.RING_TIP,
    LANDMARK_INDICES.RING_PIP,
    LANDMARK_INDICES.RING_MCP,
    settings.static.fingerThreshold
  );

  const pinkyExtended = isFingerExtended(
    landmarks,
    LANDMARK_INDICES.PINKY_TIP,
    LANDMARK_INDICES.PINKY_PIP,
    LANDMARK_INDICES.PINKY_MCP,
    settings.static.fingerThreshold
  );

  const thumbExtended = isThumbExtended(landmarks, settings.static.fingerThreshold);

  // 손바닥 모양 (모든 손가락이 접혀있음)
  const extendedFingers = [indexExtended, middleExtended, ringExtended, pinkyExtended, thumbExtended];
  const extendedCount = extendedFingers.filter(extended => extended).length;

  console.log('extendedCount:', extendedCount);

  if (extendedCount === 0) {
    return StaticGesture.STOP;
  } else if (extendedCount <= settings.static.maxExtendedFingers) {
    // 손가락이 설정된 개수 이하로 펴진 경우 방향 판별
    const handDirection = getHandDirection(landmarks, settings.static.directionThreshold);

    switch (handDirection) {
      case 'left':
        return StaticGesture.LEFT;
      case 'right':
        return StaticGesture.RIGHT;
      case 'up':
        return StaticGesture.UP;
      case 'down':
        return StaticGesture.DOWN;
      default:
        return StaticGesture.NONE;
    }
  }

  return StaticGesture.NONE;
};

// 동적 제스처를 판별하는 함수 (설정 기반)
export const recognizeDynamicGesture = (
  currentLandmarks: any[],
  previousLandmarks: any[],
  // gestureHistory: DynamicGesture[],
  settings: GestureSettings
): DynamicGesture => {
  if (!currentLandmarks || !previousLandmarks ||
    currentLandmarks.length < 21 || previousLandmarks.length < 21) {
    console.log('동적 제스처: 랜드마크 부족');
    return DynamicGesture.NONE;
  }

  const wrist = currentLandmarks[LANDMARK_INDICES.WRIST];
  const prevWrist = previousLandmarks[LANDMARK_INDICES.WRIST];

  // 손의 중심점을 사용하여 더 안정적인 움직임 감지
  const middleFingerMcp = currentLandmarks[LANDMARK_INDICES.MIDDLE_MCP];
  const prevMiddleFingerMcp = previousLandmarks[LANDMARK_INDICES.MIDDLE_MCP];

  const deltaX = (wrist.x + middleFingerMcp.x) / 2 - (prevWrist.x + prevMiddleFingerMcp.x) / 2;
  const deltaY = (wrist.y + middleFingerMcp.y) / 2 - (prevWrist.y + prevMiddleFingerMcp.y) / 2;

  console.log('동적 제스처: 움직임 분석', {
    deltaX: deltaX.toFixed(4),
    deltaY: deltaY.toFixed(4),
    threshold: settings.dynamic.movementThreshold,
    absDeltaX: Math.abs(deltaX).toFixed(4),
    absDeltaY: Math.abs(deltaY).toFixed(4)
  });

  // 충분한 움직임이 있는지 확인
  if (Math.abs(deltaX) < settings.dynamic.movementThreshold && Math.abs(deltaY) < settings.dynamic.movementThreshold) {
    console.log('동적 제스처: 움직임 부족');
    return DynamicGesture.NONE;
  }

  // 최근 제스처 히스토리에서 일관된 방향 확인
  // const recentGestures = gestureHistory.slice(-settings.dynamic.minFrames);
  // console.log('동적 제스처: 히스토리 분석', {
  //   recentGestures: recentGestures.length,
  //   requiredFrames: settings.dynamic.minFrames,
  //   gestureHistory: recentGestures
  // });

  // if (recentGestures.length < settings.dynamic.minFrames) {
  //   console.log('동적 제스처: 히스토리 부족');
  //   return DynamicGesture.NONE;
  // }

  // 주된 움직임 방향 결정
  let direction: DynamicGesture = DynamicGesture.NONE;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // 수평 움직임
    if (deltaX > settings.dynamic.movementThreshold) {
      direction = DynamicGesture.SWIPE_RIGHT;
    } else if (deltaX < -settings.dynamic.movementThreshold) {
      direction = DynamicGesture.SWIPE_LEFT;
    }
  } else {
    // 수직 움직임
    if (deltaY > settings.dynamic.movementThreshold) {
      direction = DynamicGesture.SWIPE_DOWN;
    } else if (deltaY < -settings.dynamic.movementThreshold) {
      direction = DynamicGesture.SWIPE_UP;
    }
  }

  console.log('동적 제스처: 방향 결정', { direction });

  // // 일관된 방향이 최소 프레임 수만큼 유지되는지 확인
  // if (direction !== DynamicGesture.NONE) {
  //   const consistentCount = recentGestures.filter(g => g === direction).length;
  //   console.log('동적 제스처: 일관성 검사', {
  //     consistentCount,
  //     requiredConsistent: settings.dynamic.minConsistentFrames,
  //     recentGestures: recentGestures
  //   });

  return direction;
};

// 제스처 히스토리를 관리하는 클래스
export class GestureHistory {
  private staticGestures: StaticGesture[] = [];
  private dynamicGestures: DynamicGesture[] = [];
  private landmarkHistory: any[][] = [];
  private maxHistoryLength: number;

  constructor(historyLength: number = 15) {
    this.maxHistoryLength = historyLength;
  }

  addStaticGesture(gesture: StaticGesture) {
    this.staticGestures.push(gesture);
    if (this.staticGestures.length > this.maxHistoryLength) {
      this.staticGestures.shift();
    }
  }

  addDynamicGesture(gesture: DynamicGesture) {
    this.dynamicGestures.push(gesture);
    if (this.dynamicGestures.length > this.maxHistoryLength) {
      this.dynamicGestures.shift();
    }
  }

  addLandmarks(landmarks: any[]) {
    this.landmarkHistory.push([...landmarks]);
    if (this.landmarkHistory.length > this.maxHistoryLength) {
      this.landmarkHistory.shift();
    }
  }

  getRecentStaticGestures(count: number = 5): StaticGesture[] {
    return this.staticGestures.slice(-count);
  }

  getRecentDynamicGestures(count: number = 5): DynamicGesture[] {
    return this.dynamicGestures.slice(-count);
  }

  getPreviousLandmarks(): any[] | null {
    return this.landmarkHistory.length > 1
      ? this.landmarkHistory[this.landmarkHistory.length - 2] || null
      : null;
  }

  clearDynamicGestures() {
    this.dynamicGestures = [];
  }

  clear() {
    this.staticGestures = [];
    this.dynamicGestures = [];
    this.landmarkHistory = [];
  }
} 