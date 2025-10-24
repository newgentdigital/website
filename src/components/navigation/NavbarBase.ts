let lastScrollY = 0;
let ticking = false;

function updateNavbar() {
  const currentScrollY = window.scrollY;
  const container = document.getElementById("navbar-container");
  const actionsBar = document.getElementById("navbar-actions-bar");

  if (!container || !actionsBar) return;

  if (window.innerWidth >= 768) {
    container.style.transform = "translateY(0)";
    return;
  }

  const actionsHeight = actionsBar.offsetHeight;

  if (currentScrollY > lastScrollY && currentScrollY > actionsHeight) {
    container.style.transform = `translateY(-${actionsHeight}px)`;
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

function handleResize() {
  updateNavbar();
}

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", handleResize, { passive: true });

document.addEventListener("DOMContentLoaded", updateNavbar);
