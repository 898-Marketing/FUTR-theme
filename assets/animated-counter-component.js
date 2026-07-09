/******/ (() => { // webpackBootstrap
class AnimatedCounter extends HTMLElement {
  constructor() {
    super();
    this.init = this.init.bind(this);
    this.animateNumber = this.animateNumber.bind(this);
    this.hasAnimated = false;
    this.animationStyle = this.dataset.animationStyle;
    this.delay = parseInt(this.dataset.delay) || 0;
    this.animationDuration = this.animationStyle === 'slow' ? 3000 : 2000;
  }

  connectedCallback() {
    window.wetheme.webcomponentRegistry.register({key: 'component-animated-counter'});
    
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    
    this.init();
  }

  init() {
    if (!this.cacheDomElements()) return;
    if (!this.parseAndValidateTarget()) return;
    
    this.createNumberStructure();
    this.setupIntersectionObserver();
  }

  cacheDomElements() {
    this.numberElement = this.querySelector('[data-number]');
    if (!this.numberElement) return false;
    
    this.blocksContainer = this.closest('.animated-counter__blocks');
    this.blockElement = this.closest('.animated-counter__block');
    return !!(this.blocksContainer && this.blockElement);
  }

  parseAndValidateTarget() {
    const originalText = this.dataset.target;
    
    // Check has text
    if (!originalText || originalText.trim() === '') {
      return false;
    }
    
    // Check has number
    if (!/\d/.test(originalText)) {
      return false;
    }
    
    this.parseNumberText();
    
    // Check parsed state is valid number
    if (isNaN(this.target)) {
      return false;
    }
    
    // Reject if exceeds 10 billion
    if (this.target > 10000000000) {
      console.warn('AnimatedCounter: Target number exceeds maximum limit of 10 billion');
      return false;
    }
    
    return true;
  }

  setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.hasAnimated) {
            this.triggerAnimation();
            this.hasAnimated = true;
            this.intersectionObserver.unobserve(this);
          }
        });
      }
    );

    this.intersectionObserver.observe(this.blocksContainer);
  }

  parseNumberText() {
    const rawText = this.dataset.target;
    // Match numbers with optional commas and decimal points (e.g., 10,000.50 or 1,234.567)
    const rawMatch = rawText.match(/[\d,.]+/);
    
    // Check if commas are being used as decimals, and clean original text and number accordingly
    const { originalText, numberMatch } = this.cleanForCommasAsDecimals(rawText, rawMatch);

    if (numberMatch) {
      // Remove commas to get the actual number for calculation
      const cleanNumber = numberMatch[0].replace(/,/g, '');
      this.target = parseFloat(cleanNumber);
      // Store the original format to preserve comma and decimal formatting
      this.originalNumber = numberMatch[0];
      this.hasCommas = numberMatch[0].includes(',');
      this.hasDecimals = numberMatch[0].includes('.');
      
      // Extract decimal places for formatting consistency
      if (this.hasDecimals) {
        const decimalPart = cleanNumber.split('.')[1];
        this.decimalPlaces = decimalPart ? decimalPart.length : 0;
        // For animation purposes, treat decimals like integers by removing the decimal point
        // e.g., 9.257 becomes 9257 for animation calculations
        this.animationTarget = parseInt(cleanNumber.replace('.', ''), 10);
      } else {
        this.decimalPlaces = 0;
        this.animationTarget = this.target;
      }
      
      const numberIndex = originalText.indexOf(numberMatch[0]);
      this.prefixText = originalText.substring(0, numberIndex);
      this.suffixText = originalText.substring(numberIndex + numberMatch[0].length);
    } else {
      this.target = 0;
      this.originalNumber = '0';
      this.hasCommas = false;
      this.hasDecimals = false;
      this.decimalPlaces = 0;
      this.animationTarget = 0;
      this.prefixText = '';
      this.suffixText = originalText;
    }
  }

  cleanForCommasAsDecimals(text, match) {
    if (!text || !match) return { originalText: text, numberMatch: match };
    const parts = match[0].split(',');
    
    if (parts.length < 2) {
      return { originalText: text, numberMatch: match };
    }

    const lastPart = parts[parts.length - 1];

    if (lastPart.length !== 3 && !lastPart.includes('.')) {
      this.usesCommasAsDecimals = true;
      match[0] = match[0].replace(/,/g, '.');
      const originalText = text.replace(',', '.');
      return { originalText, numberMatch: match };
    }

    return { originalText: text, numberMatch: match };
  }

  createNumberStructure() {
    // Calculate the transition point (where linear becomes eased) using animation target
    this.transitionValue = Math.max(0, this.animationTarget - 10);
    
    let html = '';
    
    html += this.prefixText ? `<span class="animated-counter__prefix">${this.prefixText}</span>` : '';
    
    // Create wrapper for the number with fixed-width digits
    html += `<span class="animated-counter__number-wrapper">`;
    
    // Always start from 1 for animation purposes, but convert to display format
    const startDisplayValue = this.convertAnimationValueToDisplay(1);
    html += this.createDigitStructure(startDisplayValue);
    
    html += `</span>`;
    
    html += this.suffixText ? `<span class="animated-counter__suffix">${this.suffixText}</span>` : '';
    
    this.numberElement.innerHTML = html;
    
    // Store references to digit spans for animation
    this.digitSpans = this.numberElement.querySelectorAll('.animated-counter__digit');
  }

  createDigitStructure(value) {
    // Format the number with commas and decimals if needed
    const formattedValue = this.formatNumber(value);
    
    let html = '';
    
    // Split the formatted number into individual characters
    for (let i = 0; i < formattedValue.length; i++) {
      const char = formattedValue[i];
      
      html += /\d/.test(char)
        ? `<span class="animated-counter__digit" data-digit-index="${i}">${char}</span>`
        : `<span class="animated-counter__separator">${char}</span>`;
    }
    
    return html;
  }


  triggerAnimation() {
    if (this.animationStyle === 'sequence' && this.blockElement) {
      this.blockElement.setAttribute('data-animate', '');
    }

    if (this.delay > 0) {
      setTimeout(() => this.animateNumber(), this.delay);
    } else {
      this.animateNumber();
    }
  }

  animateNumber() {
    if (!this.digitSpans || this.digitSpans.length === 0) return;
    
    // Remove is-hidden class when animation actually starts
    this.blockElement.classList.remove('is-hidden');
    
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / this.animationDuration, 1);
      
      const currentValue = this.calculateAnimationValue(progress);
      this.updateDigitStructure(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.updateDigitStructure(this.target); // Ensure we end with the exact target value
      }
    };
    
    requestAnimationFrame(animate);
  }

  calculateAnimationValue(progress) {
    if (this.animationStyle === 'slow') {
      return this.calculateSlowAnimationValue(progress);
    } else {
      const animatedValue = Math.floor(1 + (progress * (this.animationTarget - 1)));
      return this.convertAnimationValueToDisplay(animatedValue);
    }
  }

  calculateSlowAnimationValue(progress) {
    if (this.transitionValue === 0) {
      return this.calculateEasedValue(progress);
    } else {
      return this.calculateTwoPhaseValue(progress);
    }
  }

  calculateEasedValue(progress) {
    let easedProgress = 1 - Math.pow(1 - progress, 4);
    easedProgress = easedProgress >= 0.98 ? 1 : easedProgress;
    const animatedValue = Math.floor(1 + (easedProgress * (this.animationTarget - 1)));
    return this.convertAnimationValueToDisplay(animatedValue);
  }

  calculateTwoPhaseValue(progress) {
    const transitionPoint = 0.5;
    
    if (progress <= transitionPoint) {
      // Phase 1: Linear animation from 1 to transitionValue
      const linearProgress = progress / transitionPoint;
      const animatedValue = Math.floor(1 + (linearProgress * (this.transitionValue - 1)));
      return this.convertAnimationValueToDisplay(animatedValue);
    } else {
      // Phase 2: Eased animation from transitionValue to animationTarget
      const easedPhaseProgress = (progress - transitionPoint) / (1 - transitionPoint);
      let easedProgress = 1 - Math.pow(1 - easedPhaseProgress, 4);
      easedProgress = easedProgress >= 0.98 ? 1 : easedProgress;
      const animatedValue = Math.floor(this.transitionValue + (easedProgress * (this.animationTarget - this.transitionValue)));
      return this.convertAnimationValueToDisplay(animatedValue);
    }
  }

  convertAnimationValueToDisplay(animatedValue) {
    if (!this.hasDecimals) {
      return animatedValue;
    }
    
    // Convert the integer animation value back to decimal format
    // e.g., if animationTarget is 9257 and decimalPlaces is 3, convert 9257 to 9.257
    const divisor = Math.pow(10, this.decimalPlaces);
    return animatedValue / divisor;
  }

  updateDigitStructure(value) {
    const formattedValue = this.formatNumber(value);
    const numberWrapper = this.numberElement.querySelector('.animated-counter__number-wrapper');
    const newDigitCount = (formattedValue.match(/\d/g) || []).length;
    
    if (this.needsStructureRebuild(newDigitCount)) {
      this.rebuildDigitStructure(numberWrapper, value);
    } else {
      this.updateExistingDigits(formattedValue);
    }
  }

  needsStructureRebuild(newDigitCount) {
    return newDigitCount !== this.digitSpans.length;
  }

  rebuildDigitStructure(numberWrapper, value) {
    numberWrapper.innerHTML = this.createDigitStructure(value);
    this.digitSpans = this.numberElement.querySelectorAll('.animated-counter__digit');
  }

  updateExistingDigits(formattedValue) {
    let digitIndex = 0;
    for (let i = 0; i < formattedValue.length; i++) {
      const char = formattedValue[i];
      
      if (/\d/.test(char)) {
        if (this.digitSpans[digitIndex]) {
          this.digitSpans[digitIndex].textContent = char;
        }
        digitIndex++;
      }
    }
  }

  formatNumber(number) {
    let formattedNumber;
    
    if (this.hasDecimals) {
      // Format with fixed decimal places to maintain consistency
      formattedNumber = number.toFixed(this.decimalPlaces);
    } else {
      formattedNumber = number.toString();
    }
    
    // Add commas if the original had them
    if (this.hasCommas) {
      formattedNumber = this.formatWithCommas(formattedNumber);
    }

    // Format if commas are used as decimals
    if (this.usesCommasAsDecimals) {
      formattedNumber = formattedNumber.replace('.', ',');
    }
    
    return formattedNumber;
  }

  formatWithCommas(number) {
    const numberStr = typeof number === 'string' ? number : number.toString();
    // Handle decimal numbers by splitting and formatting the integer part only
    const parts = numberStr.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  disconnectedCallback() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}

if (!customElements.get('animated-counter')) customElements.define('animated-counter', AnimatedCounter);
/******/ })()
;