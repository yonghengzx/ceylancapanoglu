/* =============================================================
   CeYlanCapanoLu — main.js
   Navigation, scroll reveal, counters, tabs, accordion, forms,
   footer year, back-to-top and marquee control.
   Vanilla ES2017+. No dependencies. Every module fails soft.
   ============================================================= */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  var prefersReduced = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false, addEventListener: function () {} };
  var finePointer = window.matchMedia
    ? window.matchMedia('(hover: hover) and (pointer: fine)')
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

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function scrollY() {
    return window.pageYOffset || root.scrollTop || 0;
  }

  /* ---------------------------------------------------------
     1. Sticky header state + back-to-top visibility
     --------------------------------------------------------- */
  function initHeader() {
    var header = $('.site-header');
    var toTop = $('.back-to-top');
    var ticking = false;

    function update() {
      var y = scrollY();
      if (header) header.classList.toggle('is-stuck', y > 12);
      if (toTop) toTop.classList.toggle('is-visible', y > 620);
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
     2. Mobile navigation — toggle, focus trap, escape
     --------------------------------------------------------- */
  function initNav() {
    var toggle = $('.nav-toggle');
    var drawer = $('#mobile-drawer');
    if (!toggle || !drawer) return;

    var focusables =
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      doc.body.classList.toggle('is-locked', open);
      if (open) {
        var first = drawer.querySelector(focusables);
        if (first && typeof first.focus === 'function') first.focus();
      }
    }

    on(toggle, 'click', function () {
      setOpen(!isOpen());
    });

    $$('.mobile-drawer__link, .mobile-drawer__actions a', drawer).forEach(function (link) {
      on(link, 'click', function () {
        setOpen(false);
      });
    });

    on(doc, 'keydown', function (event) {
      if (!isOpen()) return;

      if (event.key === 'Escape') {
        setOpen(false);
        toggle.focus();
        return;
      }

      if (event.key !== 'Tab') return;

      var items = $$(focusables, drawer).filter(function (el) {
        return el.offsetParent !== null;
      });
      if (!items.length) return;

      var first = items[0];
      var last = items[items.length - 1];

      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!drawer.contains(doc.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    });

    on(window, 'resize', function () {
      if (window.innerWidth > 1024 && isOpen()) setOpen(false);
    });
  }

  /* ---------------------------------------------------------
     3. Scroll reveal — .reveal -> .is-visible
     --------------------------------------------------------- */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;

    function revealAll() {
      items.forEach(function (item) {
        item.classList.add('is-visible');
      });
    }

    if (!('IntersectionObserver' in window) || prefersReduced.matches) {
      revealAll();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px 6% 0px' }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });

    /* Safety net: never leave copy hidden if an observer misbehaves. */
    on(window, 'load', function () {
      window.setTimeout(function () {
        items.forEach(function (item) {
          var rect = item.getBoundingClientRect();
          if (rect.top < window.innerHeight * 1.5) item.classList.add('is-visible');
        });
      }, 1200);
    });
  }

  /* ---------------------------------------------------------
     4. Animated counters
     --------------------------------------------------------- */
  function initCounters() {
    var counters = $$('.count-up');
    if (!counters.length) return;

    function format(el, value) {
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      return (
        prefix +
        value.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }) +
        suffix
      );
    }

    function animate(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;

      if (prefersReduced.matches) {
        el.textContent = format(el, target);
        return;
      }

      var duration = parseInt(el.getAttribute('data-duration') || '1500', 10);
      var start = null;

      el.classList.add('is-counting');

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = clamp((timestamp - start) / duration, 0, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = format(el, target * eased);
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.textContent = format(el, target);
          el.classList.remove('is-counting');
        }
      }

      el.textContent = format(el, 0);
      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animate);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach(function (counter) {
      observer.observe(counter);
    });
  }

  /* ---------------------------------------------------------
     5. Tabs
     --------------------------------------------------------- */
  function initTabs() {
    var groups = $$('.tabs');
    if (!groups.length) return;

    groups.forEach(function (group) {
      var tabs = $$('[role="tab"]', group);
      var panels = $$('[role="tabpanel"]', group);
      if (!tabs.length) return;

      function select(index, focus) {
        tabs.forEach(function (tab, i) {
          var active = i === index;
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
          tab.setAttribute('tabindex', active ? '0' : '-1');
        });
        panels.forEach(function (panel, i) {
          var active = i === index;
          panel.classList.toggle('is-active', active);
          if (active) {
            panel.removeAttribute('hidden');
          } else {
            panel.setAttribute('hidden', 'hidden');
          }
        });
        if (focus && typeof tabs[index].focus === 'function') tabs[index].focus();
      }

      tabs.forEach(function (tab, index) {
        on(tab, 'click', function () {
          select(index, false);
        });
        on(tab, 'keydown', function (event) {
          var next = null;
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
          if (next === null) return;
          event.preventDefault();
          select(next, true);
        });
      });

      var active = tabs.findIndex(function (tab) {
        return tab.getAttribute('aria-selected') === 'true';
      });
      select(active < 0 ? 0 : active, false);
    });
  }

  /* ---------------------------------------------------------
     6. Accordion
     --------------------------------------------------------- */
  function initAccordion() {
    var items = $$('.accordion__item');
    if (!items.length) return;

    items.forEach(function (item) {
      var trigger = $('.accordion__trigger', item);
      var panel = $('.accordion__panel', item);
      if (!trigger || !panel) return;

      function setOpen(open) {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        item.classList.toggle('is-open', open);
        /* The panel collapses through grid-template-rows, so it must stay
           in the flow — aria-hidden keeps it out of the a11y tree. */
        panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      }

      setOpen(trigger.getAttribute('aria-expanded') === 'true');

      on(trigger, 'click', function () {
        var open = trigger.getAttribute('aria-expanded') === 'true';
        setOpen(!open);
      });
    });
  }

  /* ---------------------------------------------------------
     7. Contact form — validation, success state
     --------------------------------------------------------- */
  function initForm() {
    var form = $('#enquiry-form');
    if (!form) return;

    var STUDIO_EMAIL = 'ceylancapanoglu215516@gmail.com';
    var status = $('#form-status');
    var statusText = $('#form-status-text');

    function fieldOf(input) {
      return input.closest ? input.closest('.field') : null;
    }

    function setError(input, message) {
      var field = fieldOf(input);
      if (!field) return;
      var error = $('.field__error span', field);
      field.classList.toggle('is-invalid', Boolean(message));
      field.classList.toggle('is-valid', !message && Boolean(input.value));
      if (error && message) error.textContent = message;
      if (message) {
        input.setAttribute('aria-invalid', 'true');
      } else {
        input.removeAttribute('aria-invalid');
      }
    }

    function validate(input) {
      var value = (input.value || '').trim();
      var required = input.hasAttribute('required');

      if (input.type === 'checkbox') {
        if (required && !input.checked) {
          setError(input, 'Please accept the privacy notice so we can reply.');
          return false;
        }
        setError(input, '');
        return true;
      }

      if (required && !value) {
        setError(input, 'This field is required.');
        return false;
      }

      if (input.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        setError(input, 'Please enter an email address we can reply to.');
        return false;
      }

      if (input.id === 'cf-message' && value && value.length < 20) {
        setError(input, 'Please give us at least a couple of sentences.');
        return false;
      }

      setError(input, '');
      return true;
    }

    var fields = $$('input, select, textarea', form);

    fields.forEach(function (input) {
      on(input, 'blur', function () {
        validate(input);
      });
      on(input, 'input', function () {
        var field = fieldOf(input);
        if (field && field.classList.contains('is-invalid')) validate(input);
      });
      on(input, 'change', function () {
        validate(input);
      });
    });

    function showStatus(message, isError) {
      if (!status || !statusText) return;
      statusText.textContent = message;
      status.classList.add('is-visible');
      status.classList.toggle('is-error', Boolean(isError));
    }

    on(form, 'submit', function (event) {
      event.preventDefault();

      var valid = true;
      var firstInvalid = null;

      fields.forEach(function (input) {
        if (!validate(input)) {
          valid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      });

      if (!valid) {
        showStatus('Please correct the highlighted fields and try again.', true);
        if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
        return;
      }

      var data = new FormData(form);
      var lines = [
        'Name: ' + (data.get('name') || ''),
        'Email: ' + (data.get('email') || ''),
        'Company: ' + (data.get('company') || '—'),
        'Service: ' + (data.get('service') || '—'),
        'Budget: ' + (data.get('budget') || '—'),
        'Timeline: ' + (data.get('timeline') || '—'),
        '',
        'Message:',
        String(data.get('message') || '')
      ];

      var subject = 'Project enquiry — ' + (data.get('service') || 'Studio enquiry');
      var mailto =
        'mailto:' +
        STUDIO_EMAIL +
        '?subject=' +
        encodeURIComponent(subject) +
        '&body=' +
        encodeURIComponent(lines.join('\n'));

      var link = doc.createElement('a');
      link.href = mailto;
      link.className = 'link-arrow';
      link.textContent = 'Open your email app with this message';

      if (statusText) {
        statusText.textContent =
          'Your enquiry is ready. We have composed it as an email to ' +
          STUDIO_EMAIL +
          ' — press the button below to open it in your email client and send. We reply to project enquiries within one working day.';
        statusText.appendChild(link);
      }

      if (status) {
        status.classList.add('is-visible');
        status.classList.remove('is-error');
      }

      form.reset();
      fields.forEach(function (input) {
        var field = fieldOf(input);
        if (field) field.classList.remove('is-valid', 'is-invalid');
      });
    });
  }

  /* ---------------------------------------------------------
     8. Footer year
     --------------------------------------------------------- */
  function initYear() {
    var year = String(new Date().getFullYear());
    $$('[data-year]').forEach(function (el) {
      el.textContent = year;
    });
  }

  /* ---------------------------------------------------------
     9. Back to top
     --------------------------------------------------------- */
  function initBackToTop() {
    var button = $('.back-to-top');
    if (!button) return;
    on(button, 'click', function () {
      window.scrollTo({ top: 0, behavior: prefersReduced.matches ? 'auto' : 'smooth' });
    });
  }

  /* ---------------------------------------------------------
     10. Marquee — duplicate items for a seamless loop and
         pause the track when the pointer is over it
     --------------------------------------------------------- */
  function initMarquee() {
    $$('[data-marquee]').forEach(function (track) {
      if (track.getAttribute('data-cloned') === 'true') return;
      var children = Array.prototype.slice.call(track.children);
      if (!children.length) return;

      children.forEach(function (child) {
        var clone = child.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });

      track.setAttribute('data-cloned', 'true');
    });

    $$('.marquee').forEach(function (marquee) {
      var track = $('.marquee__track', marquee);
      if (!track) return;
      on(marquee, 'pointerenter', function () {
        track.style.animationPlayState = 'paused';
      });
      on(marquee, 'pointerleave', function () {
        track.style.animationPlayState = 'running';
      });
    });
  }

  /* ---------------------------------------------------------
     11. Toast helper (used by the form and legal pages)
     --------------------------------------------------------- */
  window.CCLToast = function (message, isError) {
    var region = $('.toast-region');
    if (!region) return;
    var toast = doc.createElement('div');
    toast.className = 'toast' + (isError ? ' toast--error' : '');
    toast.setAttribute('role', 'status');
    var text = doc.createElement('span');
    text.textContent = message;
    toast.appendChild(text);
    region.appendChild(toast);
    window.setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 6000);
  };

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  function boot() {
    root.setAttribute('data-motion-ready', 'true');
    initHeader();
    initNav();
    initReveal();
    initCounters();
    initTabs();
    initAccordion();
    initForm();
    initYear();
    initBackToTop();
    initMarquee();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
