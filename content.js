// Meowify Extension - Global Content Script
// Replaces images with cute cats and automatically converts lazy-loaded images on scroll.

(function() {
  // Prevent duplicate initialization in the same frame
  if (window.__meowify_initialized) return;
  window.__meowify_initialized = true;

  const CURATED_CATS = [
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1517451330947-7809dead78d5?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?auto=format&fit=crop&w=600&q=80"
  ];

  window.__meowify_active = false;
  window.__meowify_count = 0;
  let observer = null;
  let scrollHandler = null;
  let sweepInterval = null;

  function getRandomCatUrl(width, height) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    const w = Math.max(80, Math.min(1200, Math.round(width || 400)));
    const h = Math.max(80, Math.min(1200, Math.round(height || 300)));

    if (Math.random() > 0.35) {
      return `https://cataas.com/cat?width=${w}&height=${h}&d=${randomSeed}`;
    } else {
      const idx = Math.floor(Math.random() * CURATED_CATS.length);
      return CURATED_CATS[idx];
    }
  }

  // Meowify an <img> element
  function meowifyImage(img) {
    if (!img) return false;

    // Check if this image was already meowified with our cat image
    if (img.dataset.meowified === 'true' && img.src === img.dataset.meowifyCatSrc) {
      return false;
    }

    // Capture dimensions before replacing to retain layout structure
    const rect = img.getBoundingClientRect();
    const currentWidth = rect.width || img.offsetWidth || img.width;
    const currentHeight = rect.height || img.offsetHeight || img.height;

    // Save original attributes for restoration
    if (!img.dataset.meowifyOriginalSrc) {
      img.dataset.meowifyOriginalSrc = img.src || img.getAttribute('src') || '';
    }
    if (img.srcset && !img.dataset.meowifyOriginalSrcset) {
      img.dataset.meowifyOriginalSrcset = img.srcset;
    }
    if (!img.dataset.meowifyOriginalStyle) {
      img.dataset.meowifyOriginalStyle = img.getAttribute('style') || '';
    }

    // Preserve dimensions and visual presentation
    if (currentWidth > 0 && !img.style.width) {
      img.style.width = `${currentWidth}px`;
    }
    if (currentHeight > 0 && !img.style.height) {
      img.style.height = `${currentHeight}px`;
    }
    img.style.objectFit = 'cover';

    // Remove any lazy loading attributes that might defer loading
    if (img.loading === 'lazy') {
      img.loading = 'eager';
    }

    // Generate cat URL
    const catUrl = getRandomCatUrl(currentWidth, currentHeight);

    // Fallback if image fails
    img.onerror = function() {
      const fallback = CURATED_CATS[Math.floor(Math.random() * CURATED_CATS.length)];
      if (img.src !== fallback) {
        img.src = fallback;
        img.dataset.meowifyCatSrc = fallback;
      }
    };

    // Remove srcset so browser doesn't override cat src
    img.removeAttribute('srcset');
    img.dataset.meowified = 'true';
    img.dataset.meowifyCatSrc = catUrl;
    img.src = catUrl;

    return true;
  }

  // Meowify <picture> elements
  function meowifyPicture(picture) {
    if (!picture) return false;
    let modified = false;

    const sources = picture.querySelectorAll('source');
    sources.forEach(source => {
      if (!source.dataset.meowifyOriginalSrcset) {
        source.dataset.meowifyOriginalSrcset = source.srcset || '';
      }
      source.removeAttribute('srcset');
      modified = true;
    });

    const img = picture.querySelector('img');
    if (img) {
      if (meowifyImage(img)) modified = true;
    }

    return modified;
  }

  // Scan and meowify all images on the page
  function scanAndMeowify() {
    if (!window.__meowify_active) return 0;
    let count = 0;

    // Picture elements
    const pictures = document.querySelectorAll('picture');
    pictures.forEach(pic => {
      if (meowifyPicture(pic)) count++;
    });

    // All images (including ones where lazy loader might have swapped src)
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (meowifyImage(img)) count++;
    });

    if (count > 0) {
      window.__meowify_count = (window.__meowify_count || 0) + count;
    }
    return count;
  }

  // Enable Meowify Mode
  function enableMeowify() {
    if (window.__meowify_active) {
      scanAndMeowify();
      return;
    }

    window.__meowify_active = true;
    scanAndMeowify();

    // 1. Observe DOM additions and attribute changes (lazy loaders swapping src/srcset/data-src)
    if (!observer) {
      observer = new MutationObserver(mutations => {
        if (!window.__meowify_active) return;
        let shouldScan = false;

        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            shouldScan = true;
            break;
          } else if (mutation.type === 'attributes') {
            const target = mutation.target;
            if (target && target.tagName === 'IMG' && target.dataset.meowifyCatSrc !== target.src) {
              shouldScan = true;
              break;
            }
          }
        }

        if (shouldScan) {
          requestAnimationFrame(scanAndMeowify);
        }
      });

      const rootNode = document.body || document.documentElement;
      if (rootNode) {
        observer.observe(rootNode, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['src', 'srcset', 'data-src', 'data-lazy-src', 'data-original']
        });
      }
    }

    // 2. Continuous scroll listener: sweeps any newly visible / lazy-loaded images as user scrolls
    if (!scrollHandler) {
      let isScrolling = false;
      scrollHandler = () => {
        if (!window.__meowify_active) return;
        if (!isScrolling) {
          isScrolling = true;
          requestAnimationFrame(() => {
            scanAndMeowify();
            isScrolling = false;
          });
        }
      };
      window.addEventListener('scroll', scrollHandler, { passive: true });
    }

    // 3. Periodic light sweep every 1.5s to catch async infinite scrolls
    if (!sweepInterval) {
      sweepInterval = setInterval(() => {
        if (window.__meowify_active) {
          scanAndMeowify();
        }
      }, 1500);
    }
  }

  // Restore original images
  function disableMeowify() {
    window.__meowify_active = false;

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler);
      scrollHandler = null;
    }

    if (sweepInterval) {
      clearInterval(sweepInterval);
      sweepInterval = null;
    }

    // Restore picture sources
    const sources = document.querySelectorAll('source[data-meowify-original-srcset]');
    sources.forEach(source => {
      source.srcset = source.dataset.meowifyOriginalSrcset;
      delete source.dataset.meowifyOriginalSrcset;
    });

    // Restore images
    const images = document.querySelectorAll('img[data-meowified="true"]');
    images.forEach(img => {
      if (img.dataset.meowifyOriginalSrc) {
        img.src = img.dataset.meowifyOriginalSrc;
        delete img.dataset.meowifyOriginalSrc;
      }
      if (img.dataset.meowifyOriginalSrcset) {
        img.srcset = img.dataset.meowifyOriginalSrcset;
        delete img.dataset.meowifyOriginalSrcset;
      }
      if (img.dataset.meowifyOriginalStyle !== undefined) {
        if (img.dataset.meowifyOriginalStyle) {
          img.setAttribute('style', img.dataset.meowifyOriginalStyle);
        } else {
          img.removeAttribute('style');
        }
        delete img.dataset.meowifyOriginalStyle;
      }
      delete img.dataset.meowifyCatSrc;
      delete img.dataset.meowified;
    });

    window.__meowify_count = 0;
  }

  // Expose global methods
  window.__meowify_enable = enableMeowify;
  window.__meowify_restore = disableMeowify;
  window.__meowify_scan = scanAndMeowify;

  // Listen for storage changes across tabs
  if (chrome && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.meowifyEnabled !== undefined) {
        if (changes.meowifyEnabled.newValue) {
          enableMeowify();
        } else {
          disableMeowify();
        }
      }
    });
  }

  // On initial page load: check global setting from chrome.storage
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['meowifyEnabled'], result => {
      if (result && result.meowifyEnabled) {
        enableMeowify();
      }
    });
  }
})();
