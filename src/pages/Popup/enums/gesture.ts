export enum StaticGesture {
  NONE = 'NONE', // 판별 불가 or 손 인식 불가
  STOP = 'STOP', // 손바닥 모양
  LEFT = 'LEFT', // 손가락이 왼쪽으로 펴진 모양
  RIGHT = 'RIGHT', // 손가락이 오른쪽으로 펴진 모양
  UP = 'UP', // 손가락이 위쪽으로 펴진 모양
  DOWN = 'DOWN', // 손가락이 아래쪽으로 펴진 모양
}

export enum DynamicGesture {
  NONE = 'NONE', // 판별 불가 or 손 인식 불가
  SWIPE_LEFT = 'SWIPE_LEFT', // 손가락이 왼쪽으로 움직이는 모양
  SWIPE_RIGHT = 'SWIPE_RIGHT', // 손가락이 오른쪽으로 움직이는 모양
  SWIPE_UP = 'SWIPE_UP', // 손가락이 위쪽으로 움직이는 모양
  SWIPE_DOWN = 'SWIPE_DOWN', // 손가락이 아래쪽으로 움직이는 모양
}