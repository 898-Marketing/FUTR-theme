/******/ (() => { // webpackBootstrap
/* eslint-disable */
if (!customElements.get('product-information')) {
  customElements.define('product-information', class ProductInformation extends HTMLElement {
    constructor() {
      super();
      this.dataCache = new Map(); // Cache for pre-fetched data
      this.init();
    }

    init() {
      this.cacheDOMElements();
      this.bindEventHandlers();
    }

    cacheDOMElements() {
      /* ===== Cache any information that we'll need later ===== */
      this.sectionId = this.getAttribute('data-section-id');
      this.originalSectionId = this.getAttribute('data-original-section-id');
      this.isQuickView = this.dataset.quickView === 'true';
      this.productForm = this.querySelector('product-form');
      this.stickyAddToCart = this.querySelector('sticky-add-to-cart');
      this.stickyContainer = this.classList.contains('product-sticky') ? this : null;
      this.stickyHeader = document.querySelector('.header-section:has(.header-is-sticky)');
      this.enableURLUpdate = this.dataset.enableUrlUpdate === 'true';
      this.mainProductURL = this.dataset.url;
      this.showOnlyVariantMedia = this.dataset.showOnlyVariantMedia === 'true';
    }

    connectedCallback() {
      /* ===== Gather options for the current variant, handle sticky form offset, attach event listeners ===== */
      this.setStickyOffset();
      this.attachEventListeners();
      this.prefetchVariantData();
      this.isCombinedListing = this.dataset.isCombinedListing === 'true';
    }

    disconnectedCallback() {
      /* ===== Clean up event listeners ===== */
      this.removeEventListeners();
    }

    bindEventHandlers() {
      /* ===== Bind methods to maintain the 'this' context ===== */
      this.resizeHandler = this.handleResize.bind(this);
      this.onQuantityChange = this.handleQuantityChange.bind(this);
      this.onVariantChange = this.handleVariantChange.bind(this);
      this.onCartAdded = this.handleCartAdded.bind(this);
      this.resetQuantityInput = this.resetQuantityInput.bind(this);
      this.prefetchVariantData = this.prefetchVariantData.bind(this);
      this.resetQuantityInput = this.resetQuantityInput.bind(this);
    }

    attachEventListeners() {
      // On resize we need to update the sticky form offset
      window.addEventListener('resize', this.resizeHandler);
      // Listen for quantity changes
      eventBus.on('qty:change', this.onQuantityChange);
      // Listen for variant changes
      eventBus.on('variant:change', this.onVariantChange);
      // Listen for cart added events
      eventBus.on('cart:added', this.onCartAdded);
    }

    removeEventListeners() {
      /* ===== Remove any event listeners we've attached ===== */
      window.removeEventListener('resize', this.resizeHandler);
      eventBus.off('qty:change', this.onQuantityChange);
      eventBus.off('variant:change', this.onVariantChange);
      eventBus.off('cart:added', this.onCartAdded);
    }

    prefetchVariantData() {
      const variants = this.querySelectorAll('[data-product-variant]');
      if (!variants.length) return;

      variants.forEach(variant => {
        const productFetchUrl = variant.getAttribute('data-product-fetch-url');

        if (productFetchUrl && !this.dataCache.has(productFetchUrl)) {
          this.fetchProductData(productFetchUrl).catch(error => {
            console.error(`Failed to fetch data for ${productFetchUrl}:`, error);
          });
        }
      });
    }

    async fetchProductData(productFetchUrl) {
      try {
        const response = await fetch(`${productFetchUrl}&section_id=${this.originalSectionId}`);
        if (!response.ok) {
          throw new Error(`Network response was not ok for ${productFetchUrl}`);
        }
        const data = await response.text();
        const productData = this.extractProductData(data);
        this.dataCache.set(productFetchUrl, productData);
      } catch (error) {
        console.error(`Failed to fetch product data from ${productFetchUrl}:`, error);
      }
    }

    async fetchVariantData(productFetchUrl, context) {
      /* ===== Fetch the product data if it's not already cached ===== */
      if (!this.dataCache.has(productFetchUrl) || window.Shopify.designMode) {
        await this.fetchProductData(productFetchUrl);
      }
      this.updateDOMWithData(context);
    }

    extractProductData(data) {
      /* ===== Parse the fetched data and return the new product data ===== */
      const parser = new DOMParser();
      const htmlDocument = parser.parseFromString(data, 'text/html');
      const productInformation = htmlDocument.querySelector('product-information');
      const quickViewContent = htmlDocument.querySelector('template[data-quick-view-product]')?.content;

      const quickViewContentInformation = quickViewContent?.querySelector('product-information');
      const productDataElement = this.isQuickView && quickViewContentInformation ? quickViewContentInformation : productInformation;

      const productMedia = htmlDocument.querySelector('[data-product-media-wrapper]');
      const quickViewMedia = quickViewContent?.querySelector('[data-product-media-wrapper]');
      const productBadges = this.isQuickView && quickViewMedia ? quickViewMedia.querySelectorAll('[data-product-badge]') : productMedia?.querySelectorAll('[data-product-badge]');

      if (this.isCombinedListing || productBadges.length) {
        const productMediaElement = this.isQuickView && quickViewMedia ? quickViewMedia : productMedia;
        const productDiv = document.createElement('div');
        productDiv.setAttribute('data-url', productInformation?.getAttribute('data-url'));
        productDiv.appendChild(productMediaElement);
        productDiv.appendChild(productDataElement);

        return productDiv.outerHTML;
      }

      return productDataElement.outerHTML;
    }

    handleResize() {
      /* ===== Handle resizing of the window ===== */
      if (window.Shopify.designMode) {
        // If we're in the theme editor we need to update the sticky form offset
        // We only do this in the editor because it's not necessary in the live site
        // because mobile devices can incorrectly trigger resize events when scrolling
        this.setStickyOffset();
      }
    }

    handleQuantityChange(event) {
      /* ===== Handle changes to the quantity input ===== */

      // Update the quantity input value
      this.productForm = this.querySelector('product-form');
      this.formQuantityInput = this.productForm?.querySelector('[name="quantity"]');

      if (this.formQuantityInput && event.value) {
        if (event.sectionId && event.sectionId !== this.sectionId) return;
        this.formQuantityInput.value = event.value;
      }
    }

    setStickyOffset() {
      if (this.stickyContainer && this.stickyHeader) {
        // Set the top offset of the sticky form to the height of the sticky header
        this.stickyContainer.style.top = `${this.stickyHeader.offsetHeight + 30}px`;
      }
    }

    async handleVariantChange(context) {
      /* ===== Handle changes to the variant ===== */
      if (context.sectionId && context.sectionId !== this.sectionId) return;

      // Update the current variant based on the selected options
      this.currentVariant = context.variant;
      this.productFetchUrl = context.fetchURL;
      this.productUrl = context.productURL;

      // If we don't have a valid variant, handle it and return
      if (!this.currentVariant) {
        this.handleInvalidVariant(context);
        return;
      }

      if (!this.productFetchUrl || !this.productUrl) return;

      // If the variant is available, update the UI
      this.toggleAddButton(this.currentVariant.available);
      const isCached = this.dataCache.has(this.productFetchUrl) && !window.Shopify.designMode;

      if (isCached) {
        this.updateDOMWithData(context);
      } else {
        // If the data is not cached, fetch the product data and then update the UI
        await this.fetchVariantData(this.productFetchUrl, context);
      }

      // Show the sticky add to cart
      if (this.stickyAddToCart) {
        this.stickyAddToCart.classList.remove('hide');
      }

      // Reset quantity input to 1 on variant change
      this.resetQuantityInput();

      // Refocus on the active radio input
      const activeRadioInput = this.querySelector('input[type="radio"][name^="option-"]:checked');
      if (activeRadioInput && !context.fromSlideChange) {
        activeRadioInput.focus();
      }
    }

    handleInvalidVariant(context = {}) {
      /* ===== Handle an invalid variant ===== */
      const productUrl = this.productUrl || this.mainProductURL;
      const productFetchUrl = this.buildRequestUrlWithParams(false, productUrl);
      this.fetchNullVariantData(productFetchUrl, context);

      // If the variant is invalid, disable the add to cart button
      this.toggleAddButton(false);
      // If the variant is invalid, set the add to cart button text to "unavailable"
      const addButton = this.productForm?.querySelector('[name="add"]');
      if (!addButton) return;
      const addButtonSpan = addButton.querySelector('[data-add-to-cart-text]');
      if (!addButtonSpan) return;

      addButtonSpan.textContent = addButtonSpan.getAttribute('data-unavailable-text');

      // If the variant is invalid, set the price to "Unavailable"
      const priceElement = this.querySelector('[data-product-price]');
      if (!priceElement) return;
      const priceElementSpan = priceElement.querySelector('span[data-price-text]');
      if (!priceElementSpan) return;

      priceElementSpan.textContent = priceElementSpan.getAttribute('data-unavailable-text');

      // If the variant is invalid, hide the sticky add to cart
      if (this.stickyAddToCart) {
        this.stickyAddToCart.classList.add('hide');
      }
    }

    handleCartAdded(event) {
      /* ===== Handle when a product is added to cart ===== */
      if (event.sectionId && event.sectionId !== this.sectionId) return;
      
      // Reset quantity input to 1 after adding to cart
      this.resetQuantityInput();
    }

    resetQuantityInput() {
      /* ===== Reset the quantity input to 1 when variant changes or after cart addition ===== */
      const quantityInput = this.productForm?.querySelector('[name="quantity"]');
      if (quantityInput) {
        quantityInput.value = '1';
      }
    }

    buildRequestUrlWithParams(shouldFetchFullPage = false, url = null) {
      const params = [];
      const optionValues = this.selectedOptionValues;

      !shouldFetchFullPage && params.push(`section_id=${this.originalSectionId || this.sectionId}`);

      if (optionValues.length) {
        params.push(`option_values=${optionValues.join(',')}`);
      }

      return `${url || this.mainProductURL}?${params.join('&')}`;
    }

    get selectedOptionValues() {
      return Array.from(this.querySelectorAll('li[data-product-variant][selected], input[data-product-variant]:checked')).map(
        ({ dataset }) => dataset.optionValueId
      );
    }

    async fetchNullVariantData(productFetchUrl, context = {}) {
      /* ===== Fetch the product data if it's not already cached ===== */
      try {
        const response = await fetch(`${productFetchUrl}`);
        if (!response.ok) {
          throw new Error(`Network response was not ok for ${productFetchUrl}`);
        }
        const data = await response.text();
        const productData = this.extractProductData(data);
        this.dataCache.set(productFetchUrl, productData);
        this.updateNullVariant(productData, context);
      } catch (error) {
        console.error(`Failed to fetch product data from ${productFetchUrl}:`, error);
      }
    }

    updateNullVariant(extractedData, context = {}) {
      const html = this.parseHTML(extractedData);
      const productInformation = html.querySelector('product-information');
      const newProductUrl = productInformation?.getAttribute('data-url');

      // Update the main product URL if it changed (combined listing product swap)
      if (newProductUrl && newProductUrl !== this.mainProductURL) {
        this.mainProductURL = newProductUrl;
        this.dataset.url = newProductUrl;
      }

      // Full DOM update using the same logic as valid variants
      const productURL = newProductUrl || context.productURL || this.mainProductURL;
      this.replaceElements(html, { ...context, productURL });
    }

    updateDOMWithData(context) {
      /* ===== Update the UI with the cached data ===== */
      if (this.enableURLUpdate) this.updateURL();

      const data = this.dataCache.get(context.fetchURL);
      const html = this.parseHTML(data);
      this.updateDOM(html, context);
    }

    parseHTML(data) {
      /* ===== Parse the fetched data into a DOM object ===== */
      return new DOMParser().parseFromString(data, 'text/html');
    }

    updateDOM(html, context = {}) {
      /* ===== Update the DOM with the fetched data ===== */
      this.replaceElements(html, context);

      if (context.fromSlideChange) return;

      // Emit an event to let other components know the variant was updated
      eventBus.emit('variant:updated', {
        variant: this.currentVariant,
        sectionId: this.sectionId,
        isCombinedListing: context.isCombinedListing
      });
    }

    toggleAddButton(enable) {
      /* ===== Toggle the add to cart button based on the variant availability ===== */
      const addButton = this.productForm?.querySelector('[name="add"]');
      if (addButton) {
        addButton.toggleAttribute('disabled', !enable);
      }
    }

    updateURL() {
      /* ===== Update the URL with the current variant ID ===== */
      if (this.currentVariant) {
        window.history.replaceState({}, '', `${this.productFetchUrl}`);
      }
    }

    updateOptions(html, context = {}) {
      /* ===== Update the product options with the new data ===== */
      if (!html) return;

      const productInformation = html.querySelector(`product-information[data-url="${context.productURL}"]`);
      if (!productInformation) return;
    
      const currentElements = Array.from(this.querySelectorAll('[data-product-options]'));

      // Update existing options
      currentElements.forEach(currentElement => {
        const currentUpdateId = currentElement.getAttribute('data-update-id');
        const newElement = productInformation.querySelector(`[data-update-id="${currentUpdateId}"]`);
        if (newElement) {
          // Replace the element if it has the data-replace-content attribute, otherwise update the innerHTML
          currentElement.replaceWith(newElement);
        }
      });
    }

    replaceElements(html, context = {}) {
      /* ===== Replace elements in the DOM with new elements ===== */
      if (!html) return;
    
      const productInformation = html.querySelector(`product-information[data-url="${context.productURL}"]`);
      if (!productInformation) return;

      const currentElements = Array.from(this.querySelectorAll('[data-update-id]'));
      const newElements = Array.from(productInformation.querySelectorAll('[data-update-id]'));
    
      // Update existing elements and track their order
      currentElements.forEach(currentElement => {
        const currentUpdateId = currentElement.getAttribute('data-update-id');
        const newElement = productInformation.querySelector(`[data-update-id="${currentUpdateId}"]`);
        if (newElement) {
          // Replace the element if it has the data-replace-content attribute, otherwise update the innerHTML
          newElement.hasAttribute('data-replace-content') ? currentElement.replaceWith(newElement) : currentElement.innerHTML = newElement.innerHTML;
        }
      });
    
      // Add new elements in the correct order
      newElements.forEach(newElement => {
        const newUpdateId = newElement.getAttribute('data-update-id');
        const existingElement = this.querySelector(`[data-update-id="${newUpdateId}"]`);
    
        if (!existingElement) {
          // Determine the correct position to insert the new element
          let inserted = false;
          for (let i = 0; i < currentElements.length; i++) {
            const currentElement = currentElements[i];
            const currentUpdateId = currentElement.getAttribute('data-update-id');
            if (currentUpdateId > newUpdateId) {
              currentElement.insertAdjacentElement('beforebegin', newElement.cloneNode(true));
              inserted = true;
              break;
            }
          }
          // If not inserted, append to the end
          if (!inserted) {
            this.appendChild(newElement.cloneNode(true));
          }
        }
      });

      const productMedia = html.querySelector('[data-product-media-wrapper]');
      const productWrapper = this.closest('[data-product-content-wrapper]');
      const currentProductMedia = productWrapper?.querySelector('[data-product-media-wrapper]');

      // Update the badges if they exist
      const currentBadges = currentProductMedia ? currentProductMedia.querySelectorAll('[data-product-badge]') : null;
      const newBadges = productMedia ? productMedia.querySelectorAll('[data-product-badge]') : null;

      if (currentBadges && newBadges && !this.showOnlyVariantMedia) {
        currentBadges.forEach((badge, index) => {
          const newBadge = newBadges[index];
          if (newBadge) {
            badge.replaceWith(newBadge);
          }
        });
      }
    
      if (this.isCombinedListing && context.isCombinedListing || this.showOnlyVariantMedia) {
        const mediaSources = productMedia?.getAttribute('data-media-sources');
        const currentMediaSources = currentProductMedia?.getAttribute('data-media-sources');
        if (mediaSources === currentMediaSources) return;
        
        if (productMedia && currentProductMedia) currentProductMedia.replaceWith(productMedia);

        eventBus.emit('product:media:updated', {
          variant: this.currentVariant,
          sectionId: this.sectionId,
          isCombinedListing: context.isCombinedListing
        });
      }
    
      if (window.Shopify && window.Shopify.PaymentButton) {
        window.Shopify.PaymentButton.init();
      }
    }    
  });
}
/******/ })()
;