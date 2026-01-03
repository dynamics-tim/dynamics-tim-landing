(function () {
  const globalScope = typeof window !== 'undefined' ? window : null;
  if (globalScope) {
    globalScope.__consentReady = false;
  }

  const STORAGE_KEY = 'dynamicsTimConsent';
  const VERSION = '2024-09-22';
  const DEFAULT_PREFERENCES = {
    essential: true,
    analytics: false,
    marketing: false,
    embeds: false
  };
  const CATEGORIES = [
    {
      key: 'essential',
      label: 'Essentiell',
      description: 'Technisch notwendige Funktionen für die Bereitstellung dieser Website. Kann nicht deaktiviert werden.',
      locked: true
    },
    {
      key: 'analytics',
      label: 'Analytics',
      description: 'Optionales Tracking zur Reichweiten- und Performance-Messung. Wird nur nach Zustimmung geladen.',
      locked: false
    },
    {
      key: 'marketing',
      label: 'Marketing',
      description: 'Marketing- und Remarketing-Technologien (z. B. Werbenetzwerke).',
      locked: false
    },
    {
      key: 'embeds',
      label: 'Embeds',
      description: 'Externe Inhalte wie Karten, Videos oder Termin-Widgets.',
      locked: false
    }
  ];

  const state = {
    consent: loadConsentState(),
    banner: null,
    backdrop: null,
    modal: null,
    form: null,
    executeMap: new Map(),
    placeholderMap: new Map(),
    observer: null
  };

  function loadConsentState() {
    const fallback = {
      version: VERSION,
      preferences: { ...DEFAULT_PREFERENCES },
      timestamp: null,
      method: null
    };

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return fallback;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== VERSION) {
        return fallback;
      }
      return {
        version: VERSION,
        preferences: { ...DEFAULT_PREFERENCES, ...(parsed.preferences || {}) },
        timestamp: parsed.timestamp || null,
        method: parsed.method || null
      };
    } catch (error) {
      console.warn('[consent] Konnte gespeicherten Zustand nicht lesen:', error);
      return fallback;
    }
  }

  function persistConsent(preferences, method) {
    state.consent = {
      version: VERSION,
      preferences: { ...DEFAULT_PREFERENCES, ...preferences },
      timestamp: new Date().toISOString(),
      method: method || 'save'
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.consent));
    } catch (error) {
      console.warn('[consent] Konnte Zustand nicht speichern:', error);
    }
  }

  function applyConsent(preferences) {
    const applied = { ...DEFAULT_PREFERENCES, ...preferences };
    document.documentElement.setAttribute('data-consent-version', VERSION);
    Object.entries(applied).forEach(([key, value]) => {
      const status = value ? 'granted' : 'denied';
      document.documentElement.setAttribute(`data-consent-${key}`, status);
    });
    processScripts(applied);
    processEmbeds(applied);
  }

  function ensureUI() {
    if (state.banner) {
      return;
    }

    const layer = document.createElement('div');
    layer.className = 'consent-layer';

    const banner = document.createElement('div');
    banner.className = 'consent-banner consent-hidden';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-label', 'Datenschutzeinstellungen');

    banner.innerHTML = `
      <div>
        <h2 class="consent-banner__title">Datenschutz & Einwilligungen</h2>
        <p class="consent-banner__text">
          Wir verwenden ausschließlich technisch notwendige Technologien sowie – nach Ihrer Einwilligung – optionale Dienste für Analytics, Marketing und eingebettete Inhalte. Sie können Ihre Wahl jederzeit anpassen.
        </p>
      </div>
      <div class="consent-actions">
        <button type="button" class="consent-btn consent-btn--primary" data-action="accept-all">Alle akzeptieren</button>
        <button type="button" class="consent-btn consent-btn--primary" data-action="reject-all">Alle ablehnen</button>
        <button type="button" class="consent-btn consent-btn--ghost" data-action="open-settings">Einstellungen</button>
      </div>
    `;

    const backdrop = document.createElement('div');
    backdrop.className = 'consent-backdrop consent-hidden';
    backdrop.setAttribute('role', 'presentation');

    const modal = document.createElement('div');
    modal.className = 'consent-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'consent-modal-title');
    modal.innerHTML = buildModalMarkup();

    backdrop.appendChild(modal);
    layer.appendChild(banner);
    layer.appendChild(backdrop);
    document.body.appendChild(layer);

    state.banner = banner;
    state.backdrop = backdrop;
    state.modal = modal;
    state.form = modal.querySelector('form');

    bindUIEvents();
  }

  function buildModalMarkup() {
    const categoryMarkup = CATEGORIES.map((category) => {
      const lockNotice = category.locked ? ' (erforderlich)' : '';
      const disabledAttr = category.locked ? ' disabled' : '';
      const aria = category.locked ? " aria-disabled='true'" : '';
      return `
        <li class="consent-category">
          <input
            type="checkbox"
            id="consent-toggle-${category.key}"
            name="consent-${category.key}"
            data-category="${category.key}"
            ${category.locked ? ' checked' : ''}
            ${disabledAttr}
            ${aria}
          />
          <div class="consent-category__content">
            <label class="consent-category__title" for="consent-toggle-${category.key}">
              ${category.label}${lockNotice}
            </label>
            <p class="consent-category__description">${category.description}</p>
          </div>
        </li>
      `;
    }).join('');

    return `
      <div class="consent-modal__header">
        <div>
          <h2 class="consent-modal__title" id="consent-modal-title">Datenschutzeinstellungen</h2>
          <p class="consent-banner__text">
            Passen Sie ein, welche optionalen Dienste wir verwenden dürfen. Essentielle Technologien sind für den Betrieb zwingend erforderlich.
          </p>
        </div>
        <button type="button" class="consent-btn consent-btn--ghost" data-action="close-modal">Schließen</button>
      </div>
      <form class="consent-modal__body" novalidate>
        <ul class="consent-category-list">
          ${categoryMarkup}
        </ul>
        <div class="consent-modal__footer">
          <button type="button" class="consent-btn consent-btn--primary" data-action="modal-accept-all">Alle akzeptieren</button>
          <button type="button" class="consent-btn consent-btn--primary" data-action="modal-reject-all">Alle ablehnen</button>
          <button type="submit" class="consent-btn consent-btn--ghost" data-action="modal-save">Auswahl speichern</button>
        </div>
      </form>
    `;
  }

  function bindUIEvents() {
    state.banner.addEventListener('click', (event) => {
      const action = event.target instanceof HTMLElement ? event.target.dataset.action : null;
      if (!action) {
        return;
      }
      handleAction(action);
    });

    state.form.addEventListener('submit', (event) => {
      event.preventDefault();
      saveFromForm();
    });

    state.modal.addEventListener('click', (event) => {
      const action = event.target instanceof HTMLElement ? event.target.dataset.action : null;
      if (!action) {
        return;
      }
      handleAction(action);
    });

    state.backdrop.addEventListener('click', (event) => {
      if (event.target === state.backdrop) {
        closeModal();
      }
    });

    document.addEventListener('click', (event) => {
      const target = event.target instanceof HTMLElement ? event.target.closest('[data-consent-manage]') : null;
      if (target) {
        event.preventDefault();
        openModal();
      }
    });
  }

  function handleAction(action) {
    switch (action) {
      case 'accept-all':
      case 'modal-accept-all':
        applyDecision(allPreferences(true), 'accept-all');
        break;
      case 'reject-all':
      case 'modal-reject-all':
        applyDecision(allPreferences(false), 'reject-all');
        break;
      case 'open-settings':
        openModal();
        break;
      case 'close-modal':
        closeModal();
        break;
      default:
        break;
    }
  }

  function allPreferences(value) {
    return {
      essential: true,
      analytics: value,
      marketing: value,
      embeds: value
    };
  }

  function saveFromForm() {
    const formData = new FormData(state.form);
    const preferences = { ...DEFAULT_PREFERENCES };
    CATEGORIES.forEach(({ key, locked }) => {
      if (locked) {
        preferences[key] = true;
      } else {
        preferences[key] = formData.get(`consent-${key}`) === 'on';
      }
    });
    applyDecision(preferences, 'granular');
  }

  function applyDecision(preferences, method) {
    persistConsent(preferences, method);
    applyConsent(state.consent.preferences);
    updateFormControls();
    hideBanner();
    closeModal();
  }

  function updateFormControls() {
    if (!state.form) {
      return;
    }
    const preferences = state.consent.preferences;
    const fields = state.form.querySelectorAll('input[data-category]');
    fields.forEach((input) => {
      const category = input.dataset.category;
      if (!category) {
        return;
      }
      input.checked = Boolean(preferences[category]);
    });
  }

  function showBanner() {
    state.banner.classList.remove('consent-hidden');
  }

  function hideBanner() {
    state.banner.classList.add('consent-hidden');
  }

  function openModal() {
    updateFormControls();
    state.backdrop.classList.remove('consent-hidden');
    const firstToggle = state.form.querySelector('input[data-category]:not([disabled])');
    if (firstToggle) {
      firstToggle.focus();
    }
  }

  function closeModal() {
    state.backdrop.classList.add('consent-hidden');
  }

  function processScripts(preferences) {
    const scripts = document.querySelectorAll('script[data-consent]');
    scripts.forEach((script) => {
      const category = (script.dataset.consent || '').toLowerCase();
      if (!category || !(category in preferences)) {
        return;
      }
      const allowed = Boolean(preferences[category]);
      const hasExecuted = state.executeMap.has(script);

      if (allowed && !hasExecuted) {
        const clone = activateScript(script);
        if (clone) {
          state.executeMap.set(script, clone);
        }
      } else if (!allowed && hasExecuted) {
        const attached = state.executeMap.get(script);
        if (attached && attached.parentNode) {
          attached.parentNode.removeChild(attached);
        }
        state.executeMap.delete(script);
      }
    });
  }

  function activateScript(source) {
    const target = (source.dataset.target || 'body').toLowerCase();
    const appendTarget = target === 'head' ? document.head : document.body;
    if (!appendTarget) {
      return null;
    }

    const script = document.createElement('script');
    script.type = source.dataset.type || 'text/javascript';

    if (source.dataset.src) {
      script.src = source.dataset.src;
    } else {
      script.textContent = source.textContent || '';
    }

    if (source.dataset.attrAsync !== undefined) {
      script.async = true;
    }
    if (source.dataset.attrDefer !== undefined) {
      script.defer = true;
    }
    if (source.dataset.attrReferrerpolicy) {
      script.setAttribute('referrerpolicy', source.dataset.attrReferrerpolicy);
    }
    if (source.dataset.attrCrossorigin) {
      script.setAttribute('crossorigin', source.dataset.attrCrossorigin);
    }
    if (source.dataset.attrIntegrity) {
      script.setAttribute('integrity', source.dataset.attrIntegrity);
    }
    if (source.dataset.goatcounter) {
      script.setAttribute('data-goatcounter', source.dataset.goatcounter);
    }

    appendTarget.appendChild(script);
    return script;
  }

  function processEmbeds(preferences) {
    const embeddingNodes = document.querySelectorAll('[data-consent][data-src]');
    embeddingNodes.forEach((node) => {
      const category = (node.dataset.consent || '').toLowerCase();
      if (!category || !(category in preferences)) {
        return;
      }
      const allowed = Boolean(preferences[category]);
      if (node.tagName === 'IFRAME') {
        handleIframe(node, allowed, category);
      }
    });
  }

  function handleIframe(iframe, allowed, category) {
    const placeholderId = iframe.dataset.placeholderId;
    const currentPlaceholder = placeholderId ? state.placeholderMap.get(placeholderId) : null;

    if (allowed) {
      if (currentPlaceholder) {
        currentPlaceholder.remove();
        state.placeholderMap.delete(placeholderId);
        iframe.removeAttribute('data-placeholder-id');
      }
      if (!iframe.src && iframe.dataset.src) {
        iframe.src = iframe.dataset.src;
      }
      iframe.style.setProperty('display', iframe.dataset.originalDisplay || '');
      return;
    }

    if (iframe.src) {
      iframe.dataset.src = iframe.dataset.src || iframe.src;
      iframe.removeAttribute('src');
    }
    if (!iframe.dataset.originalDisplay) {
      const style = window.getComputedStyle(iframe);
      iframe.dataset.originalDisplay = style.display === 'none' ? '' : style.display;
    }
    iframe.style.setProperty('display', 'none');

    if (!currentPlaceholder) {
      const placeholder = createPlaceholder(category);
      const id = `consent-placeholder-${Math.random().toString(36).slice(2, 9)}`;
      placeholder.dataset.consentCategory = category;
      placeholder.querySelector('button').addEventListener('click', () => openModal());
      state.placeholderMap.set(id, placeholder);
      iframe.dataset.placeholderId = id;
      iframe.insertAdjacentElement('beforebegin', placeholder);
    }
  }

  function createPlaceholder(category) {
    const container = document.createElement('div');
    container.className = 'consent-placeholder';
    container.innerHTML = `
      <div>Die Einbettung aus der Kategorie "${category}" ist derzeit deaktiviert.</div>
      <button type="button" class="consent-placeholder__button" data-action="open-settings">
        Zum Aktivieren zustimmen
      </button>
    `;
    return container;
  }

  function initMutationObserver() {
    if (state.observer) {
      return;
    }
    state.observer = new MutationObserver((mutations) => {
      const preferences = state.consent.preferences;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) {
            return;
          }
          if (node.tagName === 'SCRIPT' && node.dataset.consent) {
            processScripts(preferences);
          }
          if (node.querySelectorAll) {
            const scripts = node.querySelectorAll('script[data-consent]');
            if (scripts.length > 0) {
              processScripts(preferences);
            }
            const embeds = node.querySelectorAll('[data-consent][data-src]');
            if (embeds.length > 0) {
              processEmbeds(preferences);
            }
          }
        });
      });
    });

    state.observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function initialize() {
    ensureUI();
    applyConsent(state.consent.preferences);
    updateFormControls();

    if (!state.consent.timestamp) {
      showBanner();
    } else {
      hideBanner();
    }

    initMutationObserver();

    if (globalScope) {
      globalScope.__consentReady = true;
      globalScope.dispatchEvent(new CustomEvent('consent:ready'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();

