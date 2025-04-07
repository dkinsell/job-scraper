/* global chrome */

// -------------------------------------
// Shared Functions & Variables
// -------------------------------------

// CSS selectors for job posting page elements
const SITE_SELECTORS = {
  linkedin: {
    company: ".job-details-jobs-unified-top-card__company-name",
    jobTitle: ".t-24.job-details-jobs-unified-top-card__job-title",
    applyButton:
      '.jobs-apply-button--top-card button, button[role="link"][aria-label*="Apply to"]',
    compensation:
      ".job-details-preferences-and-skills__pill .ui-label.text-body-small",
  },
  wellfound: {
    company: 'a[href*="/company/"] .text-sm.font-semibold.text-black',
    jobTitle: "h1.inline.text-xl.font-semibold.text-black",
    applyButton: "SELECTOR_HERE",
    compensation: "ul.text-md.text-black li",
  },
};

// Helper: Detect which site we’re on based on the URL
const detectSite = (url) => {
  if (url.includes("linkedin.com")) return "linkedin";
  if (url.includes("wellfound.com")) return "wellfound";
  return null;
};

// Helper: Show a notification message
const showNotification = (message = "Copied to clipboard!") => {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.classList.add("show");
  setTimeout(() => {
    notification.classList.remove("show");
  }, 2000);
};

// Helper: Copy text to clipboard
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showNotification("Copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy text:", err);
    showNotification("Failed to copy. Please try again.");
  }
};

// -------------------------------------
// 1. Scrape Job Info Functionality
// -------------------------------------

document.getElementById("scrape").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        // Redefine functions and selectors within the page context
        const SITE_SELECTORS = {
          linkedin: {
            company: ".job-details-jobs-unified-top-card__company-name",
            jobTitle: ".t-24.job-details-jobs-unified-top-card__job-title",
            applyButton:
              '.jobs-apply-button--top-card button, button[role="link"][aria-label*="Apply to"]',
            compensation:
              ".job-details-preferences-and-skills__pill .ui-label.text-body-small",
          },
          wellfound: {
            company: 'a[href*="/company/"] .text-sm.font-semibold.text-black',
            jobTitle: "h1.inline.text-xl.font-semibold.text-black",
            applyButton: "SELECTOR_HERE",
            compensation: "ul.text-md.text-black li",
          },
        };

        const detectSite = (url) => {
          if (url.includes("linkedin.com")) return "linkedin";
          if (url.includes("wellfound.com")) return "wellfound";
          return null;
        };

        const getElementText = (selector) => {
          return document.querySelector(selector)?.innerText.trim() || "";
        };

        const getApplicationType = (buttonText, site) => {
          if (site === "linkedin") {
            return buttonText.toLowerCase().includes("easy apply")
              ? "Quick apply"
              : "Traditional App";
          }
          if (site === "wellfound") {
            return "Quick apply";
          }
          return "Traditional App";
        };

        const getCompensation = (text) => {
          return text.includes("$") ? text : "";
        };

        const getFormattedDate = () => {
          const today = new Date();
          return `${
            today.getMonth() + 1
          }/${today.getDate()}/${today.getFullYear()}`;
        };

        const site = detectSite(window.location.href);
        if (!site) {
          chrome.runtime.sendMessage({ error: "Unsupported website" });
          return;
        }

        const SELECTORS = SITE_SELECTORS[site];
        const buttonText = getElementText(SELECTORS.applyButton);
        const compensationText = getElementText(SELECTORS.compensation);

        const jobInfo = {
          date: getFormattedDate(),
          company: getElementText(SELECTORS.company),
          jobTitle: getElementText(SELECTORS.jobTitle),
          location: "Remote",
          status: "Applied",
          applicationType: getApplicationType(buttonText, site),
          pageUrl: window.location.href,
          compensation: getCompensation(compensationText),
        };

        // Format data for spreadsheet (tab-separated)
        const formattedData = [
          jobInfo.date,
          jobInfo.company,
          jobInfo.jobTitle,
          jobInfo.location,
          jobInfo.status,
          jobInfo.applicationType,
          jobInfo.pageUrl,
          "",
          "",
          "FALSE",
          jobInfo.compensation,
        ].join("\t");

        chrome.runtime.sendMessage({ data: formattedData });
      },
    });
  });
});

// Listen for scraped data and copy it to clipboard
chrome.runtime.onMessage.addListener((request) => {
  if (request.data) {
    copyToClipboard(request.data);
  }
});

// -------------------------------------
// 2. Dismiss All Jobs Functionality
// -------------------------------------

// Updated CSS selector based on your provided HTML:
const DISMISS_SELECTOR = 'button[aria-label^="Dismiss"]';

document.getElementById("dismissAll").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: (selector) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              // Get all elements that match the selector
              const allButtons = Array.from(
                document.querySelectorAll(selector)
              );
              // Filter to include only visible buttons
              const visibleButtons = allButtons.filter(
                (btn) => btn.offsetParent !== null
              );
              visibleButtons.forEach((btn) => btn.click());
              resolve(visibleButtons.length);
            }, 1000);
          });
        },
        args: ['button[aria-label^="Dismiss"]'],
      },
      (results) => {
        if (results && results[0] && results[0].result !== undefined) {
          const count = results[0].result;
          console.log(`Dismissed ${count} job(s).`);
          showNotification(`Dismissed ${count} job(s).`);
        }
      }
    );
  });
});
