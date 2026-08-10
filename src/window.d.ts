// This file has no top-level import or export, so it is a global script and
// these declarations augment the global scope directly.
//
// Kept out of env.d.ts because that file is excluded from linting, which also
// hides these types from the type-aware rules and makes `window.*` lookups
// resolve to `any` at the call sites.
interface Window {
  /**
   * Registered by NavbarActionsBar.ts. Optional: the navbar script may not have
   * run (or may be absent from the page) when other scripts call it.
   */
  toggleActionsDropdown?: (open: boolean) => void;
}
