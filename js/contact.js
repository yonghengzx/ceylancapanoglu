/* =============================================================
   CeYlanCapanoLu — contact.js
   Client-side validation for the contact form.
   The form hands the message to the visitor's mail client, because
   this site is served as static files with no backend endpoint.
   ============================================================= */
(function () {
  "use strict";

  var form = document.getElementById("contact-form");
  if (!form) return;

  var STUDIO_EMAIL = "ceylancapanoglu215516@gmail.com";
  var statusBox = document.getElementById("form-status");

  function fieldOf(input) {
    return input.closest(".field") || input.parentNode;
  }

  function setError(input, message) {
    var field = fieldOf(input);
    var error = field ? field.querySelector(".field__error") : null;
    if (field) field.classList.toggle("has-error", Boolean(message));
    if (error) error.textContent = message || "";
    if (message) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }
  }

  function validateField(input) {
    var value = (input.value || "").trim();
    var type = input.getAttribute("type");
    var required = input.hasAttribute("required");

    if (required && !value) {
      setError(input, "This field is required.");
      return false;
    }

    if (type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError(input, "Please enter a valid email address.");
      return false;
    }

    if (input.id === "message" && value && value.length < 20) {
      setError(input, "Please give us at least a couple of sentences (20 characters).");
      return false;
    }

    setError(input, "");
    return true;
  }

  var fields = Array.prototype.slice.call(form.querySelectorAll("input, textarea, select"));

  fields.forEach(function (input) {
    input.addEventListener("blur", function () {
      validateField(input);
    });
    input.addEventListener("input", function () {
      var field = fieldOf(input);
      if (field && field.classList.contains("has-error")) validateField(input);
    });
  });

  function showStatus(message) {
    if (!statusBox) return;
    statusBox.textContent = message;
    statusBox.classList.add("is-visible");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var valid = true;
    var firstInvalid = null;

    fields.forEach(function (input) {
      if (!validateField(input)) {
        valid = false;
        if (!firstInvalid) firstInvalid = input;
      }
    });

    var consent = form.querySelector('input[name="consent"]');
    if (consent && !consent.checked) {
      valid = false;
      if (!firstInvalid) firstInvalid = consent;
    }

    if (!valid) {
      showStatus("Please correct the highlighted fields before sending.");
      if (firstInvalid && typeof firstInvalid.focus === "function") firstInvalid.focus();
      return;
    }

    var data = new FormData(form);
    var lines = [
      "Name: " + (data.get("name") || ""),
      "Email: " + (data.get("email") || ""),
      "Organisation: " + (data.get("company") || "—"),
      "Project type: " + (data.get("project") || "—"),
      "Budget range: " + (data.get("budget") || "—"),
      "Timeline: " + (data.get("timeline") || "—"),
      "",
      "Message:",
      String(data.get("message") || "")
    ];

    var subject = "Project enquiry — " + (data.get("project") || "Studio enquiry");
    var mailto =
      "mailto:" +
      STUDIO_EMAIL +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(lines.join("\n"));

    showStatus(
      "Your mail client should now open with the message prepared for " +
        STUDIO_EMAIL +
        ". If nothing happened, please write to that address directly."
    );

    window.location.href = mailto;
  });
})();
