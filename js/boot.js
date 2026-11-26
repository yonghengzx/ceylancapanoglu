/* CeYlanCapanoLu — boot.js
   Runs synchronously in <head> so reveal elements never flash before
   the motion system is ready. If this file fails to load, the page
   stays fully visible (progressive enhancement). */
(function () {
  try {
    document.documentElement.setAttribute("data-motion", "on");
  } catch (e) {
    /* no-op */
  }
})();
