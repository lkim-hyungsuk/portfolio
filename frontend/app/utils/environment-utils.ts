/**
 * Utilities
 *
 * @module Utils
 */

/**
 * Determines if rendering engine is a browser or node environment.
 */
export const isBrowser = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    window &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).appEnvironment !== 'node'
  );
};

/*
 * Retrieves the browser cookie. Stand alone function for easy stubbing in test.
 *
 * @method getCookie
 * @return {String}
 */
export function getCookie(): string {
  if (isBrowser()) {
    return document.cookie;
  }
  return '';
}
