/*
 * Tournament signup (QR landing page) - November 2026.
 * Used by sections/tournament-signup.liquid. Vanilla JS, no dependencies.
 *
 * Data contract (see HANDOFF.md):
 *  - Parent/Guardian/Coach -> Klaviyo client SUBSCRIPTIONS endpoint, email
 *    marketing SUBSCRIBED, added to the configured list. Shows the promo code.
 *  - Athlete 13+ WITH email -> Klaviyo client PROFILES endpoint only (no list,
 *    no consent). Only teen_* properties are sent, so a teen entering a
 *    parent's email changes nothing parent-facing.
 *  - Athlete 13+ WITHOUT email -> nothing is sent.
 *  - Athlete under 13 -> nothing is sent; the athlete path is locked on this
 *    device via localStorage. The parent path stays available.
 */
(function () {
  'use strict';

  var U13_KEY = 'futr_tourney_u13';
  var SUBMIT_DELAY_MS = 2000;
  var REQUEST_TIMEOUT_MS = 15000;

  /* ---------- pure helpers (exported for tests) ---------- */

  // Month precision only. If the birthday month is this month and they turn 13
  // this year, we can't confirm the day, so treat them as under 13.
  function isUnder13(month, year, now) {
    now = now || new Date();
    var currentYear = now.getFullYear();
    var currentMonth = now.getMonth() + 1;
    var age = currentYear - year - (month > currentMonth ? 1 : 0);
    if (age < 13) return true;
    if (month === currentMonth && year === currentYear - 13) return true;
    return false;
  }

  function pad2(n) {
    n = String(n);
    return n.length < 2 ? '0' + n : n;
  }

  function buildParentPayload(cfg, v) {
    return {
      data: {
        type: 'subscription',
        attributes: {
          custom_source: cfg.customSource,
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: v.email,
                first_name: v.firstName,
                last_name: v.lastName,
                properties: {
                  signup_source: cfg.signupSource,
                  signup_role: 'parent',
                  athlete_birth_month: v.birthMonth,
                  athlete_birth_year: v.birthYear,
                  sports_played: v.sports
                },
                subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } }
              }
            }
          }
        },
        relationships: { list: { data: { type: 'list', id: cfg.listId } } }
      }
    };
  }

  // Teens: profile only. No list, no subscriptions, and no standard name
  // fields or parent-style property names that could overwrite a parent's data.
  function buildTeenPayload(cfg, v) {
    return {
      data: {
        type: 'profile',
        attributes: {
          email: v.email,
          // Only teen_* keys: if the email belongs to a parent, nothing
          // parent-facing changes (no signup_role / signup_source / first_name).
          properties: {
            teen_profile: true,
            teen_signup_role: 'athlete-teen',
            teen_first_name: v.firstName,
            teen_birth_month: v.birthMonth,
            teen_birth_year: v.birthYear,
            teen_sports_played: v.sports
          }
        }
      }
    };
  }

  var api = { isUnder13: isUnder13, buildParentPayload: buildParentPayload, buildTeenPayload: buildTeenPayload };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
    return;
  }

  /* ---------- browser ---------- */

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* private mode etc. */ }
  }

  function postToKlaviyo(cfg, endpoint, payload) {
    var url = 'https://a.klaviyo.com/client/' + endpoint + '/?company_id=' + encodeURIComponent(cfg.publicKey);
    var controller = window.AbortController ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS) : null;
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
        revision: cfg.revision
      },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error('Klaviyo ' + endpoint + ' responded ' + res.status);
      return res;
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  }

  function checkedSports(form) {
    return Array.prototype.map.call(form.querySelectorAll('input[name="sports"]:checked'), function (el) {
      return el.value;
    });
  }

  function init(root) {
    if (root.dataset.tsuReady) return;
    root.dataset.tsuReady = '1';

    var cfg = JSON.parse(root.querySelector('[data-tsu-config]').textContent);
    var steps = {};
    Array.prototype.forEach.call(root.querySelectorAll('[data-step]'), function (el) {
      steps[el.getAttribute('data-step')] = el;
    });
    var athlete = {}; // birth month/year carried from the age step to the teen step
    var timers = {};

    function show(name) {
      Object.keys(steps).forEach(function (key) { steps[key].hidden = key !== name; });
      var el = steps[name];
      if (el.tagName === 'FORM') armForm(el);
      var heading = el.querySelector('[data-step-heading]');
      window.scrollTo(0, 0);
      if (heading) heading.focus({ preventScroll: true });
    }

    // Disable submit for a couple of seconds after a step appears (bots submit instantly).
    function armForm(form) {
      var err = form.querySelector('[data-error]');
      if (err) err.hidden = true;
      var btn = form.querySelector('[type="submit"]');
      if (!btn) return;
      var key = form.getAttribute('data-step');
      form.dataset.readyAt = String(Date.now() + SUBMIT_DELAY_MS);
      btn.disabled = true;
      clearTimeout(timers[key]);
      timers[key] = setTimeout(function () {
        if (form.dataset.busy !== '1') btn.disabled = false;
      }, SUBMIT_DELAY_MS);
    }

    function setBusy(form, busy) {
      var btn = form.querySelector('[data-submit]');
      form.dataset.busy = busy ? '1' : '';
      if (!btn) return;
      btn.disabled = busy;
      btn.textContent = busy ? cfg.sendingLabel : btn.getAttribute('data-label');
    }

    function requireSport(form) {
      var boxes = form.querySelectorAll('input[name="sports"]');
      if (!boxes.length) return true;
      var ok = form.querySelectorAll('input[name="sports"]:checked').length > 0;
      boxes[0].setCustomValidity(ok ? '' : 'Please pick at least one sport.');
      if (!ok) boxes[0].reportValidity();
      return ok;
    }

    function honeypotFilled(form) {
      var hp = form.querySelector('[data-honeypot]');
      return !!(hp && hp.value);
    }

    function resetForm(form) {
      form.reset();
      Array.prototype.forEach.call(form.querySelectorAll('input[name="sports"]'), function (b) { b.setCustomValidity(''); });
    }

    // Sends the request for a form; on failure shows the error + retry.
    function send(form, endpoint, payload, nextStep) {
      setBusy(form, true);
      var err = form.querySelector('[data-error]');
      if (err) err.hidden = true;
      form._lastRequest = { endpoint: endpoint, payload: payload, nextStep: nextStep };
      postToKlaviyo(cfg, endpoint, payload).then(function () {
        setBusy(form, false);
        form._lastRequest = null;
        resetForm(form);
        show(nextStep);
      }).catch(function (e) {
        if (window.console) console.warn('[tournament-signup]', e);
        setBusy(form, false);
        if (err) err.hidden = false;
      });
    }

    root.addEventListener('click', function (event) {
      var target = event.target.closest('[data-choose], [data-go], [data-retry]');
      if (!target || !root.contains(target)) return;

      if (target.hasAttribute('data-choose')) {
        var role = target.getAttribute('data-choose');
        if (role === 'parent') return show('parent');
        // Athlete: if this device already answered under 13, skip straight to the links.
        return show(storageGet(U13_KEY) === '1' ? 'links' : 'age');
      }
      if (target.hasAttribute('data-go')) {
        return show(target.getAttribute('data-go'));
      }
      if (target.hasAttribute('data-retry')) {
        var form = target.closest('form');
        var last = form && form._lastRequest;
        if (last && form.dataset.busy !== '1') send(form, last.endpoint, last.payload, last.nextStep);
      }
    });

    root.addEventListener('change', function (event) {
      if (event.target.name === 'sports') event.target.form.querySelector('input[name="sports"]').setCustomValidity('');
    });

    root.addEventListener('submit', function (event) {
      var form = event.target;
      if (!root.contains(form)) return;
      event.preventDefault();

      if (form.dataset.busy === '1') return;
      if (Date.now() < Number(form.dataset.readyAt || 0)) return;

      var kind = form.getAttribute('data-kind');
      var data = new FormData(form);

      if (kind === 'age') {
        var month = parseInt(data.get('birth_month'), 10);
        var year = parseInt(data.get('birth_year'), 10);
        if (!month || !year) return;
        form.reset(); // don't keep the answer in the page
        if (isUnder13(month, year)) {
          storageSet(U13_KEY, '1');
          athlete = {};
          return show('links');
        }
        athlete = { birthMonth: pad2(month), birthYear: String(year) };
        return show('teen');
      }

      if (!requireSport(form)) return;

      var values = {
        firstName: String(data.get('first_name') || '').trim(),
        lastName: String(data.get('last_name') || '').trim(),
        email: String(data.get('email') || '').trim(),
        sports: checkedSports(form)
      };

      if (kind === 'parent') {
        if (honeypotFilled(form)) { resetForm(form); return show('parent-success'); }
        values.birthMonth = String(data.get('birth_month') || '');
        values.birthYear = String(data.get('birth_year') || '');
        return send(form, 'subscriptions', buildParentPayload(cfg, values), 'parent-success');
      }

      if (kind === 'teen') {
        if (!athlete.birthYear) return show('age'); // reached without the age step
        if (honeypotFilled(form) || !values.email) { resetForm(form); athlete = {}; return show('links'); }
        values.birthMonth = athlete.birthMonth;
        values.birthYear = athlete.birthYear;
        athlete = {};
        return send(form, 'profiles', buildTeenPayload(cfg, values), 'links');
      }
    });
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-tsu]'), init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('shopify:section:load', boot);
})();
