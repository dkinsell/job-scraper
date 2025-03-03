/* global chrome */

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

const detectSite = (url) => {
  if (url.includes("linkedin.com")) return "linkedin";
  if (url.includes("wellfound.com")) return "wellfound";
  return null;
};

/**
 * Main function that scrapes job information from the LinkedIn page.
 * This function is injected into the page context by the Chrome scripting API.
 */
const scrapeJobInfo = () => {
  const site = detectSite(window.location.href);
  if (!site) {
    chrome.runtime.sendMessage({ error: "Unsupported website" });
    return;
  }

  const SELECTORS = SITE_SELECTORS[site];

  // Utility function to safely get text content from an element
  const getElementText = (selector) => {
    return document.querySelector(selector)?.innerText.trim() || "";
  };

  // Determine if the job uses Quick Apply or Traditional Application
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

  // Extract compensation if it contains a dollar amount, otherwise return empty
  const getCompensation = (text) => {
    return text.includes("$") ? text : "";
  };

  // Get today's date in MM/DD/YYYY format
  const getFormattedDate = () => {
    const today = new Date();
    return `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  };

  // Extract text from the apply button and compensation elements
  const buttonText = getElementText(SELECTORS.applyButton);
  const compensationText = getElementText(SELECTORS.compensation);

  // Collect all job information into a structured object
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

  // Format data for spreadsheet with tabs between columns (A through K)
  // Empty strings represent empty columns in the spreadsheet
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

  // Send the formatted data back to the extension popup
  chrome.runtime.sendMessage({ data: formattedData });
};

const showNotification = () => {
  const notification = document.getElementById("notification");
  notification.classList.add("show");
  setTimeout(() => {
    notification.classList.remove("show");
  }, 2000); // Hide after 2 seconds
};

// Copies the formatted job data to the clipboard and shows a success/error message.
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showNotification();
  } catch (err) {
    console.error("Failed to copy text:", err);
    const notification = document.getElementById("notification");
    notification.textContent = "Failed to copy. Please try again.";
    notification.style.backgroundColor = "#f44336"; // Red color for error
    showNotification();
  }
};

// Event Listeners

// When the "Scrape Job Info" button is clicked in the popup
document.getElementById("scrape").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        // Include all necessary functions and variables in the injection scope
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

// Listen for the scraped data from the injected script
chrome.runtime.onMessage.addListener((request) => {
  if (request.data) {
    copyToClipboard(request.data);
  }
});
