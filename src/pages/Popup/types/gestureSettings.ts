// 제스처 민감도 설정 타입
export interface GestureSettings {
  // 정적 제스처 설정
  static: {
    fingerThreshold: number; // 손가락 감지 임계값 (0.01 ~ 0.05)
    directionThreshold: number; // 방향 감지 임계값 (0.05 ~ 0.15)
    maxExtendedFingers: number; // 최대 허용 손가락 개수 (1 ~ 3)
  };
  // 동적 제스처 설정
  dynamic: {
    movementThreshold: number; // 움직임 임계값 (0.03 ~ 0.12)
    minFrames: number; // 최소 프레임 수 (3 ~ 8)
    minConsistentFrames: number; // 일관된 방향 최소 프레임 수 (2 ~ 5)
  };
  // 일반 설정
  general: {
    historyLength: number; // 히스토리 길이 (10 ~ 20)
    confidenceFrames: number; // 신뢰도 계산 프레임 수 (3 ~ 8)
  };
}

// 기본 민감도 설정
export const DEFAULT_GESTURE_SETTINGS: GestureSettings = {
  static: {
    fingerThreshold: 0.13,
    directionThreshold: 0.03,
    maxExtendedFingers: 5,
  },
  dynamic: {
    movementThreshold: 0.1, // 더 관대하게 조정
    minFrames: 7, // 더 관대하게 조정
    minConsistentFrames: 3, // 더 관대하게 조정
  },
  general: {
    historyLength: 15,
    confidenceFrames: 5,
  },
};

// 민감도 프리셋
export const GESTURE_SENSITIVITY_PRESETS = {
  veryStrict: {
    name: '매우 엄격',
    settings: {
      static: {
        fingerThreshold: 0.01,
        directionThreshold: 0.12,
        maxExtendedFingers: 1,
      },
      dynamic: {
        movementThreshold: 0.12,
        minFrames: 8,
        minConsistentFrames: 5,
      },
      general: {
        historyLength: 20,
        confidenceFrames: 8,
      },
    },
  },
  strict: {
    name: '엄격',
    settings: {
      static: {
        fingerThreshold: 0.015,
        directionThreshold: 0.1,
        maxExtendedFingers: 1,
      },
      dynamic: {
        movementThreshold: 0.1,
        minFrames: 6,
        minConsistentFrames: 4,
      },
      general: {
        historyLength: 18,
        confidenceFrames: 6,
      },
    },
  },
  balanced: {
    name: '균형',
    settings: DEFAULT_GESTURE_SETTINGS,
  },
  lenient: {
    name: '관대',
    settings: {
      static: {
        fingerThreshold: 0.025,
        directionThreshold: 0.06,
        maxExtendedFingers: 2,
      },
      dynamic: {
        movementThreshold: 0.06,
        minFrames: 4,
        minConsistentFrames: 2,
      },
      general: {
        historyLength: 12,
        confidenceFrames: 4,
      },
    },
  },
  veryLenient: {
    name: '매우 관대',
    settings: {
      static: {
        fingerThreshold: 0.03,
        directionThreshold: 0.05,
        maxExtendedFingers: 3,
      },
      dynamic: {
        movementThreshold: 0.04,
        minFrames: 3,
        minConsistentFrames: 2,
      },
      general: {
        historyLength: 10,
        confidenceFrames: 3,
      },
    },
  },
} as const; 