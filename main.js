(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
   * Release entrance animations after they finish so that hover
   * transitions (e.g. CTA lift) are not blocked by the `forwards` fill.
   * ------------------------------------------------------------------ */
  document.querySelectorAll('.anim').forEach(function (el) {
    el.addEventListener('animationend', function () {
      el.classList.add('anim-done');
    });
  });

  /* ------------------------------------------------------------------
   * Count-up stats.
   * easeOutCubic, duration 1500 + i*80ms, start offset 480 + i*90ms,
   * run once via IntersectionObserver (threshold 0.25).
   * ------------------------------------------------------------------ */
  var counters = Array.prototype.slice.call(
    document.querySelectorAll('.stat-value')
  );

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function render(el, value) {
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    el.textContent = value.toFixed(decimals) + suffix;
  }

  function setFinal(el) {
    render(el, parseFloat(el.getAttribute('data-target')));
  }

  function animateCount(el, i) {
    if (reduceMotion) {
      setFinal(el);
      return;
    }
    var target = parseFloat(el.getAttribute('data-target'));
    var duration = 1500 + i * 80;
    var start = null;

    function tick(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      render(el, target * easeOutCubic(p));
      if (p < 1) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }

  var statsEl = document.querySelector('.stats');

  if (statsEl && counters.length) {
    if (reduceMotion) {
      counters.forEach(setFinal);
    } else if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              observer.unobserve(entry.target);
              counters.forEach(function (el, i) {
                setTimeout(function () {
                  animateCount(el, i);
                }, 480 + i * 90);
              });
            }
          });
        },
        { threshold: 0.25 }
      );
      io.observe(statsEl);
    } else {
      counters.forEach(function (el, i) {
        setTimeout(function () {
          animateCount(el, i);
        }, 480 + i * 90);
      });
    }
  }

  /* ------------------------------------------------------------------
   * Mobile menu.
   * ------------------------------------------------------------------ */
  var burger = document.querySelector('.burger');
  var overlay = document.querySelector('.menu-overlay');
  var sheet = document.querySelector('.menu-sheet');

  function openMenu() {
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    overlay.hidden = false;
    sheet.hidden = false;
    document.body.classList.add('menu-open');
  }

  function closeMenu() {
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    overlay.hidden = true;
    sheet.hidden = true;
    document.body.classList.remove('menu-open');
  }

  burger.addEventListener('click', function () {
    if (burger.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay.addEventListener('click', closeMenu);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeMenu();
    }
  });

  sheet.querySelectorAll('.menu-link').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 720) {
      closeMenu();
    }
  });

  /* ------------------------------------------------------------------
   * Contact: copy-to-clipboard (with legacy fallback for non-HTTPS).
   * ------------------------------------------------------------------ */
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (e) {}
    document.body.removeChild(ta);
  }

  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy') || '';
      if (!text) return;

      function showCopied() {
        if (!btn.dataset.original) {
          btn.dataset.original = btn.textContent;
        }
        btn.textContent = 'Copied';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = btn.dataset.original;
          btn.classList.remove('copied');
        }, 1400);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showCopied, function () {
          legacyCopy(text);
          showCopied();
        });
      } else {
        legacyCopy(text);
        showCopied();
      }
    });
  });
})();
