/* TAPHAPPY.dev — interactions
   Implemented from Portfolio.dc.html (Claude Design) */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // same query as the CSS mobile block, so JS and CSS can never disagree
  var narrowQuery = window.matchMedia('(max-width: 859px)');

  function isNarrow() {
    return narrowQuery.matches;
  }

  /* ---- mobile menu ---- */

  var menu = document.getElementById('menu');
  var burger = document.getElementById('burger');
  var menuClose = document.getElementById('menuClose');

  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    menuClose.focus();
  }

  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    burger.focus();
  }

  // pages like the coin partner subdomain have no burger nav
  if (menu && burger && menuClose) {
    burger.addEventListener('click', openMenu);
    menuClose.addEventListener('click', closeMenu);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) closeMenu();
    });
  }

  /* ---- forms (contact + partnership) ----
     Submissions POST to the self-hosted PHP endpoint, which emails
     CONTACT_EMAIL. If the endpoint is unreachable, we fall back to opening
     a pre-filled email in the visitor's mail app. */

  var FORM_ENDPOINT = '/send-mail.php';
  var CONTACT_EMAIL = 'hello@kissmyapps.dev';

  function showStatus(form, ok, text) {
    var status = form.querySelector('.form__status');
    if (!status) return;
    status.textContent = text;
    status.classList.remove('form__status--ok', 'form__status--err');
    status.classList.add(ok ? 'form__status--ok' : 'form__status--err');
  }

  function mailtoFallback(form, kind, data) {
    var subject = (kind === 'partnership' ? 'Partnership enquiry' : 'Contact') +
      (data.app_name || data.company_or_app ? ' — ' + (data.app_name || data.company_or_app) : '');
    var body = Object.keys(data).filter(function (k) {
      return k !== '_form';
    }).map(function (k) {
      return k.replace(/_/g, ' ') + ': ' + data[k];
    }).join('\n');
    window.location.href = 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
    showStatus(form, true, "Your email app should open with everything pre-filled — just hit send. Nothing opened? Email us at " + CONTACT_EMAIL + ".");
  }

  Array.prototype.forEach.call(document.querySelectorAll('form[data-form]'), function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (form.querySelector('[name="_gotcha"]').value) return; // bot

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var kind = form.getAttribute('data-form');
      var data = { _form: kind };
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name && el.name !== '_gotcha') data[el.name] = el.value;
      });

      var submitBtn = form.querySelector('.form__submit');

      if (!FORM_ENDPOINT) {
        mailtoFallback(form, kind, data);
        return;
      }

      submitBtn.disabled = true;
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        showStatus(form, true, "Got it — thanks! We'll reply within two business days.");
      }).catch(function () {
        // endpoint unreachable (e.g. static-only host) — open the mail app instead
        mailtoFallback(form, kind, data);
      }).finally(function () {
        submitBtn.disabled = false;
      });
    });
  });

  /* ---- smooth in-page navigation ---- */

  function goTo(id) {
    closeMenu();
    var el = document.getElementById(id);
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-goto]'), function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      goTo(link.getAttribute('data-goto'));
    });
  });

  /* ---- scroll reveals ---- */

  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var vh = window.innerHeight;

    revealEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top > vh * 0.88) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
      }
      el.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
      el.style.transitionDelay = (el.dataset.delay || '0') + 'ms';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'none';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealEls.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---- pinned horizontal work gallery ---- */

  var wrap = document.getElementById('gwrap');
  var track = document.getElementById('gtrack');
  var scroller = document.getElementById('gscroll');
  var maxShift = 0;

  function layoutGallery() {
    if (!wrap || !track) return;
    if (isNarrow()) {
      wrap.style.height = '';
      track.style.transform = '';
      maxShift = 0;
    } else {
      // native swipe on narrow viewports leaves a scrollLeft behind; the
      // pinned mode translates the track instead, so the offsets would stack
      if (scroller) scroller.scrollLeft = 0;
      maxShift = Math.max(0, track.scrollWidth - window.innerWidth + 48);
      wrap.style.height = (window.innerHeight + maxShift) + 'px';
      updateGallery();
    }
  }

  function updateGallery() {
    if (isNarrow() || !wrap || !track || !maxShift) return;
    var rect = wrap.getBoundingClientRect();
    var range = wrap.offsetHeight - window.innerHeight;
    if (range <= 0) return;
    var progress = Math.min(1, Math.max(0, -rect.top / range));
    track.style.transform = 'translateX(' + (-progress * maxShift) + 'px)';
  }

  function onViewportChange() {
    if (!isNarrow()) closeMenu();
    layoutGallery();
  }

  window.addEventListener('scroll', updateGallery, { passive: true });
  window.addEventListener('resize', onViewportChange);
  // resize can be throttled or skipped under some embedded/emulated viewports;
  // the media-query change event always fires on a breakpoint crossing
  if (narrowQuery.addEventListener) {
    narrowQuery.addEventListener('change', onViewportChange);
  }

  layoutGallery();

  // re-measure once webfonts and layout settle
  window.addEventListener('load', function () {
    layoutGallery();
    // the gallery wrap grows ~2500px after layout, so a #fragment the browser
    // scrolled to before this script ran is no longer where the user landed
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) {
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
      }
    }
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(layoutGallery);
  }
  setTimeout(layoutGallery, 600);
})();
