/* =============================================================
   CeYlanCapanoLu — animations.js
   Parallax layers, hero Ken-Burns and light-streak control,
   canvas particle field, magnetic buttons, 3D card tilt,
   scroll progress bar and intersection-driven section highlights.
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

  /* ---------------------------------------------------------
     1. Parallax layers — --py / --ps custom properties
     --------------------------------------------------------- */
  function initParallax() {
    var layers = $$('[data-parallax]');
    if (!layers.length || prefersReduced.matches) return;

    var ticking = false;

    function update() {
      var vh = window.innerHeight;

      layers.forEach(function (layer) {
        var rect = layer.getBoundingClientRect();
        if (rect.bottom < -240 || rect.top > vh + 240) return;

        var speed = parseFloat(layer.getAttribute('data-parallax-speed') || '0.12');
        var center = rect.top + rect.height / 2;
        var offset = (vh / 2 - center) * speed;

        if (layer.getAttribute('data-parallax') === 'scale') {
          var scale = parseFloat(layer.getAttribute('data-parallax-scale') || '1.05');
          layer.style.setProperty('--ps', scale.toFixed(3));
        }
        layer.style.setProperty('--py', offset.toFixed(2) + 'px');
      });

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
     2. Hero Ken-Burns + light streak control
        The hero image zoom and the diagonal streaks only burn
        CPU while they are actually on screen.
     --------------------------------------------------------- */
  function initHeroMotion() {
    var hero = $('.hero');
    if (!hero) return;

    var image = $('.hero__media img', hero);
    var streaks = $$('.light-streak', hero);

    function setPlaying(playing) {
      if (image) image.style.animationPlayState = playing ? 'running' : 'paused';
      streaks.forEach(function (streak) {
        streak.style.display = playing ? '' : 'none';
      });
    }

    if (prefersReduced.matches) {
      setPlaying(false);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setPlaying(true);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          setPlaying(entry.isIntersecting);
        });
      },
      { threshold: 0.01 }
    );

    observer.observe(hero);
  }

  /* ---------------------------------------------------------
     3. Canvas particle field
     --------------------------------------------------------- */
  function initParticles() {
    var canvas = $('canvas[data-particles]');
    if (!canvas || !canvas.getContext) return;

    var context = canvas.getContext('2d');
    if (!context) return;

    var MAX_PARTICLES = 90;
    var particles = [];
    var width = 0;
    var height = 0;
    var running = false;
    var frame = null;

    function resize() {
      var parent = canvas.parentNode;
      if (!parent) return;
      var rect = parent.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = width;
      canvas.height = height;
      canvas.style.position = 'absolute';
      canvas.style.left = '0';
      canvas.style.top = '0';
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '-1';
      build();
    }

    function build() {
      var wanted = Math.min(
        MAX_PARTICLES,
        parseInt(canvas.getAttribute('data-particles') || String(MAX_PARTICLES), 10)
      );
      if (window.innerWidth < 700) wanted = Math.min(wanted, 36);

      particles = [];
      for (var i = 0; i < wanted; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.6 + Math.random() * 1.8,
          vx: (Math.random() - 0.5) * 0.22,
          vy: -0.12 - Math.random() * 0.26,
          a: 0.18 + Math.random() * 0.42
        });
      }
    }

    function paint() {
      context.clearRect(0, 0, width, height);

      /* A very soft wash keeps the field readable over any artwork. */
      var wash = context.createRadialGradient(
        width * 0.18,
        height * 0.12,
        0,
        width * 0.18,
        height * 0.12,
        Math.max(width, height) * 0.8
      );
      wash.addColorStop(0, 'rgba(56, 189, 248, 0.10)');
      wash.addColorStop(1, 'rgba(56, 189, 248, 0)');
      context.fillStyle = wash;
      context.fillRect(0, 0, width, height);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        context.beginPath();
        context.fillStyle = 'rgba(125, 216, 252, ' + p.a.toFixed(3) + ')';
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fill();
      }
    }

    function step() {
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -6) {
          p.y = height + 6;
          p.x = Math.random() * width;
        }
        if (p.x < -6) p.x = width + 6;
        if (p.x > width + 6) p.x = -6;
      }
      paint();
      frame = window.requestAnimationFrame(step);
    }

    function start() {
      if (running) return;
      running = true;
      frame = window.requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
    }

    /* Respect the motion preference: a single static frame, no loop. */
    if (prefersReduced.matches) {
      resize();
      paint();
      return;
    }

    resize();
    paint();
    start();

    on(window, 'resize', function () {
      resize();
      if (running) paint();
    });

    on(doc, 'visibilitychange', function () {
      if (doc.hidden) {
        stop();
      } else {
        start();
      }
    });

    on(window, 'pagehide', stop);
  }

  /* ---------------------------------------------------------
     4. Magnetic buttons
     --------------------------------------------------------- */
  function initMagnetics() {
    var items = $$('[data-magnetic]');
    if (!items.length || prefersReduced.matches) return;

    items.forEach(function (el) {
      var strength = parseFloat(el.getAttribute('data-magnetic') || '0.28');

      on(el, 'pointermove', function (event) {
        if (!finePointer.matches) return;
        var rect = el.getBoundingClientRect();
        var relX = event.clientX - (rect.left + rect.width / 2);
        var relY = event.clientY - (rect.top + rect.height / 2);
        el.classList.add('is-magnetised');
        el.style.setProperty('--mx-move', (relX * strength).toFixed(2) + 'px');
        el.style.setProperty('--my-move', (relY * strength).toFixed(2) + 'px');
      });

      on(el, 'pointerleave', function () {
        el.classList.remove('is-magnetised');
        el.style.setProperty('--mx-move', '0px');
        el.style.setProperty('--my-move', '0px');
      });
    });
  }

  /* ---------------------------------------------------------
     5. 3D card tilt
     --------------------------------------------------------- */
  function initTilt() {
    var cards = $$('[data-tilt]');
    if (!cards.length || prefersReduced.matches) return;

    cards.forEach(function (card) {
      var max = parseFloat(card.getAttribute('data-tilt') || '6');

      on(card, 'pointermove', function (event) {
        if (!finePointer.matches) return;
        var rect = card.getBoundingClientRect();
        var px = (event.clientX - rect.left) / rect.width - 0.5;
        var py = (event.clientY - rect.top) / rect.height - 0.5;
        card.classList.add('is-tilting');
        card.style.setProperty('--tilt-x', (-py * max).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', (px * max).toFixed(2) + 'deg');
      });

      on(card, 'pointerleave', function () {
        card.classList.remove('is-tilting');
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  /* ---------------------------------------------------------
     6. Scroll progress bar
     --------------------------------------------------------- */
  function initScrollProgress() {
    var bar = $('.scroll-progress');
    if (!bar) return;

    var ticking = false;

    function update() {
      var y = window.pageYOffset || root.scrollTop || 0;
      var total = Math.max(1, (root.scrollHeight || doc.body.scrollHeight) - window.innerHeight);
      var ratio = clamp(y / total, 0, 1);
      bar.style.setProperty('--scroll-progress', ratio.toFixed(4));
      bar.style.setProperty('--progress', ratio.toFixed(4));
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
     7. Intersection-driven section highlights
        Streak bands are only rendered while their section is on
        screen; visible sections are marked for the CSS layer.
     --------------------------------------------------------- */
  function initSectionHighlights() {
    var sections = $$('.section');
    var streaks = $$('.light-streak--band');
    if (!sections.length && !streaks.length) return;

    if (!('IntersectionObserver' in window)) return;

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle('is-visible', entry.isIntersecting);
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -5% 0px' }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });

    if (streaks.length) {
      var streakObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            entry.target.style.display = entry.isIntersecting ? '' : 'none';
          });
        },
        { threshold: 0, rootMargin: '120px 0px' }
      );

      streaks.forEach(function (streak) {
        streakObserver.observe(streak);
      });
    }
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  function boot() {
    initParallax();
    initHeroMotion();
    initParticles();
    initMagnetics();
    initTilt();
    initScrollProgress();
    initSectionHighlights();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
