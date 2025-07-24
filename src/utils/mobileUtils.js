/**
 * Mobile-specific utilities for enhanced mobile experience
 */

export class MobileUtils {
  /**
   * Provide haptic feedback if available
   * @param {string} type - 'light', 'medium', 'heavy', 'selection', 'impact', 'notification'
   */
  static hapticFeedback(type = 'light') {
    if (!navigator.vibrate && !window.navigator.vibrate) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50],
      selection: [5],
      impact: [15],
      notification: [10, 50, 10],
      success: [10, 100, 10],
      error: [100, 50, 100]
    };
    
    const pattern = patterns[type] || patterns.light;
    
    try {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
      } else if (window.navigator.vibrate) {
        window.navigator.vibrate(pattern);
      }
    } catch (error) {
      // Silently fail if vibration is not supported
    }
  }

  /**
   * Check if device is mobile
   */
  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check if device supports touch
   */
  static isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Prevent zoom on double tap for specific elements
   */
  static preventDoubleTabZoom(element) {
    if (!element) return;
    
    let lastTouchEnd = 0;
    element.addEventListener('touchend', (event) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }

  /**
   * Scroll element into view with mobile-friendly behavior
   */
  static scrollIntoView(element, options = {}) {
    if (!element) return;
    
    const defaultOptions = {
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    };
    
    element.scrollIntoView({ ...defaultOptions, ...options });
  }

  /**
   * Add touch-friendly focus handling
   */
  static addTouchFocus(element) {
    if (!element) return;
    
    element.addEventListener('touchstart', () => {
      element.focus();
    });
  }

  /**
   * Get safe area insets
   */
  static getSafeAreaInsets() {
    const style = getComputedStyle(document.documentElement);
    return {
      top: style.getPropertyValue('env(safe-area-inset-top)') || '0px',
      right: style.getPropertyValue('env(safe-area-inset-right)') || '0px',
      bottom: style.getPropertyValue('env(safe-area-inset-bottom)') || '0px',
      left: style.getPropertyValue('env(safe-area-inset-left)') || '0px'
    };
  }

  /**
   * Optimize images for mobile
   */
  static optimizeImageLoading() {
    // Add intersection observer for lazy loading
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Add pull-to-refresh functionality
   */
  static addPullToRefresh(element, onRefresh) {
    if (!element || !this.isTouchDevice()) return;

    let startY = 0;
    let currentY = 0;
    let isRefreshing = false;

    element.addEventListener('touchstart', (e) => {
      if (element.scrollTop === 0) {
        startY = e.touches[0].clientY;
      }
    });

    element.addEventListener('touchmove', (e) => {
      if (element.scrollTop === 0 && !isRefreshing) {
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        
        if (diff > 100) {
          this.hapticFeedback('light');
          // Add visual feedback here if needed
        }
      }
    });

    element.addEventListener('touchend', () => {
      if (element.scrollTop === 0 && !isRefreshing) {
        const diff = currentY - startY;
        
        if (diff > 100) {
          isRefreshing = true;
          this.hapticFeedback('success');
          onRefresh().finally(() => {
            isRefreshing = false;
          });
        }
      }
      startY = 0;
      currentY = 0;
    });
  }

  /**
   * Add swipe gesture support
   */
  static addSwipeGesture(element, onSwipe) {
    if (!element || !this.isTouchDevice()) return;

    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    element.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    element.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;

      const diffX = endX - startX;
      const diffY = endY - startY;

      // Minimum swipe distance
      if (Math.abs(diffX) > 50 || Math.abs(diffY) > 50) {
        let direction;
        
        if (Math.abs(diffX) > Math.abs(diffY)) {
          direction = diffX > 0 ? 'right' : 'left';
        } else {
          direction = diffY > 0 ? 'down' : 'up';
        }

        this.hapticFeedback('selection');
        onSwipe(direction, { diffX, diffY });
      }
    });
  }

  /**
   * Initialize mobile optimizations
   */
  static init() {
    // Prevent zoom on double tap for the entire app
    this.preventDoubleTabZoom(document.body);
    
    // Optimize image loading
    this.optimizeImageLoading();
    
    // Add viewport height CSS custom property for mobile browsers
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
  }
}

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    MobileUtils.init();
  });
}

export default MobileUtils;
