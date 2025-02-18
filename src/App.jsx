/* global chrome */
import { useEffect, useState } from "react";
import Papa from "papaparse";

function App() {
  const [contacts, setContacts] = useState([]);
  const [csvData, setCsvData] = useState("");

  const fetchGroupMembers = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const response = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Function to extract WhatsApp group members
          const extractMembers = () => {
            const members = [];
            const numberRegex =
              /(\+?\d{1,4}[-.\s]?)?(\(?\d{2,5}\)?[-.\s]?)?(\d{3,5}[-.\s]?\d{3,5}[-.\s]?\d{0,5})/g;
            document
              .querySelectorAll(
                "div[data-animate-modal-body='true'] div[role='listitem']"
              )
              .forEach((item) => {
                const nameElement = item.querySelector("span[dir='auto']");
                const numberElements =
                  item.querySelectorAll("span[dir='auto']");

                let name = nameElement ? nameElement.innerText.trim() : null;

                if (name) {
                  name = name.replace(/^~/, "").trim();
                }

                let number = "Hidden";
                let about = null;

                const textElements = Array.from(numberElements).map((el) =>
                  el.innerText.trim()
                );
                const numberMatch = textElements.find((text) =>
                  numberRegex.test(text)
                );
                if (numberMatch) {
                  number = numberMatch;
                }
                const aboutMatch = textElements
                  .slice(1)
                  .find((text) => !numberRegex.test(text));
                if (aboutMatch && aboutMatch !== number) {
                  about = aboutMatch;
                } else {
                  about = "N/A";
                }

                const isDuplicate = members.some(
                  (member) => member.Name === name && member.Number === number
                );

                if (name && !isDuplicate) {
                  members.push({
                    Name: name,
                    ...(number && { Number: number }),
                    About: about,
                  });
                }
              });
            return members;
          };

          return extractMembers();
        },
      });

      const newData = response[0].result;

      chrome.storage.local.get("whatsappContacts", (result) => {
        const existingData = result.whatsappContacts || [];

        const filteredData = newData.filter(
          (newMember) =>
            !existingData.some(
              (existingMember) =>
                existingMember.Name === newMember.Name &&
                existingMember.Number === newMember.Number
            )
        );

        const combinedData = [...existingData, ...filteredData];

        chrome.storage.local.set({ whatsappContacts: combinedData }, () => {
          // const csv = Papa.unparse(combinedData);
          const reorderedData = combinedData.map((contact) => ({
            Name: contact.Name,
            Number: contact.Number,
            About: contact.About,
          }));

          const csv = Papa.unparse(reorderedData);
          setCsvData(csv);
          setContacts(combinedData);
        });
      });
    } catch (error) {
      console.error("Error scraping WhatsApp group members", error);
    }
  };

  // Load saved contacts on startup
  useEffect(() => {
    chrome.storage.local.get("whatsappContacts", (data) => {
      if (data.whatsappContacts) {
        setContacts(data.whatsappContacts);
      }
    });
  }, []);

  const clearData = () => {
    chrome.storage.local.remove("whatsappContacts", () => {
      setCsvData("");
      setContacts([]);
    });
  };

  return (
    <div className="p-4 w-80">
      <h2 className="text-sm font-extrabold mb-2 tracking-wider">
        WhatsApp Group Members Scrapper
      </h2>
      <button
        onClick={fetchGroupMembers}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Scrape Members
      </button>

      <ul className="mt-4">
        {contacts.length > 0 ? (
          contacts.map((contact, index) => (
            <li key={index} className="py-2 border-b">
              <strong>
                {index + 1}. {contact.Name}
              </strong>{" "}
              - {contact.Number}
            </li>
          ))
        ) : (
          <p>No contacts found.</p>
        )}
      </ul>

      {csvData && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const blob = new Blob([csvData], { type: "text/csv" });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = "WhatsApp_Group_Members.csv";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              clearData();
            }}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Export as CSV
          </button>

          <button
            onClick={clearData}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
          >
            Clear Data
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
