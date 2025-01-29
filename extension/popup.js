/* global chrome */

function scrapeJobInfo() {
  const today = new Date();
  const dateStr = `${
    today.getMonth() + 1
  }/${today.getDate()}/${today.getFullYear()}`;

  const applyButton = document.querySelector(
    '.jobs-apply-button--top-card button, button[role="link"][aria-label*="Apply to"]'
  );
  const buttonText = applyButton?.innerText.trim().toLowerCase() || "";
  const applicationType = buttonText.includes("easy apply")
    ? "Quick apply"
    : "Traditional App";

  const compensationElement = document.querySelector(
    ".job-details-preferences-and-skills__pill .ui-label.text-body-small"
  );
  const compensationText = compensationElement?.innerText.trim() || "";
  const compensation = compensationText.includes("$") ? compensationText : "";

  const jobInfo = {
    date: dateStr,
    company:
      document
        .querySelector(".job-details-jobs-unified-top-card__company-name")
        ?.innerText.trim() || "",
    jobTitle:
      document
        .querySelector(".t-24.job-details-jobs-unified-top-card__job-title")
        ?.innerText.trim() || "",
    location: "Remote",
    status: "Applied",
    applicationType,
    pageUrl: window.location.href,
    compensation,
  };

  const formattedData = `${jobInfo.date}\t${jobInfo.company}\t${jobInfo.jobTitle}\t${jobInfo.location}\t${jobInfo.status}\t${jobInfo.applicationType}\t${jobInfo.pageUrl}\t\t\t\t${jobInfo.compensation}`;
  chrome.runtime.sendMessage({ data: formattedData });
}

document.getElementById("scrape").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: scrapeJobInfo,
    });
  });
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.data) {
    navigator.clipboard
      .writeText(request.data)
      .then(() => {
        alert("Job information copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  }
});
