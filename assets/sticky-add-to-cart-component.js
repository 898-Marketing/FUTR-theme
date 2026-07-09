/******/ (() => { // webpackBootstrap
/**
 * Sticky Add to Cart Component
 * A custom element for handling sticky add to cart functionality
 */
class StickyAddToCart extends HTMLElement {
  constructor() {
    super();
    
    this.observer = null;
    this.footerObserver = null;
    this.productSection = null;
    this.footerWrapper = null;
    this.hideTimeout = null;
    this.shouldHideForProduct = false;
    this.shouldHideForFooter = false;
  }

  connectedCallback() {
    // Component has been added to the DOM
    this.init();
  }

  disconnectedCallback() {
    // Component has been removed from the DOM
    this.cleanup();
  }

  init() {
    // Find the product section element
    this.productSection = document.querySelector('.product-section');
    
    if (!this.productSection) {
      console.warn('StickyAddToCart: .product-section element not found');
      return;
    }

    // Find the footer wrapper element
    this.footerWrapper = document.querySelector('.footer-wrapper');
    
    if (!this.footerWrapper) {
      console.warn('StickyAddToCart: .footer-wrapper element not found');
    }

    setTimeout(() => {
      // Remove transform on product section to allow position fixed to work
      this.productSection.style.animationName = 'none';
      // Ensure the product section has animated in
      this.productSection.classList.remove('show-on-scroll');
      this.productSection.classList.add('animated', 'fadeIn', 'shown-on-scroll');
    }, 1000);

    // Create Intersection Observer for product section
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Track if product section is in view
          this.shouldHideForProduct = entry.isIntersecting;
          this.updateVisibility();
        });
      },
      {
        // Trigger when the product section is completely out of view
        threshold: 0,
        rootMargin: '0px'
      }
    );

    // Start observing the product section
    this.observer.observe(this.productSection);

    // Create Intersection Observer for footer (if footer exists)
    if (this.footerWrapper) {
      this.footerObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // Hide when footer is at least 25% in view
            this.shouldHideForFooter = entry.isIntersecting;
            this.updateVisibility();
          });
        },
        {
          // Trigger when 25% of the footer is visible
          threshold: 0.25,
          rootMargin: '0px'
        }
      );

      // Start observing the footer
      this.footerObserver.observe(this.footerWrapper);
    }
  }

  updateVisibility() {
    // Hide if either product section is in view OR footer is at least 25% in view
    if (this.shouldHideForProduct || this.shouldHideForFooter) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    // Clear any pending hide timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    
    // Remove hiding class if present and add visible class
    this.classList.remove('is-hiding');
    this.classList.add('is-visible');
  }

  hide() {
    // Don't hide if not visible
    if (!this.classList.contains('is-visible')) {
      return;
    }
    
    // Start hide animation
    this.classList.remove('is-visible');
    this.classList.add('is-hiding');
    
    // Wait for animation to complete before removing is-hiding class
    this.hideTimeout = setTimeout(() => {
      this.classList.remove('is-hiding');
      this.hideTimeout = null;
    }, 300); // Match animation duration
  }

  cleanup() {
    // Clear any pending timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    
    // Disconnect product section observer and clean up references
    if (this.observer && this.productSection) {
      this.observer.unobserve(this.productSection);
      this.observer.disconnect();
    }
    
    // Disconnect footer observer and clean up references
    if (this.footerObserver && this.footerWrapper) {
      this.footerObserver.unobserve(this.footerWrapper);
      this.footerObserver.disconnect();
    }
    
    this.observer = null;
    this.footerObserver = null;
    this.productSection = null;
    this.footerWrapper = null;
  }
}

// Register the custom element
if (!customElements.get('sticky-add-to-cart')) {
  customElements.define('sticky-add-to-cart', StickyAddToCart);
}
/******/ })()
;