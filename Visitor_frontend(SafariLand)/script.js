// Homepage-only browser interactions.
document.addEventListener("DOMContentLoaded", () => {
  // Show the current year in the footer.
  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  // Toggle the navigation menu on small screens.
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#main-nav");

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });
  }

  // Filter the attraction cards by their category.
  const filterButtons = document.querySelectorAll("[data-filter]");
  const attractionCards = document.querySelectorAll(".attraction-card");
  const filterStatus = document.querySelector(".filter-status");

  if (filterButtons.length && attractionCards.length) {
    const availableFilters = ["all", "adventure", "animals"];
    const requestedFilter = new URLSearchParams(window.location.search).get("category");
    const startingFilter = availableFilters.includes(requestedFilter) ? requestedFilter : "all";

    const showCategory = (category) => {
      attractionCards.forEach((card) => {
        card.hidden = category !== "all" && card.dataset.category !== category;
      });

      filterButtons.forEach((button) => {
        const selected = button.dataset.filter === category;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });

      if (filterStatus) {
        const visibleCount = Array.from(attractionCards).filter((card) => !card.hidden).length;
        filterStatus.textContent = `${visibleCount} attraction${visibleCount === 1 ? "" : "s"} shown`;
      }
    };

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => showCategory(button.dataset.filter));
    });

    showCategory(startingFilter);
  }

  // Links marked as placeholders do nothing until their destination is ready.
  document.querySelectorAll("[data-placeholder-link]").forEach((link) => {
    link.addEventListener("click", (event) => event.preventDefault());
  });
});