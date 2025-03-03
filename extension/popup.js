/* global chrome */

// CSS selectors for LinkedIn job posting page elements
const LINKEDIN_SELECTORS = {
  company: ".job-details-jobs-unified-top-card__company-name",
  jobTitle: ".t-24.job-details-jobs-unified-top-card__job-title",
  applyButton:
    '.jobs-apply-button--top-card button, button[role="link"][aria-label*="Apply to"]',
  compensation:
    ".job-details-preferences-and-skills__pill .ui-label.text-body-small",
};

/**
 * Main function that scrapes job information from the LinkedIn page.
 * This function is injected into the page context by the Chrome scripting API.
 */
const scrapeJobInfo = () => {
  // Duplicate selectors inside function since they can't be passed directly to the page context
  const SELECTORS = {
    company: ".job-details-jobs-unified-top-card__company-name",
    jobTitle: ".t-24.job-details-jobs-unified-top-card__job-title",
    applyButton:
      '.jobs-apply-button--top-card button, button[role="link"][aria-label*="Apply to"]',
    compensation:
      ".job-details-preferences-and-skills__pill .ui-label.text-body-small",
  };

  // Utility function to safely get text content from an element
  const getElementText = (selector) => {
    return document.querySelector(selector)?.innerText.trim() || "";
  };

  // Determine if the job uses Quick Apply or Traditional Application
  const getApplicationType = (buttonText) => {
    return buttonText.toLowerCase().includes("easy apply")
      ? "Quick apply"
      : "Traditional App";
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
    applicationType: getApplicationType(buttonText),
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
  // Get the active tab and inject the scraping script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: scrapeJobInfo,
    });
  });
});

// Listen for the scraped data from the injected script
chrome.runtime.onMessage.addListener((request) => {
  if (request.data) {
    copyToClipboard(request.data);
  }
});
