console.log("Content script loaded and running.");

let utterance;
let paused = false;
let currentPosition = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);
  if (request.action === "play") {
    console.log("Text received for reading:", request.text);
    console.log("Playing text from content script.");
    startReading(request.text, request.position);
    sendResponse({ status: "Playing" });
  } else if (request.action === "pause") {
    console.log("Pausing reading in content script.");
    window.speechSynthesis.pause();
    paused = true;
    sendResponse({ status: "Paused" });
  }
});

function startReading(text, position) {
  console.log("Start reading from position:", position);
  if (!text) {
    console.log("No text to read");
    return;
  }
  window.speechSynthesis.cancel();
  const textToRead = text.substring(position);
  console.log("Text to read:", textToRead);
  utterance = new SpeechSynthesisUtterance(textToRead);
  utterance.onend = () => {
    currentPosition += textToRead.length;
    console.log("Reading finished, current position:", currentPosition);
    chrome.runtime.sendMessage({ action: 'updatePosition', position: currentPosition });
  };
  utterance.onerror = (event) => {
    console.error("SpeechSynthesisUtterance.onerror", event);
  };
  console.log("Speaking:", textToRead);
  window.speechSynthesis.speak(utterance);
}