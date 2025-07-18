// src/pages/Background/index.js
// 제스처 결과를 background script로 전달하면, 여기서 브라우저 제어 함수 실행

console.log("Background script loading...");

function handleGestureAction(gesture: string) {
    console.log("Handling gesture:", gesture);
    
    // 인자로 받은 gesture(제스처 결과)에 따라 분기 처리.
    switch (gesture) {
        case "left":
            // 이전 탭으로 이동
            chrome.tabs.query({ currentWindow: true }, (tabs) => {
                const activeTab = tabs.find(tab => tab.active);
                if (activeTab && activeTab.index !== undefined) {
                    const activeIndex = activeTab.index;
                    const prevIndex = (activeIndex === 0) ? tabs.length - 1 : activeIndex - 1;
                    const targetTab = tabs[prevIndex];

                    if (targetTab && targetTab.id !== undefined) {
                        chrome.tabs.update(targetTab.id, { active: true });
                    } else {
                        console.error("이전 탭의 ID를 찾을 수 없습니다.");
                    }
                }
                else {
                    console.error("활성 탭의 인덱스를 찾을 수 없거나 활성 탭이 유효하지 않습니다.");
                }
            });
            break;
        case "right":
            // 다음 탭으로 이동
            chrome.tabs.query({ currentWindow: true }, (tabs) => {
                const activeTab = tabs.find(tab => tab.active);
                if (activeTab && activeTab.index !== undefined) {
                    const activeIndex = activeTab.index;
                    const nextIndex = (activeIndex === tabs.length - 1) ? 0 : activeIndex + 1;
                    const targetTab = tabs[nextIndex];

                    if (targetTab && targetTab.id !== undefined) {
                        chrome.tabs.update(targetTab.id, { active: true });
                    } else {
                        console.error("다음 탭의 ID를 찾을 수 없습니다.");
                    }
                }
                else {
                    console.error("활성 탭의 인덱스를 찾을 수 없거나 활성 탭이 유효하지 않습니다.");
                }
            });
            break;
        case "scroll-up":
            console.log("=== SCROLL UP 제스처 감지 ===");
            sendScrollMessage("scroll-up");
            break;
        case "scroll-down":
            console.log("=== SCROLL DOWN 제스처 감지 ===");
            sendScrollMessage("scroll-down");
            break;
        default:
            console.log("알 수 없는 제스처:", gesture);
    }
}

function sendScrollMessage(actionType: string) {
    console.log("=== sendScrollMessage 시작 ===");
    console.log("Action type:", actionType);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log("탭 조회 결과:", tabs);
        
        if (tabs.length > 0 && tabs[0] !== undefined) {
            const activeTabId = tabs[0].id;
            console.log("활성 탭 ID:", activeTabId);

            if (activeTabId !== undefined) {
                console.log("Content script 주입 시작...");
                
                // Content script 주입
                chrome.scripting.executeScript({
                    target: { tabId: activeTabId },
                    files: ['contentScript.bundle.js']
                }).then((result) => {
                    console.log("Content script 주입 성공:", result);
                    
                    // 메시지 전송
                    setTimeout(() => {
                        console.log("메시지 전송 시작...");
                        chrome.tabs.sendMessage(activeTabId, { action: actionType }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.error("메시지 전송 실패:", chrome.runtime.lastError.message);
                            } else {
                                console.log("메시지 전송 성공:", response);
                            }
                        });
                    }, 1000);
                    
                }).catch((error) => {
                    console.error("Content script 주입 실패:", error);
                });
                
            } else {
                console.error("활성 탭 ID가 undefined입니다");
            }
        } else {
            console.error("활성 탭을 찾을 수 없습니다");
        }
    });
}

// 메시지 리스너: content script 또는 popup에서 제스처 결과를 받음
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    console.log("Background script received message:", message);
    
    if (message.type === "gesture") {
        console.log("Processing gesture:", message.gesture);
        handleGestureAction(message.gesture);
    }
});

// 탭 로드 이벤트 리스너 추가
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        console.log("Tab loaded:", tab.url);
    }
});

console.log("Background script loaded successfully");

setTimeout(() => {
  console.log("테스트: scroll-up 제스처 실행");
  handleGestureAction("scroll-up");
}, 1000);