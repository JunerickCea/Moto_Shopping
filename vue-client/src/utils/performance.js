// Debounce function to limit how often a function can be called
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Throttle function to limit the rate of execution
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Check if device is low-end
export function isLowEndDevice() {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Check for low memory or low-end device
  const isLowMemory = navigator.deviceMemory < 4;
  const isLowEndCpu = navigator.hardwareConcurrency < 4;
  
  return prefersReducedMotion || isLowMemory || isLowEndCpu;
}

// Optimize animations based on device capabilities
export function optimizeAnimations() {
  if (isLowEndDevice()) {
    // Reduce animations for low-end devices
    document.documentElement.classList.add('reduce-animations');
  }
}