/* RealAndPaws — shared site JS (vanilla, dependency-free) */
(function () {
  "use strict";

  /* (a) Mobile hamburger nav toggle */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  /* (b) Mark the current page's nav link as active */
  var current = location.pathname.split("/").pop() || "index.html";
  if (current === "") current = "index.html";
  var links = document.querySelectorAll(".nav a");
  links.forEach(function (link) {
    var href = (link.getAttribute("href") || "").split("/").pop();
    if (href === current) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    }
  });

  /* (c) Inject the current year */
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
