/******/ (() => { // webpackBootstrap
class OffersDrawerButton extends HTMLElement {
  constructor() {
    super();
    this.offersDrawerTrigger = this.querySelector('[data-offers-drawer-trigger]');
  }

  connectedCallback() {
    window.wetheme.webcomponentRegistry.register({key: 'component-offers-drawer-button'});
    this.offersDrawerTrigger.addEventListener('click', this.onOffersDrawerTriggerClick);
  }

  onOffersDrawerTriggerClick = (e) => {
    e.preventDefault();
    window.eventBus.emit('open:offers:drawer');
  }

  disconnectedCallback() {
    this.offersDrawerTrigger.removeEventListener('click', this.onOffersDrawerTriggerClick);
  }
}

customElements.define('offers-drawer-button', OffersDrawerButton);

/******/ })()
;