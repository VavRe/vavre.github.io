/* Appendix navigation: sticky sub-navbar (between-section) + a floating
   widget table-of-contents (within-section). Pure DOM/vanilla JS, no
   dependency on app.js's state or data — must work whether or not the
   appendix has lazy-booted yet. */
(() => {
  "use strict";

  const APPENDIX_SECTION_IDS = [
    "summary",
    "model-extraction",
    "single-multi",
    "sentiment",
    "subreddits",
    "concepts",
    "concept-sentiment",
    "release-ranking",
    "release-concepts",
    "methods",
  ];

  const slug = (s) =>
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  function indexWidgets() {
    const map = new Map(); // sectionId -> [{id, label}]
    APPENDIX_SECTION_IDS.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (!section) return;
      const items = [];
      section.querySelectorAll(".visual-grid > .viz-cell, .visual-grid > article").forEach((cell) => {
        const h3 = cell.querySelector(".cell-head h3");
        if (!h3) return;
        if (!cell.id) cell.id = `w-${sectionId}-${slug(h3.textContent)}`;
        cell.style.scrollMarginTop = "104px";
        items.push({ id: cell.id, label: h3.textContent.trim() });
      });
      map.set(sectionId, items);
    });
    return map;
  }

  function sectionTitle(sectionId) {
    const section = document.getElementById(sectionId);
    const h2 = section && section.querySelector(".section-head h2");
    return h2 ? h2.textContent.trim() : sectionId;
  }

  function boot() {
    const nav = document.getElementById("appendix-nav");
    const appendixDivider = document.getElementById("appendix");
    const toc = document.getElementById("widget-toc");
    if (!nav || !appendixDivider || !toc) return;

    const widgetsBySection = indexWidgets();
    const navLinks = [...nav.querySelectorAll("a[data-section]")];
    const tocList = toc.querySelector(".widget-toc-list");
    const tocTitle = toc.querySelector(".widget-toc-title");
    const tocToggle = toc.querySelector(".widget-toc-toggle");

    let navLocked = false;
    let navLockTimer = null;
    let currentSection = null;

    function renderToc(sectionId) {
      const items = widgetsBySection.get(sectionId) || [];
      if (!items.length) {
        toc.hidden = true;
        return;
      }
      toc.hidden = false;
      tocTitle.textContent = sectionTitle(sectionId);
      tocList.innerHTML = items
        .map((item) => `<li><a href="#${item.id}" data-widget="${item.id}">${item.label}</a></li>`)
        .join("");
    }

    function setCurrentSection(sectionId) {
      if (sectionId === currentSection) return;
      currentSection = sectionId;
      navLinks.forEach((a) => a.classList.toggle("is-current", a.dataset.section === sectionId));
      renderToc(sectionId);
    }

    // Show/hide the sticky navbar once the user reaches the appendix.
    const appendixVisibility = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          nav.hidden = !entry.isIntersecting && entry.boundingClientRect.top > 0;
        });
      },
      { rootMargin: "0px 0px -95% 0px", threshold: 0 },
    );
    appendixVisibility.observe(appendixDivider);

    // Top-band trigger: whichever section overlaps a narrow band just
    // under the sticky bar is "current". Robust to sections taller than
    // the viewport, unlike a naive isIntersecting check.
    const sectionEls = APPENDIX_SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    const bandObserver = new IntersectionObserver(
      (entries) => {
        if (navLocked) return;
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const top = visible.find((e) => e.boundingClientRect.top >= -4) || visible[0];
        setCurrentSection(top.target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    sectionEls.forEach((el) => bandObserver.observe(el));

    // Clicking a nav/TOC link: suppress the observer briefly so smooth
    // scrolling through intermediate sections doesn't strobe the highlight.
    function lockNav(sectionId) {
      navLocked = true;
      setCurrentSection(sectionId);
      clearTimeout(navLockTimer);
      navLockTimer = setTimeout(() => {
        navLocked = false;
      }, 700);
    }
    navLinks.forEach((a) => a.addEventListener("click", () => lockNav(a.dataset.section)));
    toc.addEventListener("click", (ev) => {
      const link = ev.target.closest("a[data-widget]");
      if (link) navLocked = true;
      clearTimeout(navLockTimer);
      navLockTimer = setTimeout(() => {
        navLocked = false;
      }, 700);
    });

    tocToggle.addEventListener("click", () => {
      const collapsed = toc.classList.toggle("is-collapsed");
      tocToggle.setAttribute("aria-expanded", String(!collapsed));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
