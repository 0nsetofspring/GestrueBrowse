chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log("Content script received message:", request);

  // 위로 스크롤
  if (request.action === "scroll-up") {
    window.scrollBy({ top: -window.innerHeight / 2, behavior: 'smooth' }); // 화면 높이의 절반만큼 위로
    console.log("스크롤: 위로");
    sendResponse({ status: "success", direction: "up" });

  } else if (request.action === "scroll-down") {
    window.scrollBy({ top: window.innerHeight / 2, behavior: 'smooth' }); // 화면 높이의 절반만큼 아래로
    console.log("스크롤: 아래로");
    sendResponse({ status: "success", direction: "down" });
  } else{
    console.log("알 수 없는 제스처:", request.action);
  }
  return true; // 비동기 응답을 위해 필요
});

console.log("Content script loaded.");