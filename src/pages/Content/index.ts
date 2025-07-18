console.log("=== Content script 시작 ===");

// 기본 설정값
let scrollBehavior: ScrollBehavior = 'auto';
let scrollValue = 100;

// 설정 로드
chrome.storage.sync.get(['scrollValue', 'scrollBehavior'], (result) => {
  scrollValue = result['scrollValue'] || 100;
  scrollBehavior = (result['scrollBehavior'] || 'instant') as ScrollBehavior;
  console.log("설정 로드됨:", { scrollValue, scrollBehavior });
});

// 설정 변경 감지
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes['scrollValue']) {
      scrollValue = changes['scrollValue'].newValue || 100;
      console.log("스크롤 거리 업데이트:", scrollValue);
    }
    if (changes['scrollBehavior']) {
      scrollBehavior = (changes['scrollBehavior'].newValue || 'instant') as ScrollBehavior;
      console.log("스크롤 동작 업데이트:", scrollBehavior);
    }
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log("=== Content script 메시지 수신 ===");
  console.log("받은 메시지:", request);

  // 위로 스크롤
  if (request.action === "scroll-up") {
    console.log("스크롤 위로 실행 중...");
    window.scrollBy({ top: -scrollValue, behavior: scrollBehavior });
    console.log("스크롤: 위로 완료");
    sendResponse({ status: "success", direction: "up" });

  } else if (request.action === "scroll-down") {
    console.log("스크롤 아래로 실행 중...");
    window.scrollBy({ top: scrollValue, behavior: scrollBehavior });
    console.log("스크롤: 아래로 완료");
    sendResponse({ status: "success", direction: "down" });
  } else{
    console.log("알 수 없는 제스처:", request.action);
    sendResponse({ status: "error", message: "알 수 없는 제스처" });
  }
  return true; // 비동기 응답을 위해 필요
});

console.log("=== Content script 로드 완료 ===");