function initMobileNav() {
  const mobileNavToggle = document.getElementById("mobile-nav-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  const mobileNavClose = document.getElementById("mobile-nav-close");
  const body = document.body;
  const navbarActionsBar = document.getElementById("navbar-actions-bar");

  if (!mobileNavToggle || !mobileNav || !mobileNavClose) return;

  mobileNavToggle.addEventListener("click", () => {
    mobileNav.classList.remove("hidden");
    body.style.overflow = "hidden";
    mobileNavToggle.setAttribute("aria-expanded", "true");
    if (navbarActionsBar) navbarActionsBar.classList.add("hidden");
  });

  mobileNavClose.addEventListener("click", () => {
    mobileNav.classList.add("hidden");
    body.style.overflow = "";
    mobileNavToggle.setAttribute("aria-expanded", "false");
    if (navbarActionsBar) navbarActionsBar.classList.remove("hidden");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !mobileNav.classList.contains("hidden")) {
      mobileNav.classList.add("hidden");
      body.style.overflow = "";
      mobileNavToggle.setAttribute("aria-expanded", "false");
      if (navbarActionsBar) navbarActionsBar.classList.remove("hidden");
    }
  });

  const navLinks = mobileNav.querySelectorAll("nav a");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.add("hidden");
      body.style.overflow = "";
      mobileNavToggle.setAttribute("aria-expanded", "false");
      if (navbarActionsBar) navbarActionsBar.classList.remove("hidden");
    });
  });
}

document.addEventListener("DOMContentLoaded", initMobileNav);
