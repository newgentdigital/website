function toggleActionsDropdown(open: boolean) {
  const menu = document.getElementById(
    "platform-dropdown-menu",
  ) as HTMLUListElement | null;
  const arrow = document.getElementById(
    "platform-dropdown-arrow",
  ) as HTMLElement | null;
  const toggle = document.getElementById(
    "platform-dropdown-toggle",
  ) as HTMLButtonElement | null;

  if (!menu || !arrow || !toggle) return;

  if (open) {
    menu.classList.remove("hidden");
    arrow.classList.add("rotate-180");
    toggle.setAttribute("aria-expanded", "true");
  } else {
    menu.classList.add("hidden");
    arrow.classList.remove("rotate-180");
    toggle.setAttribute("aria-expanded", "false");
  }
}

function initPlatformDropdown() {
  const toggle = document.getElementById(
    "platform-dropdown-toggle",
  ) as HTMLButtonElement | null;
  const menu = document.getElementById(
    "platform-dropdown-menu",
  ) as HTMLUListElement | null;
  const arrow = document.getElementById(
    "platform-dropdown-arrow",
  ) as HTMLElement | null;

  if (!toggle || !menu || !arrow) return;

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = !menu.classList.contains("hidden");
    if (isOpen) {
      toggleActionsDropdown(false);
    } else {
      toggleActionsDropdown(true);
    }
  });

  document.addEventListener("click", () => {
    if (!menu.classList.contains("hidden")) {
      toggleActionsDropdown(false);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.classList.contains("hidden")) {
      toggleActionsDropdown(false);
    }
  });

  const links = menu.querySelectorAll("a");
  links.forEach((link) => {
    link.addEventListener("click", () => {
      toggleActionsDropdown(false);
    });
  });
}

window.toggleActionsDropdown = toggleActionsDropdown;

document.addEventListener("DOMContentLoaded", () => {
  initPlatformDropdown();
});
