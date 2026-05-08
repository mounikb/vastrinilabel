/* Berrylush Bloom - theme.js */
(function () {
  'use strict';

  /* -------- Mobile drawer -------- */
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  document.body.appendChild(overlay);
  let shareModal;
  let shareModalTitle;
  let shareModalUrl;
  let shareModalNative;
  let shareModalCopy;
  let shareModalOpen;
  let sharePayload = null;

  function bindDrawerCloseButtons(drawer) {
    if (!drawer) return;
    drawer.querySelectorAll('[data-close]').forEach((closeButton) =>
      closeButton.addEventListener('click', () => closeDrawers())
    );
  }

  function bindDrawerToggle(triggerSel, drawerSel) {
    const triggers = document.querySelectorAll(triggerSel);
    const drawer = document.querySelector(drawerSel);
    if (!drawer) return;
    triggers.forEach((trigger) => trigger.addEventListener('click', () => {
      drawer.classList.add('is-open');
      syncOverlayState();
    }));
    bindDrawerCloseButtons(drawer);
  }

  function closeDrawers() {
    document.querySelectorAll('.mobile-drawer,.cart-drawer').forEach((drawer) => drawer.classList.remove('is-open'));
    syncOverlayState();
  }

  function closeModals() {
    document.querySelectorAll('.site-modal').forEach((modal) => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    });
    syncOverlayState();
  }

  function syncOverlayState() {
    const hasOpenSurface = document.querySelector('.mobile-drawer.is-open, .cart-drawer.is-open, .site-modal.is-open');
    overlay.classList.toggle('is-open', Boolean(hasOpenSurface));
    document.body.style.overflow = hasOpenSurface ? 'hidden' : '';
  }

  overlay.addEventListener('click', () => {
    closeDrawers();
    closeModals();
    closeDropdowns();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDrawers();
      closeModals();
      closeDropdowns();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    bindDrawerToggle('[data-open-menu]', '.mobile-drawer');
    bindDrawerToggle('[data-open-cart]', '.cart-drawer');
    initDropdowns();
    initModals();
    initShareModal();

    /* -------- Hero slideshow -------- */
    document.querySelectorAll('[data-hero]').forEach(initHero);

    /* -------- Featured collection carousels -------- */
    document.querySelectorAll('[data-product-carousel]').forEach(initProductCarousel);

    /* -------- Collection price filters -------- */
    document.querySelectorAll('[data-price-filter]').forEach(initPriceFilter);

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

    document.addEventListener('click', async (event) => {
      const shareButton = event.target.closest('[data-share-product]');
      if (!shareButton) return;
      openShareModalFromButton(event, shareButton, shareButton.closest('.product-card'));
    });

    document.addEventListener('click', async (event) => {
      const shareButton = event.target.closest('[data-share-page]');
      if (!shareButton) return;
      openShareModalFromButton(event, shareButton);
    });

    document.addEventListener('click', (event) => {
      const scrollTopButton = event.target.closest('[data-scroll-top]');
      if (!scrollTopButton) return;
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const desktop = window.matchMedia('(min-width: 991px)');
    document.querySelectorAll('[data-dropdown]').forEach((dropdown) => {
      const toggle = dropdown.querySelector('[data-dropdown-toggle]');
      if (!toggle) return;

      dropdown.addEventListener('mouseenter', () => {
        if (!desktop.matches) return;
        closeDropdowns(dropdown);
        dropdown.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      });

      dropdown.addEventListener('mouseleave', () => {
        if (!desktop.matches) return;
        dropdown.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });

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

  function initModals() {
    const loginModal = document.querySelector('[data-login-modal]');
    if (!loginModal) return;

    document.querySelectorAll('[data-open-login-modal]').forEach((button) => {
      button.addEventListener('click', () => {
        loginModal.classList.add('is-open');
        loginModal.setAttribute('aria-hidden', 'false');
        syncOverlayState();
      });
    });

    loginModal.querySelectorAll('[data-close-modal]').forEach((button) => {
      button.addEventListener('click', closeModals);
    });
  }

  function initShareModal() {
    const modal = document.createElement('div');
    modal.className = 'site-modal share-modal';
    modal.setAttribute('data-share-modal', '');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="site-modal__dialog share-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="ShareModalTitle">
        <button type="button" class="site-modal__close" data-close-modal aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
        <span class="site-modal__eyebrow">Share this piece</span>
        <h3 id="ShareModalTitle">Product</h3>
        <p class="share-modal__text">Send this link anywhere you like, or copy it for later.</p>
        <div class="share-modal__url" data-share-modal-url></div>
        <div class="share-modal__actions">
          <button type="button" class="btn btn--primary btn--lg" data-share-modal-native>Share now</button>
          <button type="button" class="btn btn--secondary btn--lg" data-share-modal-copy>Copy link</button>
        </div>
        <button type="button" class="share-modal__open-link" data-share-modal-open>Open product page</button>
      </div>
    `;
    document.body.appendChild(modal);

    shareModal = modal;
    shareModalTitle = modal.querySelector('#ShareModalTitle');
    shareModalUrl = modal.querySelector('[data-share-modal-url]');
    shareModalNative = modal.querySelector('[data-share-modal-native]');
    shareModalCopy = modal.querySelector('[data-share-modal-copy]');
    shareModalOpen = modal.querySelector('[data-share-modal-open]');

    modal.querySelectorAll('[data-close-modal]').forEach((button) => {
      button.addEventListener('click', closeModals);
    });

    shareModalNative.addEventListener('click', async () => {
      if (!sharePayload) return;
      try {
        if (navigator.share) {
          await navigator.share({ title: sharePayload.title, url: sharePayload.url });
          closeModals();
        } else {
          await copyText(sharePayload.url);
          flashShareButton(shareModalCopy, 'Link copied');
        }
      } catch (error) {}
    });

    shareModalCopy.addEventListener('click', async () => {
      if (!sharePayload) return;
      try {
        await copyText(sharePayload.url);
        flashShareButton(shareModalCopy, 'Link copied');
      } catch (error) {}
    });

    shareModalOpen.addEventListener('click', () => {
      if (!sharePayload) return;
      window.open(sharePayload.url, '_blank', 'noopener');
    });
  }

  function openShareModalFromButton(event, button, card) {
    event.preventDefault();
    event.stopPropagation();

    const source = card || button;
    const shareUrl = source?.dataset.productUrl || button.dataset.shareUrl;
    const shareTitle = source?.dataset.productTitle || button.dataset.shareTitle || document.title;
    if (!shareUrl || !shareModal) return;

    sharePayload = {
      title: shareTitle,
      url: shareUrl
    };

    shareModalTitle.textContent = shareTitle;
    shareModalUrl.textContent = shareUrl;
    shareModalNative.textContent = navigator.share ? 'Share now' : 'Quick share';
    shareModalCopy.textContent = 'Copy link';
    shareModalOpen.textContent = 'Open product page';

    shareModal.classList.add('is-open');
    shareModal.setAttribute('aria-hidden', 'false');
    syncOverlayState();
  }

  function openCartDrawer() {
    const drawer = document.querySelector('.cart-drawer');
    if (!drawer) return;
    drawer.classList.add('is-open');
    syncOverlayState();
  }

  async function refreshCart() {
    try {
      const cartResponse = await fetch('/cart.js');
      const cart = await cartResponse.json();
      const currentDrawer = document.querySelector('.cart-drawer');
      if (currentDrawer) {
        currentDrawer.innerHTML = renderCartDrawerMarkup(cart);
        bindDrawerCloseButtons(currentDrawer);
      }
      document.querySelectorAll('[data-cart-count]').forEach((element) => {
        element.textContent = cart.item_count;
        element.style.display = cart.item_count > 0 ? '' : 'none';
      });
    } catch (error) {}
  }

  function renderCartDrawerMarkup(cart) {
    const drawerTitle = 'Cart';
    const subtotalText = 'Subtotal';
    const shippingText = 'Shipping and taxes calculated at checkout.';
    const viewCartText = 'View cart';
    const checkoutText = 'Checkout';
    const removeText = 'Remove';
    const emptyText = 'Your cart is empty.';
    const continueText = 'Continue shopping';

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return `
        <div class="cart-drawer__head">
          <h3>${drawerTitle}</h3>
          <button data-close aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div class="cart-empty" style="padding:32px 0">
          <p>${emptyText}</p>
          <a href="/collections/all" class="btn btn--primary">${continueText}</a>
        </div>
      `;
    }

    const itemsMarkup = cart.items.map((item) => {
      const imageUrl = item.image || item.featured_image?.url || '';
      const variantTitle = item.variant_title && item.variant_title !== 'Default Title'
        ? `<div style="color:var(--color-muted);font-size:.78rem">${escapeHtml(item.variant_title)}</div>`
        : '';

      return `
        <div class="cart-drawer__row">
          <a href="${item.url}">
            ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(item.product_title)}" width="70" height="93" loading="lazy">` : ''}
          </a>
          <div>
            <a href="${item.url}"><strong>${escapeHtml(item.product_title)}</strong></a>
            ${variantTitle}
            <div style="margin-top:6px">${formatMoney(item.final_price)} x ${item.quantity}</div>
            <a href="#" data-cart-remove="${item.key}" style="font-size:.75rem;color:var(--color-muted);text-decoration:underline">${removeText}</a>
          </div>
          <div>${formatMoney(item.final_line_price)}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="cart-drawer__head">
        <h3>${drawerTitle}</h3>
        <button data-close aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
      </div>
      <div class="cart-drawer__items">${itemsMarkup}</div>
      <div class="cart-drawer__foot">
        <div class="row"><span>${subtotalText}</span><span>${formatMoney(cart.total_price)}</span></div>
        <p style="font-size:.78rem;color:var(--color-muted);margin:0 0 14px">${shippingText}</p>
        <a href="/cart" class="btn btn--secondary btn--block" style="margin-bottom:8px">${viewCartText}</a>
        <a href="/checkout" class="btn btn--primary btn--block">${checkoutText}</a>
      </div>
    `;
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

  function initProductCarousel(root) {
    const viewport = root.querySelector('[data-carousel-viewport]');
    const track = root.querySelector('[data-carousel-track]');
    const prev = root.querySelector('[data-carousel-prev]');
    const next = root.querySelector('[data-carousel-next]');
    if (!viewport || !track) return;

    const originalItems = Array.from(track.children);
    if (originalItems.length < 2 || originalItems[0].classList.contains('featured-carousel__empty')) {
      if (prev) prev.style.display = 'none';
      if (next) next.style.display = 'none';
      return;
    }

    const beforeFragment = document.createDocumentFragment();
    const afterFragment = document.createDocumentFragment();
    originalItems.forEach((item) => {
      const beforeClone = item.cloneNode(true);
      beforeClone.setAttribute('aria-hidden', 'true');
      beforeFragment.appendChild(beforeClone);

      const afterClone = item.cloneNode(true);
      afterClone.setAttribute('aria-hidden', 'true');
      afterFragment.appendChild(afterClone);
    });
    track.prepend(beforeFragment);
    track.append(afterFragment);

    let segmentStart = 0;
    let segmentWidth = 0;
    let isAdjusting = false;
    let isPointerDown = false;
    let pointerStart = 0;
    let scrollStart = 0;

    const measure = () => {
      const items = Array.from(track.children);
      const firstOriginal = items[originalItems.length];
      const firstAfter = items[originalItems.length * 2];
      if (!firstOriginal || !firstAfter) return;
      segmentStart = firstOriginal.offsetLeft;
      segmentWidth = firstAfter.offsetLeft - firstOriginal.offsetLeft;
      isAdjusting = true;
      viewport.scrollLeft = segmentStart;
      requestAnimationFrame(() => {
        isAdjusting = false;
      });
    };

    const stepAmount = () => {
      const firstCard = track.querySelector('.product-card');
      if (!firstCard) return viewport.clientWidth * 0.85;
      const style = window.getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || '24') || 24;
      return firstCard.getBoundingClientRect().width + gap;
    };

    const normalizeScroll = () => {
      if (isAdjusting || !segmentWidth) return;
      if (viewport.scrollLeft < segmentStart - 8) {
        viewport.scrollLeft += segmentWidth;
      } else if (viewport.scrollLeft >= segmentStart + segmentWidth - 8) {
        viewport.scrollLeft -= segmentWidth;
      }
    };

    const glide = (direction) => {
      viewport.scrollBy({ left: stepAmount() * direction, behavior: 'smooth' });
    };

    if (prev) prev.addEventListener('click', () => glide(-1));
    if (next) next.addEventListener('click', () => glide(1));

    viewport.addEventListener('scroll', normalizeScroll);
    window.addEventListener('resize', measure);

    viewport.addEventListener('pointerdown', (event) => {
      isPointerDown = true;
      pointerStart = event.clientX;
      scrollStart = viewport.scrollLeft;
      viewport.classList.add('is-dragging');
    });

    viewport.addEventListener('pointermove', (event) => {
      if (!isPointerDown) return;
      const delta = event.clientX - pointerStart;
      viewport.scrollLeft = scrollStart - delta;
    });

    const stopPointerDrag = () => {
      isPointerDown = false;
      viewport.classList.remove('is-dragging');
    };

    viewport.addEventListener('pointerup', stopPointerDrag);
    viewport.addEventListener('pointerleave', stopPointerDrag);
    viewport.addEventListener('pointercancel', stopPointerDrag);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    } else {
      window.setTimeout(measure, 120);
    }
    window.setTimeout(measure, 360);
  }

  function initPriceFilter(root) {
    const grid = document.querySelector('.product-grid--collection');
    const resultLabel = document.querySelector('[data-price-results]');
    const minInput = root.querySelector('[data-price-input="min"]');
    const maxInput = root.querySelector('[data-price-input="max"]');
    const toggle = root.querySelector('[data-price-filter-toggle]');
    const body = root.querySelector('[data-price-filter-body]');
    if (!grid || !minInput || !maxInput) return;

    const cards = Array.from(grid.querySelectorAll('.product-card[data-price]'));
    if (!cards.length) return;

    const absoluteMin = Number(root.dataset.minPrice || minInput.min || 0);
    const absoluteMax = Number(root.dataset.maxPrice || maxInput.max || 0);

    const parseFieldValue = (field) => {
      if (field.value === '') return null;
      const parsed = Number(field.value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const syncBounds = () => {
      let minValue = parseFieldValue(minInput);
      let maxValue = parseFieldValue(maxInput);

      if (minValue !== null) minValue = Math.max(absoluteMin, Math.min(minValue, absoluteMax));
      if (maxValue !== null) maxValue = Math.max(absoluteMin, Math.min(maxValue, absoluteMax));

      if (minValue !== null && maxValue !== null && minValue > maxValue) {
        if (document.activeElement === minInput) {
          maxValue = minValue;
          maxInput.value = String(maxValue);
        } else {
          minValue = maxValue;
          minInput.value = String(minValue);
        }
      }

      return { minValue, maxValue };
    };

    const applyFilter = () => {
      const { minValue, maxValue } = syncBounds();
      let visibleCount = 0;

      cards.forEach((card) => {
        const price = Number(card.dataset.price || 0);
        const aboveMin = minValue === null || price >= minValue;
        const belowMax = maxValue === null || price <= maxValue;
        const visible = aboveMin && belowMax;
        card.hidden = !visible;
        card.style.display = visible ? '' : 'none';
        if (visible) visibleCount += 1;
      });

      if (resultLabel) {
        resultLabel.textContent = `${visibleCount} product${visibleCount === 1 ? '' : 's'}`;
      }
    };

    [minInput, maxInput].forEach((input) => {
      input.addEventListener('input', applyFilter);
      input.addEventListener('change', applyFilter);
      input.addEventListener('blur', applyFilter);
    });

    if (toggle && body) {
      toggle.addEventListener('click', () => {
        const isOpen = root.classList.toggle('is-collapsed');
        toggle.setAttribute('aria-expanded', String(!isOpen));
      });
    }

    applyFilter();
  }

  async function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'absolute';
    helper.style.left = '-9999px';
    document.body.appendChild(helper);
    helper.select();
    document.execCommand('copy');
    document.body.removeChild(helper);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function flashShareButton(button, label) {
    button.classList.add('is-copied');
    const originalText = button.textContent;
    button.textContent = label;
    window.setTimeout(() => {
      button.classList.remove('is-copied');
      button.textContent = originalText;
    }, 1600);
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
