/* global chrome */

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeJobInfo,
  });
});

function scrapeJobInfo() {
  const jobInfo = {
    company: document.querySelector(".company-selector")?.innerText || "",
    jobTitle: document.querySelector(".job-title-selector")?.innerText || "",
    compensation:
      document.querySelector(".compensation-selector")?.innerText || "",
    pageUrl: window.location.href,
    applicationType:
      document.querySelector(".application-type-selector")?.innerText || "",
  };

  const formattedData = `${jobInfo.company}\t${jobInfo.jobTitle}\t${jobInfo.compensation}\t${jobInfo.pageUrl}\t${jobInfo.applicationType}`;

  chrome.runtime.sendMessage({ data: formattedData });
}
