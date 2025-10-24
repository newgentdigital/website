let lastScrollY = 0;
let ticking = false;

const container = document.getElementById("navbar-container");
const actionsBar = document.getElementById("navbar-actions-bar");

function updateNavbar() {
  if (!container || !actionsBar) return;

  const currentScrollY = window.scrollY;
  const actionsHeight = actionsBar.offsetHeight;

  if (currentScrollY <= actionsHeight) {
    container.style.transition = "none";
    container.style.transform = "translateY(0)";
    void container.offsetHeight; // Force reflow
    container.style.transition = "";
  } else if (currentScrollY > lastScrollY) {
    container.style.transform = `translateY(-${actionsHeight}px)`;
    window.toggleActionsDropdown?.(false);
  } else {
    container.style.transform = "translateY(0)";
  }

  lastScrollY = currentScrollY;
}

function handleScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateNavbar();
      ticking = false;
    });
    ticking = true;
  }
}

window.addEventListener("scroll", handleScroll, { passive: true });
document.addEventListener("DOMContentLoaded", updateNavbar);
