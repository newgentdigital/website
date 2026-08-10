// querySelector<T> already returns `T | null`, so no cast is needed to narrow
// the element type and the null case stays visible.
const selectors = {
  menu: "#platform-dropdown-menu",
  arrow: "#platform-dropdown-arrow",
  toggle: "#platform-dropdown-toggle",
} as const;

function elements() {
  const menu = document.querySelector<HTMLUListElement>(selectors.menu);
  const arrow = document.querySelector<HTMLElement>(selectors.arrow);
  const toggle = document.querySelector<HTMLButtonElement>(selectors.toggle);

  if (!menu || !arrow || !toggle) return null;
  return { menu, arrow, toggle };
}

function toggleActionsDropdown(open: boolean) {
  const found = elements();
  if (!found) return;

  const { menu, arrow, toggle } = found;
  menu.classList.toggle("hidden", !open);
  arrow.classList.toggle("rotate-180", open);
  toggle.setAttribute("aria-expanded", String(open));
}

function initPlatformDropdown() {
  const found = elements();
  if (!found) return;

  const { menu, toggle } = found;

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleActionsDropdown(menu.classList.contains("hidden"));
  });

  document.addEventListener("click", () => {
    if (!menu.classList.contains("hidden")) toggleActionsDropdown(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.classList.contains("hidden")) {
      toggleActionsDropdown(false);
    }
  });

  for (const link of menu.querySelectorAll("a")) {
    link.addEventListener("click", () => {
      toggleActionsDropdown(false);
    });
  }
}

window.toggleActionsDropdown = toggleActionsDropdown;

document.addEventListener("DOMContentLoaded", () => {
  initPlatformDropdown();
});

// The export keeps this file a module, matching how it is bundled. Treated as a
// global script, TypeScript would hoist `toggleActionsDropdown` onto
// `globalThis` and hide the fact that callers must handle its absence.
export { toggleActionsDropdown };
