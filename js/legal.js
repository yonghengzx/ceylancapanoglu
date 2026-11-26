/* =============================================================
   CeYlanCapanoLu — legal.js
   Table-of-contents scroll spy, smooth anchor scrolling, print
   helper, clause expand/collapse and the mobile TOC toggle.
   The document is complete in the HTML — JavaScript only adds
   reading comfort.
   ============================================================= */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  var prefersReduced = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false, addEventListener: function () {} };

  function $(selector, scope) {
    return (scope || doc).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || doc).querySelectorAll(selector));
  }

  function on(el, type, handler, opts) {
    if (el) el.addEventListener(type, handler, opts);
  }

  function headerOffset() {
    var header = $('.site-header');
    var height = header ? header.getBoundingClientRect().height : 74;
    return height + 24;
  }

  /* ---------------------------------------------------------
     1. Smooth anchor scrolling for every in-page link
     --------------------------------------------------------- */
  function initAnchors() {
    var links = $$('a[href^="#"]');
    if (!links.length) return;

    links.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;

      on(link, 'click', function (event) {
        var id = href.slice(1);
        var target = doc.getElementById(id);
        if (!target) return;

        event.preventDefault();

        var top = target.getBoundingClientRect().top + (window.pageYOffset || root.scrollTop) - headerOffset();
        window.scrollTo({
          top: Math.max(0, top),
          behavior: prefersReduced.matches ? 'auto' : 'smooth'
        });

        if (history.replaceState) history.replaceState(null, '', '#' + id);
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  /* ---------------------------------------------------------
     2. Table-of-contents scroll spy
     --------------------------------------------------------- */
  function initScrollSpy() {
    var toc = $('.legal-toc');
    if (!toc) return;

    var links = $$('.legal-toc__link', toc);
    if (!links.length) return;

    var map = {};
    var sections = [];

    links.forEach(function (link) {
      var id = (link.getAttribute('href') || '').slice(1);
      var section = doc.getElementById(id);
      if (!section) return;
      map[id] = link;
      sections.push(section);
    });

    if (!sections.length) return;

    var current = null;
    var ticking = false;

    function setActive(id) {
      if (id === current) return;
      current = id;
      links.forEach(function (link) {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      });
      if (map[id]) {
        map[id].classList.add('is-active');
        map[id].setAttribute('aria-current', 'true');
      }
    }

    function update() {
      var offset = headerOffset() + 8;
      var found = sections[0].id;

      for (var i = 0; i < sections.length; i++) {
        var rect = sections[i].getBoundingClientRect();
        if (rect.top - offset <= 0) {
          found = sections[i].id;
        } else {
          break;
        }
      }

      /* At the very bottom of the document, always light up the last clause. */
      var atBottom =
        (window.pageYOffset || root.scrollTop) + window.innerHeight >=
        (root.scrollHeight || doc.body.scrollHeight) - 4;
      if (atBottom) found = sections[sections.length - 1].id;

      setActive(found);
      ticking = false;
    }

    function request() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    on(window, 'scroll', request, { passive: true });
    on(window, 'resize', request);
    update();
  }

  /* ---------------------------------------------------------
     3. Print button
     --------------------------------------------------------- */
  function initPrint() {
    var button = $('[data-print-document]');
    if (!button) return;
    on(button, 'click', function () {
      window.print();
    });
  }

  /* ---------------------------------------------------------
     4. Expand / collapse for long clauses
     --------------------------------------------------------- */
  function initClauseToggle() {
    var clauses = $$('.legal-clause');
    if (!clauses.length) return;

    clauses.forEach(function (clause) {
      var bodies = $$('.legal-clause__body', clause);
      if (!bodies.length) return;

      var size = (clause.textContent || '').replace(/\s+/g, ' ').trim().length;
      if (size < 1500) return;

      var button = doc.createElement('button');
      button.type = 'button';
      button.className = 'btn btn--ghost btn--sm';
      button.setAttribute('aria-expanded', 'true');
      button.textContent = 'Collapse this clause';

      on(button, 'click', function () {
        var expanded = button.getAttribute('aria-expanded') === 'true';
        bodies.forEach(function (body) {
          body.style.display = expanded ? 'none' : '';
        });
        button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        button.textContent = expanded ? 'Expand this clause' : 'Collapse this clause';
      });

      clause.appendChild(button);
    });
  }

  /* ---------------------------------------------------------
     5. Table of contents collapse on small screens
     --------------------------------------------------------- */
  function initTocToggle() {
    var toggle = $('[data-toc-toggle]');
    var list = $('#legal-toc-list');
    if (!toggle || !list) return;

    function setOpen(open) {
      list.style.display = open ? '' : 'none';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Collapse contents' : 'Show contents';
    }

    function sync() {
      setOpen(window.innerWidth > 1024);
    }

    on(toggle, 'click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    on(window, 'resize', sync);
    sync();
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  function boot() {
    initAnchors();
    initScrollSpy();
    initPrint();
    initClauseToggle();
    initTocToggle();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
