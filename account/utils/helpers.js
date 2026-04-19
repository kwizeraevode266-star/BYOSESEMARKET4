// ===============================
// 🔥 HELPERS UTILS
// ===============================

// ===============================
// 📌 SELECT ELEMENT
// ===============================
function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return document.querySelectorAll(selector);
}

// ===============================
// 📌 CREATE ELEMENT
// ===============================
function createElement(tag, className = "", content = "") {
  const el = document.createElement(tag);

  if (className) el.className = className;
  if (content) el.innerHTML = content;

  return el;
}

// ===============================
// 📌 ADD CLASS
// ===============================
function addClass(el, className) {
  if (el) el.classList.add(className);
}

// ===============================
// 📌 REMOVE CLASS
// ===============================
function removeClass(el, className) {
  if (el) el.classList.remove(className);
}

// ===============================
// 📌 TOGGLE CLASS
// ===============================
function toggleClass(el, className) {
  if (el) el.classList.toggle(className);
}

// ===============================
// 📌 SHOW / HIDE
// ===============================
function show(el) {
  if (el) el.style.display = "block";
}

function hide(el) {
  if (el) el.style.display = "none";
}

// ===============================
// 📌 TOGGLE DISPLAY
// ===============================
function toggle(el) {
  if (!el) return;

  el.style.display =
    el.style.display === "none" ? "block" : "none";
}

// ===============================
// 📌 VALIDATE EMAIL
// ===============================
function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

// ===============================
// 📌 VALIDATE PHONE
// ===============================
function isValidPhone(phone) {
  return /^[0-9]{9,15}$/.test(phone);
}

// ===============================
// 📌 SCROLL TO TOP
// ===============================
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// ===============================
// 📌 LOADING BUTTON
// ===============================
function setLoading(button, text = "Loading...") {
  if (!button) return;

  button.dataset.originalText = button.innerHTML;
  button.innerHTML = text;
  button.disabled = true;
}

function resetLoading(button) {
  if (!button) return;

  button.innerHTML = button.dataset.originalText;
  button.disabled = false;
}

// ===============================
// 📌 ALERT (CUSTOM)
// ===============================
function showAlert(message) {
  alert(message);
}