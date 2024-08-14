let text = '';
let currentPosition = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in background script:", request);
  if (request.action === "play") {
    if (text) {
      console.log("Text to play:", text);
      console.log("Sending 'play' message to content script with text and position.");
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "play", text: text, position: currentPosition }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error sending message to tab:", chrome.runtime.lastError);
            } else {
              console.log("Response from content script:", response);
            }
          });
        }
      });
    } else {
      sendResponse({ error: "No text to read" });
    }
  } else if (request.action === "pause") {
    console.log("Sending 'pause' message to content script.");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "pause" });
      }
    });
  } else if (request.action === "rewind") {
    currentPosition = Math.max(0, currentPosition - 10);
    console.log("Sending 'play' message to content script with rewinded position.");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "play", text: text, position: currentPosition });
      }
    });
  } else if (request.action === "forward") {
    currentPosition += 10;
    console.log("Sending 'play' message to content script with forwarded position.");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "play", text: text, position: currentPosition });
      }
    });
  } else if (request.action === "setText") {
    text = request.text;
    currentPosition = 0; // Reset position when new text is set
    console.log("Text set in background script.");
    sendResponse({ status: "Text set" });
  } else if (request.action === 'updatePosition') {
    currentPosition = request.position;
    console.log("Updated position:", currentPosition);
  }
});
