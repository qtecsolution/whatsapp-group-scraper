function extractContacts() {
  const contacts = [];

  document.querySelectorAll("div[role='listitem']").forEach((element) => {
    const nameElement = element.querySelector("span[dir='auto']");
    const numberElement = element.querySelector(
      "div[role='button'] span[dir='auto']"
    );

    if (nameElement && numberElement) {
      contacts.push({
        name: nameElement.innerText.trim(),
        number: numberElement.innerText.trim(),
      });
    }
  });

  return contacts;
}

// Send extracted data to background script
chrome.runtime.sendMessage({ action: "scrapedData", data: extractContacts() });
