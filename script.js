(function () {
  document.querySelectorAll('a.page-scroll[href*="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      var href = this.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      var disclosure = target.closest('details');
      if (disclosure) disclosure.open = true;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  var toggle = document.querySelector('.nav-toggle');
  var navLinks = document.getElementById('nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var contactForm = document.querySelector('#contact form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();
      contactForm.reset();
      var success = document.getElementById('success');
      if (success) {
        success.textContent = 'Thank you! We will get back to you soon.';
      }
    });
  }
})();
