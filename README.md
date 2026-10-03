# Meowify 🐾

Meowify is a fun and lightweight Chrome Extension that replaces all images on any webpage with adorable random cats! Built with modern Manifest V3 standards.

## Features ✨
- **Global Tab Sync**: Turn it on once, and it stays active across all your open tabs and any new tabs you open.
- **Lazy-Load Support**: Automatically detects and meowifies new images as you scroll down on infinite-scroll websites (like Twitter, Reddit, or news feeds).
- **Layout Preservation**: Maintains the original image dimensions so websites don't break when pictures are replaced.
- **Cute & Modern UI**: A delightful popup interface with a custom toggle switch and live cat counter.

## Installation (Developer Mode) 🛠️
1. Clone or download this repository.
2. Open Google Chrome (or Edge/Brave) and go to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right corner).
4. Click **Load unpacked** and select the `Meowify` folder.
5. Pin the Meowify extension to your toolbar for quick access!

## How to Test 🧪
You can test the extension easily using the included `test.html` playground:
1. Open `test.html` in your browser.
2. Click the Meowify icon in your toolbar and flip the toggle ON.
3. Watch the images change! Scroll down to the infinite scroll zone to see dynamically loaded images get meowified instantly.

## Permissions Required 🔒
- `activeTab` & `scripting`: Required to inject the content script and replace images on the current webpage.
- `storage`: Required to sync the ON/OFF state globally across all your tabs.
- `host_permissions` (`<all_urls>`): Allows the extension to run automatically on all web pages when enabled.

## Technologies Used 💻
- HTML, CSS, JavaScript (Vanilla)
- Chrome Extension API (Manifest V3)
