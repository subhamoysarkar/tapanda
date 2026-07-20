/*
  Ta Panda Business OS — Password Gate
  -------------------------------------
  Same pattern as admin.html's login overlay: a hardcoded client-side
  password, session-scoped via sessionStorage. Not real security — this is
  a deliberate, explicit choice (functionality over security for this
  internal two-person tool). See admin.js for the sibling implementation.

  Must load before any other Business OS script so the rest of the page
  stays hidden (via the .os-authed body class) until unlocked.
*/
(function () {
  'use strict';
  var PASSWORD = 'tapanda-os-2026';
  var STORAGE_KEY = 'tapanda_os_auth';

  function unlock() {
    document.body.classList.add('os-authed');
    var overlay = document.getElementById('osLoginOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  function showGate() {
    var overlay = document.getElementById('osLoginOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    var input = document.getElementById('osLoginPassword');
    var btn = document.getElementById('osLoginBtn');
    var err = document.getElementById('osLoginError');

    function attempt() {
      if (input.value === PASSWORD) {
        sessionStorage.setItem(STORAGE_KEY, 'true');
        unlock();
      } else {
        err.textContent = 'Incorrect password.';
        input.value = '';
        input.focus();
      }
    }
    btn.addEventListener('click', attempt);
    input.addEventListener('keypress', function (e) { if (e.key === 'Enter') attempt(); });
    input.focus();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
      unlock();
    } else {
      showGate();
    }
  });
})();
