/**
 * Focus-trap helpers for Dialog, Sheet, Popover, and DropdownMenu surfaces.
 *
 * Radix UI provides built-in focus management for modal surfaces, but these
 * helpers address edge cases required by the accessibility baseline:
 *
 * - Empty surfaces (no focusable elements): focus the container itself
 * - Timing guarantee: focus must move within 100ms of open
 * - Focus return: closing returns focus to opener (or <body> if removed)
 *
 * Requirements: 8.5, 8.6, 8.8, 8.9
 */

import type React from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
].join(',');

/**
 * Returns all focusable elements within a container.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
  );
}

/**
 * Ensures focus is placed on the first focusable element within a surface,
 * or on the container itself if no focusable elements exist.
 * Must complete within 100ms of being called.
 *
 * @param container - The surface container element
 * @returns cleanup function to clear any pending timers
 */
export function ensureFocusWithinSurface(container: HTMLElement): () => void {
  let rafId: number | null = null;

  // Use requestAnimationFrame to ensure DOM is painted before focusing
  rafId = requestAnimationFrame(() => {
    const focusables = getFocusableElements(container);

    if (focusables.length > 0) {
      // Focus the first focusable element
      focusables[0].focus();
    } else {
      // Empty surface: make container focusable and focus it
      if (!container.hasAttribute('tabindex')) {
        container.setAttribute('tabindex', '-1');
      }
      container.focus();
    }
    rafId = null;
  });

  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  };
}

/**
 * Returns focus to the opener element, or to document.body if the opener
 * is no longer in the DOM.
 *
 * @param opener - The element that triggered the surface open
 */
export function returnFocusToOpener(opener: HTMLElement | null): void {
  if (opener && document.body.contains(opener)) {
    opener.focus();
  } else {
    // Opener removed from DOM — focus body as fallback
    document.body.focus();
  }
}

/**
 * Handles Tab/Shift+Tab trapping within a container.
 * This is a supplementary handler for cases where Radix's built-in
 * focus trap may not be active (e.g., empty surfaces).
 *
 * @param event - The keyboard event
 * @param container - The surface container element
 */
export function handleFocusTrapKeyDown(
  event: KeyboardEvent | React.KeyboardEvent,
  container: HTMLElement
): void {
  if (event.key !== 'Tab') return;

  const focusables = getFocusableElements(container);

  // Empty surface: prevent Tab from leaving the container
  if (focusables.length === 0) {
    event.preventDefault();
    // Keep focus on the container
    container.focus();
    return;
  }

  const firstFocusable = focusables[0];
  const lastFocusable = focusables[focusables.length - 1];
  const activeElement = document.activeElement as HTMLElement;

  if (event.shiftKey) {
    // Shift+Tab: if on first element, wrap to last
    if (activeElement === firstFocusable || activeElement === container) {
      event.preventDefault();
      lastFocusable.focus();
    }
  } else {
    // Tab: if on last element, wrap to first
    if (activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  }
}
