type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

declare global {
  interface Window {
    toggleActionsDropdown?: (open: boolean) => void;
  }
}
