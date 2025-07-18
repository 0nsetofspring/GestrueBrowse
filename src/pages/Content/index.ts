console.log("=== Content script 시작 ===");

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log("=== Content script 메시지 수신 ===");
  console.log("받은 메시지:", request);

  // 위로 스크롤
  if (request.action === "scroll-up") {
    console.log("스크롤 위로 실행 중...");
    window.scrollBy({ top: -window.innerHeight / 2, behavior: 'smooth' });
    console.log("스크롤: 위로 완료");
    sendResponse({ status: "success", direction: "up" });

  } else if (request.action === "scroll-down") {
    console.log("스크롤 아래로 실행 중...");
    window.scrollBy({ top: window.innerHeight / 2, behavior: 'smooth' });
    console.log("스크롤: 아래로 완료");
    sendResponse({ status: "success", direction: "down" });
  } else{
    console.log("알 수 없는 제스처:", request.action);
    sendResponse({ status: "error", message: "알 수 없는 제스처" });
  }
  return true; // 비동기 응답을 위해 필요
});

console.log("=== Content script 로드 완료 ===");