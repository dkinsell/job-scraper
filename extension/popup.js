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

// Helper function to extract job ID from URL
const getJobIdFromUrl = (url) => {
  if (!url) return null;

  // Handle view URL format: .../jobs/view/4204546104/
  const viewMatch = url.match(/\/view\/(\d+)/);
  if (viewMatch) return viewMatch[1];

  // Handle search URL format: ...currentJobId=4204546104&...
  const searchMatch = url.match(/currentJobId=(\d+)/);
  if (searchMatch) return searchMatch[1];

  return null;
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
// 2. Dismiss Unviewed Jobs Functionality
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
              const allButtons = Array.from(
                document.querySelectorAll(selector)
              );
              let dismissedCount = 0;

              allButtons.forEach((btn) => {
                // Find the parent job card for this dismiss button
                const jobCard = btn.closest(".job-card-container");
                if (!jobCard) return; // Skip if we can't find the card

                // Check if the job card contains the "Viewed" text indicator
                const footerItems = jobCard.querySelectorAll(
                  ".job-card-container__footer-item"
                );
                let hasViewedTag = false;
                footerItems.forEach((item) => {
                  if (item.innerText.includes("Viewed")) {
                    hasViewedTag = true;
                  }
                });

                // Only click the dismiss button if the job card does NOT have the "Viewed" tag
                // and the button is actually visible on the page
                if (!hasViewedTag && btn.offsetParent !== null) {
                  btn.click();
                  dismissedCount++;
                }
              });

              resolve(dismissedCount);
            }, 1000); // Keep a small delay for stability
          });
        },
        args: [DISMISS_SELECTOR], // Pass the selector as an argument
      },
      (results) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Script execution failed:",
            chrome.runtime.lastError.message
          );
          showNotification("Error dismissing jobs.");
          return;
        }
        if (results && results[0] && results[0].result !== undefined) {
          const count = results[0].result;
          showNotification(`Dismissed ${count} unviewed job(s)`);
        } else {
          // Handle cases where the script might not return a result as expected
          console.log(
            "Dismiss script finished, but no result count received.",
            results
          );
          showNotification("Dismiss action completed.");
        }
      }
    );
  });
});
