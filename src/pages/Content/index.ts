// src/pages/Content/index.js
// 스크롤 등 탭 내 동작

console.log("Content script injected!");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scroll") {
        if (message.direction === "up") {
            window.scrollBy(0, -200);
        } else if (message.direction === "down") {
            window.scrollBy(0, 200);
        }
    }
});

// --- 제스처 시뮬레이션을 위한 코드 추가 (개발/테스트용) ---
// 이 함수는 배포 시 제거하거나, 특정 조건에서만 활성화되도록 해야 합니다.
declare global {
    interface Window {
        simulateGesture: (gesture: string) => void;
    }
}

window.simulateGesture = (gesture: string) => {
    console.log(`Simulating gesture: ${gesture}`);
    chrome.runtime.sendMessage({ action: "gestureRecognized", gesture: gesture })
        .catch(error => {
            // 서비스 워커가 비활성화되어 있거나 연결이 끊어졌을 경우 오류 처리
            console.warn("Failed to send simulated gesture message to background:", error);
        });
};

export { };