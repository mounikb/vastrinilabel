/* Berrylush Bloom - theme.js */
(function () {
  'use strict';

  /* -------- Mobile drawer -------- */
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  document.body.appendChild(overlay);

  function bindDrawerToggle(triggerSel, drawerSel) {
    const triggers = document.querySelectorAll(triggerSel);
    const drawer = document.querySelector(drawerSel);
    if (!drawer) return;
    triggers.forEach((trigger) => trigger.addEventListener('click', () => {
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }));
    drawer.querySelectorAll('[data-close]').forEach((closeButton) =>
      closeButton.addEventListener('click', () => closeDrawers())
    );
  }

  function closeDrawers() {
    document.querySelectorAll('.mobile-drawer,.cart-drawer').forEach((drawer) => drawer.classList.remove('is-open'));
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', closeDrawers);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDrawers();
      closeDropdowns();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    bindDrawerToggle('[data-open-menu]', '.mobile-drawer');
    bindDrawerToggle('[data-open-cart]', '.cart-drawer');
    initDropdowns();

    /* -------- Hero slideshow -------- */
    document.querySelectorAll('[data-hero]').forEach(initHero);

    /* -------- Quantity selectors -------- */
    document.querySelectorAll('[data-qty]').forEach(initQty);

    /* -------- Variant picker -------- */
    document.querySelectorAll('[data-product-form]').forEach(initVariant);

    /* -------- Product gallery thumbs -------- */
    document.querySelectorAll('[data-gallery]').forEach(initGallery);

    /* -------- Add to cart (AJAX) -------- */
    document.querySelectorAll('[data-product-form]').forEach((form) => {
      form.addEventListener('submit', async (event) => {
        if (!form.dataset.ajax) return;
        event.preventDefault();
        const button = form.querySelector('[type="submit"]');
        if (button) {
          button.disabled = true;
          button.dataset.label = button.textContent;
          button.textContent = 'Adding...';
        }
        try {
          const formData = new FormData(form);
          const response = await fetch('/cart/add.js', {
            method: 'POST',
            body: formData,
            headers: { Accept: 'application/json' }
          });
          if (!response.ok) throw new Error('Add failed');
          await refreshCart();
          openCartDrawer();
        } catch (error) {
          window.location.href = '/cart';
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = button.dataset.label || 'Add to cart';
          }
        }
      });
    });

    /* -------- Cart drawer line edits -------- */
    document.addEventListener('click', async (event) => {
      const removeButton = event.target.closest('[data-cart-remove]');
      if (!removeButton) return;
      event.preventDefault();
      await updateLine(removeButton.dataset.cartRemove, 0);
    });
  });

  function closeDropdowns(except) {
    document.querySelectorAll('[data-dropdown]').forEach((dropdown) => {
      if (dropdown === except) return;
      dropdown.classList.remove('is-open');
      const toggle = dropdown.querySelector('[data-dropdown-toggle]');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  }

  function initDropdowns() {
    document.querySelectorAll('[data-dropdown]').forEach((dropdown) => {
      const toggle = dropdown.querySelector('[data-dropdown-toggle]');
      if (!toggle) return;
      toggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const isOpen = dropdown.classList.contains('is-open');
        closeDropdowns(dropdown);
        dropdown.classList.toggle('is-open', !isOpen);
        toggle.setAttribute('aria-expanded', String(!isOpen));
      });
    });

    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-dropdown]')) return;
      closeDropdowns();
    });
  }

  function openCartDrawer() {
    const drawer = document.querySelector('.cart-drawer');
    if (!drawer) return;
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  async function refreshCart() {
    try {
      const sectionResponse = await fetch('/?section_id=cart-drawer');
      const html = await sectionResponse.text();
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const freshDrawer = temp.querySelector('.cart-drawer');
      const currentDrawer = document.querySelector('.cart-drawer');
      if (freshDrawer && currentDrawer) currentDrawer.innerHTML = freshDrawer.innerHTML;

      const cartResponse = await fetch('/cart.js');
      const cart = await cartResponse.json();
      document.querySelectorAll('[data-cart-count]').forEach((element) => {
        element.textContent = cart.item_count;
        element.style.display = cart.item_count > 0 ? '' : 'none';
      });
    } catch (error) {}
  }

  async function updateLine(key, quantity) {
    try {
      await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity })
      });
      await refreshCart();
    } catch (error) {}
  }

  function initHero(root) {
    const slides = root.querySelectorAll('.hero__slide');
    if (slides.length < 1) return;
    const track = root.querySelector('.hero__slides');
    const prev = root.querySelector('.hero__arrow--prev');
    const next = root.querySelector('.hero__arrow--next');
    let timer;
    let index = 0;

    const go = (targetIndex) => {
      index = (targetIndex + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
    };

    const restartTimer = () => {
      if (timer) window.clearInterval(timer);
      if (slides.length > 1) timer = window.setInterval(() => go(index + 1), 6000);
    };

    if (prev) prev.addEventListener('click', () => go(index - 1));
    if (next) next.addEventListener('click', () => go(index + 1));
    root.addEventListener('mouseenter', () => {
      if (timer) window.clearInterval(timer);
    });
    root.addEventListener('mouseleave', restartTimer);

    go(0);
    restartTimer();
  }

  function initQty(root) {
    const input = root.querySelector('input');
    root.querySelector('[data-qty-minus]').addEventListener('click', () => {
      input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    root.querySelector('[data-qty-plus]').addEventListener('click', () => {
      input.value = (parseInt(input.value, 10) || 1) + 1;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  function initVariant(form) {
    const variants = JSON.parse(form.dataset.variants || '[]');
    const optionInputs = form.querySelectorAll('[data-option-input]');
    const idInput = form.querySelector('[name="id"]');
    const priceEl = document.querySelector('[data-product-price]');
    const submit = form.querySelector('[type="submit"]');

    function update() {
      const selected = Array.from(form.querySelectorAll('[data-option-input]:checked')).map((input) => input.value);
      const match = variants.find((variant) => JSON.stringify(variant.options) === JSON.stringify(selected));
      if (!match) return;

      idInput.value = match.id;
      if (priceEl) priceEl.textContent = formatMoney(match.price);
      if (submit) {
        submit.disabled = !match.available;
        submit.textContent = match.available
          ? submit.dataset.addText || 'Add to cart'
          : submit.dataset.soldText || 'Sold out';
      }
    }

    optionInputs.forEach((input) => input.addEventListener('change', update));
    update();
  }

  function formatMoney(cents) {
    const currency = (window.Shopify && Shopify.currency && Shopify.currency.active) || 'USD';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
    } catch (error) {
      return `$${(cents / 100).toFixed(2)}`;
    }
  }

  function initGallery(root) {
    const main = root.querySelector('[data-gallery-main]');
    root.querySelectorAll('[data-gallery-thumb]').forEach((button) => {
      button.addEventListener('click', () => {
        if (main) main.src = button.dataset.src;
        root.querySelectorAll('[data-gallery-thumb]').forEach((thumb) => thumb.classList.remove('is-active'));
        button.classList.add('is-active');
      });
    });
  }
})();
