/**
 * Check if a URL is an external link
 *
 * @param href - The URL to check
 * @returns True if the URL is external (http://, https://, or //)
 */
export const isExternalLink = (href: string): boolean => {
  return /^(https?:)?\/\//.test(href);
};
