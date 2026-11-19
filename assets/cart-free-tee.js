/*
 * Free FUTR tee prompt (snippets/cart-free-tee.liquid).
 * The prompt lives inside the cart drawer area that the theme re-renders on every
 * cart change, so this uses one delegated listener instead of per-render scripts.
 */
(function () {
  'use strict';
  if (window.__futrFreeTee) return;
  window.__futrFreeTee = true;

  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

  function updateCountIndicators(cart) {
    document.querySelectorAll('[data-cart-count-indicator]').forEach(function (el) {
      el.textContent = cart.item_count;
      el.classList.toggle('hide', cart.item_count === 0);
    });
  }

  document.addEventListener('submit', function (event) {
    var form = event.target.closest && event.target.closest('[data-free-tee-form]');
    if (!form) return;
    event.preventDefault();

    var select = form.querySelector('select[name="id"]');
    var button = form.querySelector('button[type="submit"]');
    var error = form.parentElement.querySelector('[data-free-tee-error]');
    if (!select || !select.value) { if (select) select.reportValidity(); return; }

    button.disabled = true;
    if (error) error.hidden = true;

    fetch(root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items: [{ id: Number(select.value), quantity: 1 }], sections: 'cart-drawer' })
    })
      .then(function (res) {
        return res.json().then(function (json) {
          if (!res.ok) throw new Error(json.description || json.message || 'add failed');
          return json;
        });
      })
      .then(function (json) {
        if (window.eventBus) window.eventBus.emit('update:cart:drawer', json);
        return fetch(root + 'cart.js').then(function (r) { return r.json(); }).then(updateCountIndicators);
      })
      .catch(function (e) {
        if (window.console) console.warn('[free-tee]', e);
        button.disabled = false;
        if (error) error.hidden = false;
      });
  });
})();
