// Meowify Extension - Popup Controller (Global Synced)
document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('meow-toggle');
  const toggleDesc = document.getElementById('toggle-desc');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const imgCountEl = document.getElementById('img-count');
  const activeStateEl = document.getElementById('active-state');

  // Helper to update popup UI
  function updateUI(isActive, count = 0, message = '') {
    toggle.checked = isActive;
    if (isActive) {
      statusDot.classList.add('active');
      statusText.textContent = message || 'Meowify Active on all tabs! 🐾';
      toggleDesc.textContent = 'Auto-converting all images';
      activeStateEl.textContent = 'Active';
      activeStateEl.style.color = '#10ac84';
      if (count > 0) {
        imgCountEl.textContent = count;
      }
    } else {
      statusDot.classList.remove('active');
      statusText.textContent = message || 'Ready to Meowify';
      toggleDesc.textContent = 'Turn on to convert all tabs';
      activeStateEl.textContent = 'Off';
      activeStateEl.style.color = 'var(--text-muted)';
      imgCountEl.textContent = '0';
    }
  }

  // 1. Load global state from chrome.storage.local
  let isGloballyEnabled = false;
  try {
    const data = await chrome.storage.local.get(['meowifyEnabled']);
    isGloballyEnabled = Boolean(data && data.meowifyEnabled);
  } catch (err) {
    console.error('Failed to read storage:', err);
  }

  // 2. Query active tab
  let activeTab;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tab;
  } catch (err) {
    console.error('Failed to get active tab:', err);
  }

  // Check if current tab is a restricted browser internal page
  const isRestrictedUrl = !activeTab || !activeTab.url || 
    activeTab.url.startsWith('chrome://') || 
    activeTab.url.startsWith('edge://') || 
    activeTab.url.startsWith('about:') ||
    activeTab.url.startsWith('chrome-extension://') ||
    activeTab.url.startsWith('https://chromewebstore.google.com') ||
    activeTab.url.startsWith('https://chrome.google.com/webstore');

  // 3. Query cat count on the current tab if possible
  let currentTabCount = 0;
  if (!isRestrictedUrl && activeTab && activeTab.id) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => {
          return {
            active: Boolean(window.__meowify_active),
            count: window.__meowify_count || 0
          };
        }
      });
      if (results && results[0] && results[0].result) {
        currentTabCount = results[0].result.count || 0;
      }
    } catch {
      // Normal if page hasn't run content script yet
    }
  }

  updateUI(isGloballyEnabled, currentTabCount);

  // 4. Toggle switch event handler
  toggle.addEventListener('change', async () => {
    const isActivating = toggle.checked;

    // Save global state in chrome.storage.local (broadcasts to all open and future tabs)
    try {
      await chrome.storage.local.set({ meowifyEnabled: isActivating });
    } catch (err) {
      console.error('Failed to update storage:', err);
    }

    updateUI(isActivating, 0, isActivating ? 'Meowifying all tabs...' : 'Restoring original images...');

    // Also directly ensure the active tab updates immediately
    if (!isRestrictedUrl && activeTab && activeTab.id) {
      try {
        if (isActivating) {
          // Inject content.js if tab was loaded before extension install
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['content.js']
          });

          // Run scan and get count
          const results = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => {
              if (typeof window.__meowify_enable === 'function') {
                window.__meowify_enable();
              }
              return window.__meowify_count || 0;
            }
          });

          let count = 0;
          if (results && results[0] && results[0].result) {
            count = results[0].result;
          }
          updateUI(true, count, `🐾 ${count} cats on this page!`);
        } else {
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => {
              if (typeof window.__meowify_restore === 'function') {
                window.__meowify_restore();
              }
            }
          });
          updateUI(false, 0, 'Original images restored');
        }
      } catch (err) {
        console.log('Direct script execution on active tab:', err.message);
      }
    }
  });
});
