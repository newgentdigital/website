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

  function openDropdown() {
    menu!.classList.remove("hidden");
    arrow!.classList.add("rotate-180");
    toggle!.setAttribute("aria-expanded", "true");
  }

  function closeDropdown() {
    menu!.classList.add("hidden");
    arrow!.classList.remove("rotate-180");
    toggle!.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = !menu.classList.contains("hidden");
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  document.addEventListener("click", (e) => {
    if (!menu.classList.contains("hidden")) {
      closeDropdown();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.classList.contains("hidden")) {
      closeDropdown();
    }
  });

  const links = menu.querySelectorAll("a");
  links.forEach((link) => {
    link.addEventListener("click", () => {
      closeDropdown();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initPlatformDropdown();
});
