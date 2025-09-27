
import { useEffect, useCallback } from 'react';

export const useAccessibility = () => {
  // Skip link for keyboard navigation
  const addSkipLink = useCallback(() => {
    const existingSkipLink = document.querySelector('#skip-to-main');
    if (existingSkipLink) return;

    const skipLink = document.createElement('a');
    skipLink.id = 'skip-to-main';
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md';
    
    document.body.prepend(skipLink);
  }, []);

  // Enhanced focus management
  const manageFocus = useCallback(() => {
    let lastFocusedElement: HTMLElement | null = null;

    const handleFocusIn = (e: FocusEvent) => {
      lastFocusedElement = e.target as HTMLElement;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to restore focus
      if (e.key === 'Escape' && lastFocusedElement) {
        lastFocusedElement.focus();
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Announce important changes to screen readers
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Check for reduced motion preference
  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    addSkipLink();
    const cleanupFocus = manageFocus();

    // Add main content landmark if it doesn't exist
    const main = document.querySelector('main');
    if (main && !main.id) {
      main.id = 'main-content';
    }

    return cleanupFocus;
  }, [addSkipLink, manageFocus]);

  return {
    announceToScreenReader,
    prefersReducedMotion,
    addSkipLink,
    manageFocus
  };
};
