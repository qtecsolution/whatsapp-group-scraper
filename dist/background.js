chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scrapedData") {
    chrome.storage.local.set({ contacts: message.data });
  }
});
