/*
 * Tournament signup (QR landing page) - November 2026.
 * Used by sections/tournament-signup.liquid. Vanilla JS, no dependencies.
 *
 * Data contract (see HANDOFF.md):
 *  - Parent/Guardian/Coach -> Klaviyo client SUBSCRIPTIONS endpoint, email
 *    marketing SUBSCRIBED, added to the configured list. Shows the promo code.
 *  - Athlete -> links screen only. Nothing is collected or sent (FUTR's
 *    privacy policy: event info comes only from the parent; agreed 2026-11-19).
 */
(function () {
  'use strict';

  var SUBMIT_DELAY_MS = 2000;
  var REQUEST_TIMEOUT_MS = 15000;

  /* ---------- pure helpers (exported for tests) ---------- */

  // Birth month/year are optional (coaches may not have one athlete). Blank
  // values are left out so they never erase what Klaviyo already has.
  function buildParentPayload(cfg, v) {
    var props = { signup_source: cfg.signupSource, signup_role: 'parent' };
    if (v.birthMonth) props.athlete_birth_month = v.birthMonth;
    if (v.birthYear) props.athlete_birth_year = v.birthYear;
    props.sports_played = v.sports;
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
                properties: props,
                subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } }
              }
            }
          }
        },
        relationships: { list: { data: { type: 'list', id: cfg.listId } } }
      }
    };
  }

  var api = { buildParentPayload: buildParentPayload };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
    return;
  }

  /* ---------- browser ---------- */

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
        return show(role === 'parent' ? 'parent' : 'links');
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

      if (form.getAttribute('data-kind') !== 'parent') return;
      var data = new FormData(form);

      if (!requireSport(form)) return;

      var values = {
        firstName: String(data.get('first_name') || '').trim(),
        lastName: String(data.get('last_name') || '').trim(),
        email: String(data.get('email') || '').trim(),
        sports: checkedSports(form)
      };

      if (honeypotFilled(form)) { resetForm(form); return show('parent-success'); }
      values.birthMonth = String(data.get('birth_month') || '');
      values.birthYear = String(data.get('birth_year') || '');
      return send(form, 'subscriptions', buildParentPayload(cfg, values), 'parent-success');
    });
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-tsu]'), init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('shopify:section:load', boot);
})();
