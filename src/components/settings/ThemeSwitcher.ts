function setupThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", handleThemeToggle);
  }
}

function handleThemeToggle() {
  const isDark = localStorage.theme === "light";
  localStorage.theme = isDark ? "dark" : "light";
  document.documentElement.classList.toggle("dark", isDark);
}

document.addEventListener("DOMContentLoaded", setupThemeToggle);
