// src/pages/Background/index.js
// 제스처 결과를 background script로 전달하면, 여기서 브라우저 제어 함수 실행

function handleGestureAction(gesture: string) {
    // 인자로 받은 gesture(제스처 결과)에 따라 분기 처리.
    switch (gesture) {
        case "left":
            // 이전 탭으로 이동
            chrome.tabs.query({ currentWindow: true }, (tabs) => {
                chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
                    // activeTabs 배열이 비어있지 않은지 먼저 확인하고,
                    // activeTabs[0]이 undefined가 아닌지 명시적으로 확인합니다.
                    if (activeTabs.length > 0) {
                        const activeTab = activeTabs[0]; // activeTab은 이제 chrome.tabs.Tab 또는 undefined

                        // activeTab과 activeTab.index가 모두 존재하는지 확인
                        if (activeTab && activeTab.index !== undefined) {
                            const activeIndex = activeTab.index;
                            const prevIndex = (activeIndex === 0) ? tabs.length - 1 : activeIndex - 1;

                            // 이전 탭이 존재하고 ID가 있는지 확인
                            if (tabs[prevIndex] && tabs[prevIndex].id !== undefined) {
                                chrome.tabs.update(tabs[prevIndex].id, { active: true });
                            } else { console.error("이전 탭의 ID를 찾을 수 없습니다."); }
                        } else { console.error("활성 탭의 인덱스를 찾을 수 없거나 활성 탭이 유효하지 않습니다."); }
                    } else { console.error("현재 창에서 활성 탭을 찾을 수 없습니다."); }
                });
            });
            break;
        case "right":
            // 다음 탭으로 이동
            chrome.tabs.query({ currentWindow: true }, (tabs) => {
                chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
                    // activeTabs 배열이 비어있지 않은지 먼저 확인
                    if (activeTabs.length > 0) {
                        const activeTab = activeTabs[0];
                        // activeTab과 activeTab.index가 모두 존재하는지 확인
                        if (activeTab && activeTab.index !== undefined) {
                            const activeIndex = activeTab.index;
                            const nextIndex = (activeIndex === tabs.length - 1) ? 0 : activeIndex + 1;
                            // 다음 탭이 존재하고 ID가 있는지 확인
                            if (tabs[nextIndex] && tabs[nextIndex].id !== undefined) {
                                chrome.tabs.update(tabs[nextIndex].id, { active: true });
                            } else { console.error("다음 탭의 ID를 찾을 수 없습니다."); }
                        } else { console.error("활성 탭의 인덱스를 찾을 수 없거나 활성 탭이 유효하지 않습니다."); }
                    } else { console.error("현재 창에서 활성 탭을 찾을 수 없습니다."); }
                });
            });
            break;
        case "scroll-up":
            // 현재 탭에서 스크롤 올리기 (content script에 메시지 전송)
            sendScrollMessage("up");
            break;
        case "scroll-down":
            // 현재 탭에서 스크롤 내리기 (content script에 메시지 전송)
            sendScrollMessage("down");
            break;
        // ... 추가 제스처
        default:
            console.log("알 수 없는 제스처:", gesture);
    }
}

// content script로 스크롤 메시지 전송
function sendScrollMessage(direction: string) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // tabs 배열이 비어있지 않은지, 그리고 첫 번째 탭 객체가 유효한지 확인합니다.
        if (tabs.length > 0) {
            const activeTab = tabs[0]; // activeTab은 chrome.tabs.Tab 또는 undefined

            // activeTab이 존재하고 그 id가 undefined가 아닌지 확인합니다.
            if (activeTab && activeTab.id !== undefined) {
                chrome.tabs.sendMessage(activeTab.id, { action: "scroll", direction });
            } else {
                console.error("활성 탭의 ID를 찾을 수 없습니다.");
            }
        } else {
            console.error("현재 창에서 활성 탭을 찾을 수 없습니다.");
        }
    });
}

// 메시지 리스너: content script 또는 popup에서 제스처 결과를 받음
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "gesture") {
        handleGestureAction(message.gesture);
    }
});