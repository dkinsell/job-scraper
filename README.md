# LinkedIn Job Application Tracker

A Chrome extension that helps you track your job applications by scraping job information from LinkedIn job postings.

## Features

- One-click job information scraping
- Automatically captures:
  - Company name
  - Job title
  - Location (set to Remote)
  - Application status
  - Application type (Quick apply/Traditional App)
  - Job posting URL
  - Compensation (when available)
- Formats data for easy spreadsheet pasting

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `extension` directory from this project

## Usage

1. Navigate to a LinkedIn job posting
2. Click the extension icon in your Chrome toolbar
3. Click "Scrape Job Info" in the popup
4. The job information will be copied to your clipboard
5. Paste the information into your job tracking spreadsheet

## Project Structure

- `extension/`
  - `manifest.json` - Extension configuration
  - `popup.html` - Extension popup interface
  - `popup.js` - Main functionality
  - `background.js` - Background script
