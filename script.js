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

/* ---------- Dog Quiz: floating "Quiz" button + modal (loads on every page) ---------- */
(function () {
  "use strict";

  if (document.querySelector(".quiz-fab")) return; // never inject twice

  var COUNT = 10;   // questions per round
  var PASS = 6;     // passing score

  // A pool large enough that each round of 10 can differ from the last.
  var BANK = [
    { q: "What is a baby dog called?", c: ["A puppy", "A kitten", "A cub", "A foal"], a: "A puppy" },
    { q: "Which of a dog's senses is the strongest?", c: ["Smell", "Sight", "Taste", "Touch"], a: "Smell" },
    { q: "About how many teeth does an adult dog have?", c: ["42", "20", "32", "52"], a: "42" },
    { q: "Which breed is the fastest runner?", c: ["Greyhound", "Bulldog", "Pug", "Basset Hound"], a: "Greyhound" },
    { q: "How do dogs mainly cool themselves down?", c: ["Panting", "Sweating all over their body", "Shivering", "Rolling over"], a: "Panting" },
    { q: "A group of puppies born together is called a...?", c: ["Litter", "Pack", "Herd", "Flock"], a: "Litter" },
    { q: "Which of these foods is toxic to dogs?", c: ["Chocolate", "Plain carrots", "Plain rice", "Plain cooked chicken"], a: "Chocolate" },
    { q: "What is the typical lifespan of a dog?", c: ["10 to 13 years", "2 to 3 years", "25 to 30 years", "40 to 50 years"], a: "10 to 13 years" },
    { q: "Dogs are descended from which wild animal?", c: ["Wolves", "Foxes", "Lions", "Bears"], a: "Wolves" },
    { q: "Which body part do dogs sweat through?", c: ["Their paw pads", "Their ears", "Their back", "Their tail"], a: "Their paw pads" },
    { q: "Which breed is nicknamed the 'wiener dog'?", c: ["Dachshund", "Poodle", "Boxer", "Beagle"], a: "Dachshund" },
    { q: "At what age do puppies typically open their eyes?", c: ["Around 2 weeks old", "At birth", "At 3 months old", "At 1 year old"], a: "Around 2 weeks old" },
    { q: "What is a dog with parents of two different breeds called?", c: ["A crossbreed", "A purebred", "A pedigree", "A thoroughbred"], a: "A crossbreed" },
    { q: "Which of these is a giant dog breed?", c: ["Great Dane", "Chihuahua", "Pug", "Beagle"], a: "Great Dane" },
    { q: "What should a dog always have access to?", c: ["Fresh, clean water", "Chocolate", "Coffee", "Grapes"], a: "Fresh, clean water" },
    { q: "Which breed is famously used as a sled dog?", c: ["Siberian Husky", "Pug", "Dachshund", "Chihuahua"], a: "Siberian Husky" },
    { q: "Which vaccine is considered core for dogs?", c: ["Rabies", "Measles", "Tetanus", "Flu"], a: "Rabies" },
    { q: "What is a friendly way to let a dog meet you?", c: ["Let it sniff the back of your hand", "Stare into its eyes", "Pat its head quickly", "Hug it right away"], a: "Let it sniff the back of your hand" },
    { q: "Which is a sign of a relaxed, happy dog?", c: ["A loose, wagging body", "A tucked tail", "Bared teeth", "A stiff, frozen stance"], a: "A loose, wagging body" },
    { q: "How often do most adult dogs do best being fed?", c: ["Twice a day", "Once a week", "Every hour", "Only at night"], a: "Twice a day" },
    { q: "About how long is a dog's pregnancy?", c: ["About 9 weeks", "About 9 months", "About 1 week", "About 6 months"], a: "About 9 weeks" },
    { q: "Which breed is commonly trained as a guide dog?", c: ["Labrador Retriever", "Chihuahua", "Pug", "Dachshund"], a: "Labrador Retriever" },
    { q: "What is the main purpose of a dog's whiskers?", c: ["Sensing their surroundings", "Tasting food", "Hearing sounds", "Digesting food"], a: "Sensing their surroundings" },
    { q: "What helps keep a dog's teeth healthy?", c: ["Regular tooth brushing", "Feeding candy", "Giving coffee", "Never touching them"], a: "Regular tooth brushing" },
    { q: "Which is the smallest of these dog breeds?", c: ["Chihuahua", "Boxer", "Labrador Retriever", "Great Dane"], a: "Chihuahua" },
    { q: "A 'play bow' (front down, back end up) usually means a dog...?", c: ["Wants to play", "Is angry", "Is sick", "Is sleepy"], a: "Wants to play" },
    { q: "Which is healthiest for most dogs every day?", c: ["Exercise like walks and play", "Sleeping all day", "Eating constantly", "Staying crated all day"], a: "Exercise like walks and play" },
    { q: "What does it mean to 'house-train' a dog?", c: ["Teach it where to go to the bathroom", "Teach it to cook", "Teach it to drive", "Teach it to swim"], a: "Teach it where to go to the bathroom" },
    { q: "Which of these is NOT safe for a dog to eat?", c: ["Grapes", "Plain carrots", "Plain pumpkin", "Plain rice"], a: "Grapes" },
    { q: "What type of eater is a dog?", c: ["An omnivore", "A strict herbivore", "An insect-only eater", "It does not eat"], a: "An omnivore" }
  ];

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  var lastIdx = [];   // bank indices used in the previous round
  var current = [];   // current 10 questions, each with its choices shuffled

  function pickQuestions() {
    var all = BANK.map(function (_, i) { return i; });
    var prev = {};
    lastIdx.forEach(function (i) { prev[i] = true; });
    var fresh = shuffle(all.filter(function (i) { return !prev[i]; }));
    var stale = shuffle(all.filter(function (i) { return prev[i]; }));
    var chosen = fresh.concat(stale).slice(0, COUNT); // prefers questions not used last time
    lastIdx = chosen.slice();
    current = chosen.map(function (i) {
      return { q: BANK[i].q, correct: BANK[i].a, choices: shuffle(BANK[i].c.slice()) };
    });
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  // Build the floating button + modal shell once.
  var fab = document.createElement("button");
  fab.type = "button";
  fab.className = "quiz-fab";
  fab.setAttribute("aria-haspopup", "dialog");
  fab.setAttribute("aria-controls", "quiz-modal");
  fab.innerHTML = '<span class="quiz-fab-icon" aria-hidden="true">🐾</span> Quiz';

  var overlay = document.createElement("div");
  overlay.className = "quiz-overlay";
  overlay.hidden = true;
  overlay.innerHTML =
    '<div class="quiz-modal" id="quiz-modal" role="dialog" aria-modal="true" aria-labelledby="quiz-title">' +
      '<div class="quiz-head">' +
        '<h2 id="quiz-title">🐾 Dog Quiz</h2>' +
        '<p>Answer 10 questions — score ' + PASS + ' or more to pass!</p>' +
        '<button type="button" class="quiz-close" aria-label="Close quiz">&times;</button>' +
      '</div>' +
      '<div class="quiz-body">' +
        '<div id="quiz-view">' +
          '<p class="quiz-notice" id="quiz-notice" role="alert"></p>' +
          '<form id="quiz-form"></form>' +
        '</div>' +
        '<div id="quiz-result" class="quiz-result" hidden></div>' +
      '</div>' +
      '<div class="quiz-foot" id="quiz-foot">' +
        '<button type="button" class="btn btn-primary" id="quiz-submit">Submit answers</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(fab);
  document.body.appendChild(overlay);

  var modal = overlay.querySelector(".quiz-modal");
  var form = overlay.querySelector("#quiz-form");
  var notice = overlay.querySelector("#quiz-notice");
  var quizView = overlay.querySelector("#quiz-view");
  var resultView = overlay.querySelector("#quiz-result");
  var foot = overlay.querySelector("#quiz-foot");
  var bodyEl = overlay.querySelector(".quiz-body");
  var closeBtn = overlay.querySelector(".quiz-close");
  var submitBtn = overlay.querySelector("#quiz-submit");
  var lastFocused = null;

  function showView(which) {
    var isQuiz = which === "quiz";
    quizView.hidden = !isQuiz;
    foot.hidden = !isQuiz;
    resultView.hidden = isQuiz;
  }

  function renderQuiz() {
    pickQuestions();
    var html = "";
    current.forEach(function (item, qi) {
      html += '<fieldset class="quiz-q"><legend>' + (qi + 1) + ". " + esc(item.q) + "</legend>" +
              '<div class="quiz-choices">';
      item.choices.forEach(function (choice) {
        html += '<label class="quiz-choice">' +
                  '<input type="radio" name="q' + qi + '" value="' + esc(choice) + '">' +
                  "<span>" + esc(choice) + "</span>" +
                "</label>";
      });
      html += "</div></fieldset>";
    });
    form.innerHTML = html;
    notice.textContent = "";
    showView("quiz");
    bodyEl.scrollTop = 0;
  }

  function grade() {
    var s = 0, answered = 0;
    current.forEach(function (item, qi) {
      var sel = form.querySelector('input[name="q' + qi + '"]:checked');
      if (sel) { answered++; if (sel.value === item.correct) s++; }
    });
    return { score: s, answered: answered };
  }

  function onSubmit() {
    var r = grade();
    if (r.answered < COUNT) {
      notice.textContent = "Please answer all " + COUNT + " questions — " + (COUNT - r.answered) + " to go.";
      for (var qi = 0; qi < COUNT; qi++) {
        if (!form.querySelector('input[name="q' + qi + '"]:checked')) {
          form.children[qi].scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        }
      }
      return;
    }
    showResult(r.score);
  }

  function showResult(s) {
    var passed = s >= PASS;
    resultView.className = "quiz-result " + (passed ? "is-pass" : "is-fail");
    resultView.innerHTML =
      '<div class="quiz-result-emoji" aria-hidden="true">' + (passed ? "🎉" : "🐾") + "</div>" +
      '<h3 class="quiz-result-msg">' + (passed ? "You've passed!" : "You failed. You can try again") + "</h3>" +
      '<p class="quiz-result-score">You scored <strong>' + s + "/" + COUNT + "</strong>.</p>" +
      '<div class="quiz-result-actions">' +
        (passed
          ? '<button type="button" class="btn btn-primary" data-action="retry">Play again</button>' +
            '<button type="button" class="btn btn-ghost" data-action="close">Close</button>'
          : '<button type="button" class="btn btn-primary" data-action="retry">Try again</button>' +
            '<button type="button" class="btn btn-ghost" data-action="close">Close</button>') +
      "</div>";
    showView("result");
    bodyEl.scrollTop = 0;
    var firstAction = resultView.querySelector("button");
    if (firstAction) firstAction.focus();
  }

  function openQuiz() {
    lastFocused = document.activeElement;
    renderQuiz();
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
    document.addEventListener("keydown", onKeydown);
  }

  function closeQuiz() {
    overlay.hidden = true;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function onKeydown(e) {
    if (e.key === "Escape") { closeQuiz(); return; }
    if (e.key !== "Tab") return;
    var nodes = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    var focusable = Array.prototype.filter.call(nodes, function (el) {
      return !el.disabled && el.offsetParent !== null;
    });
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // Highlight the selected choice (robust, no :has() dependency).
  form.addEventListener("change", function (e) {
    if (!e.target || !e.target.name) return;
    var group = form.querySelectorAll('input[name="' + e.target.name + '"]');
    Array.prototype.forEach.call(group, function (inp) {
      var label = inp.closest(".quiz-choice");
      if (label) label.classList.toggle("is-selected", inp.checked);
    });
    notice.textContent = "";
  });

  fab.addEventListener("click", openQuiz);
  closeBtn.addEventListener("click", closeQuiz);
  submitBtn.addEventListener("click", onSubmit);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) closeQuiz(); });
  resultView.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-action]");
    if (!btn) return;
    if (btn.getAttribute("data-action") === "retry") renderQuiz();
    else closeQuiz();
  });
})();
