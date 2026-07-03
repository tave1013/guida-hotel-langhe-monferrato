(() => {
  if (window.__alfredWidgetLoaded) return
  window.__alfredWidgetLoaded = true

  const currentScript = document.currentScript
  const scriptUrl = currentScript && currentScript.src ? new URL(currentScript.src) : null
  const defaultBaseUrl = scriptUrl ? scriptUrl.origin : window.location.origin

  const config = {
    baseUrl: defaultBaseUrl,
    chatPath: '/alfred-chat',
    avatarUrl: `${defaultBaseUrl}/Alfred.webp`,
    welcomeText:
      "Benvenuto. Sono Alfred, il concierge virtuale basato su intelligenza artificiale dell'Hotel Langhe & Monferrato. Posso aiutarti con camere, servizi e consigli sul territorio, con piacere e discrezione.",
    welcomeDelayMs: 20000,
    positionBottom: '20px',
    positionRight: '20px',
    zIndex: 9999,
    ...window.AlfredWidgetConfig,
  }

  const style = document.createElement('style')
  style.textContent = `
    .alfred-widget-launcher {
      position: fixed;
      right: ${config.positionRight};
      bottom: ${config.positionBottom};
      width: 64px;
      height: 64px;
      border-radius: 999px;
      border: 1px solid rgba(216, 196, 170, 0.9);
      background: #fff;
      box-shadow: 0 12px 26px rgba(30,17,10,0.24);
      z-index: ${config.zIndex};
      cursor: pointer;
      overflow: hidden;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .alfred-widget-launcher:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 30px rgba(30,17,10,0.28);
    }
    .alfred-widget-launcher img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .alfred-widget-panel {
      position: fixed;
      right: ${config.positionRight};
      bottom: calc(${config.positionBottom} + 74px);
      width: min(420px, calc(100vw - 24px));
      height: min(680px, calc(100dvh - 110px));
      border-radius: 18px;
      overflow: hidden;
      background: #fff;
      border: 1px solid rgba(216, 196, 170, 0.9);
      box-shadow: 0 20px 54px rgba(30,17,10,0.32);
      z-index: ${config.zIndex};
      opacity: 0;
      transform: translateY(18px);
      pointer-events: none;
      transition: opacity .28s ease, transform .28s ease;
    }
    .alfred-widget-bubble {
      position: fixed;
      right: calc(${config.positionRight} + 4px);
      bottom: calc(${config.positionBottom} + 80px);
      width: min(320px, calc(100vw - 28px));
      background: #fff;
      border: 1px solid rgba(216, 196, 170, 0.9);
      box-shadow: 0 14px 30px rgba(30,17,10,0.16);
      border-radius: 14px;
      z-index: ${config.zIndex};
      font-family: Arial, sans-serif;
      color: #3b2a1b;
      font-size: 14px;
      line-height: 1.45;
      padding: 12px 14px 12px 12px;
      opacity: 0;
      transform: translateY(8px) scale(0.98);
      pointer-events: none;
      transition: opacity .28s ease, transform .28s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .alfred-widget-bubble::after {
      content: '';
      position: absolute;
      right: 26px;
      bottom: -8px;
      width: 14px;
      height: 14px;
      background: #fff;
      border-right: 1px solid rgba(216, 196, 170, 0.9);
      border-bottom: 1px solid rgba(216, 196, 170, 0.9);
      transform: rotate(45deg);
    }
    .alfred-widget-bubble.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
    .alfred-widget-bubble-close {
      position: absolute;
      top: 6px;
      right: 7px;
      width: 18px;
      height: 18px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #8e8e8e;
      cursor: pointer;
      line-height: 1;
      font-size: 14px;
      padding: 0;
    }
    .alfred-widget-bubble-text {
      padding-right: 14px;
    }
    .alfred-widget-panel.open {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    .alfred-widget-topbar {
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 0 12px;
      background: linear-gradient(180deg, #f8f2e8 0%, #f1e7d9 100%);
      border-bottom: 1px solid rgba(216, 196, 170, 0.9);
      font-family: Arial, sans-serif;
      color: #3a2b1d;
      font-size: 13px;
    }
    .alfred-widget-close {
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      cursor: pointer;
      background: rgba(108, 74, 47, 0.12);
      color: #4a3422;
      font-size: 18px;
      line-height: 1;
    }
    .alfred-widget-frame {
      width: 100%;
      height: calc(100% - 42px);
      border: 0;
      display: block;
      background: #f7f1e8;
    }
    @media (max-width: 640px) {
      .alfred-widget-launcher {
        right: 14px;
        bottom: 14px;
        width: 58px;
        height: 58px;
      }
      .alfred-widget-bubble {
        right: 12px;
        left: 12px;
        width: auto;
        bottom: 84px;
      }
      .alfred-widget-bubble::after {
        right: 34px;
      }
      .alfred-widget-panel {
        right: 12px;
        left: 12px;
        width: auto;
        bottom: 82px;
        height: min(76dvh, 620px);
      }
    }
  `

  document.head.appendChild(style)

  const launcher = document.createElement('button')
  launcher.type = 'button'
  launcher.className = 'alfred-widget-launcher'
  launcher.setAttribute('aria-label', 'Apri chat Alfred')

  const avatar = document.createElement('img')
  avatar.src = config.avatarUrl
  avatar.alt = 'Alfred'
  launcher.appendChild(avatar)

  const panel = document.createElement('section')
  panel.className = 'alfred-widget-panel'

  const bubble = document.createElement('aside')
  bubble.className = 'alfred-widget-bubble'
  bubble.setAttribute('role', 'button')
  bubble.setAttribute('tabindex', '0')
  bubble.setAttribute('aria-label', 'Apri chat Alfred')

  const bubbleText = document.createElement('div')
  bubbleText.className = 'alfred-widget-bubble-text'
  bubbleText.textContent = config.welcomeText

  const bubbleCloseBtn = document.createElement('button')
  bubbleCloseBtn.type = 'button'
  bubbleCloseBtn.className = 'alfred-widget-bubble-close'
  bubbleCloseBtn.setAttribute('aria-label', 'Chiudi messaggio di benvenuto')
  bubbleCloseBtn.innerHTML = '×'

  bubble.appendChild(bubbleText)
  bubble.appendChild(bubbleCloseBtn)

  const topbar = document.createElement('div')
  topbar.className = 'alfred-widget-topbar'
  topbar.innerHTML = '<strong>Alfred • Assistente AI</strong>'

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'alfred-widget-close'
  closeBtn.setAttribute('aria-label', 'Chiudi chat Alfred')
  closeBtn.innerHTML = '×'

  const frame = document.createElement('iframe')
  frame.className = 'alfred-widget-frame'
  frame.title = 'Alfred Chat Widget'
  frame.allow = 'clipboard-read; clipboard-write'
  frame.src = `${config.baseUrl}${config.chatPath}?embed=1`

  topbar.appendChild(closeBtn)
  panel.appendChild(topbar)
  panel.appendChild(frame)

  const dismissStorageKey = 'alfred_widget_bubble_dismissed_date'
  const getTodayToken = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const getDismissedForToday = () => {
    try {
      return localStorage.getItem(dismissStorageKey) === getTodayToken()
    } catch {
      return false
    }
  }

  const setDismissedForToday = () => {
    try {
      localStorage.setItem(dismissStorageKey, getTodayToken())
    } catch {
      // noop
    }
  }

  const hideBubble = () => {
    bubble.classList.remove('open')
  }

  const showBubble = () => {
    if (panel.classList.contains('open')) return
    bubble.classList.add('open')
  }

  const openPanel = () => {
    setDismissedForToday()
    hideBubble()
    panel.classList.add('open')
    launcher.style.opacity = '0'
    launcher.style.pointerEvents = 'none'
  }

  const closePanel = () => {
    panel.classList.remove('open')
    launcher.style.opacity = '1'
    launcher.style.pointerEvents = 'auto'
  }

  launcher.addEventListener('click', openPanel)
  bubble.addEventListener('click', openPanel)
  bubble.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openPanel()
    }
  })
  bubbleCloseBtn.addEventListener('click', (event) => {
    event.stopPropagation()
    setDismissedForToday()
    hideBubble()
  })
  closeBtn.addEventListener('click', closePanel)

  document.body.appendChild(launcher)
  document.body.appendChild(bubble)
  document.body.appendChild(panel)

  if (!getDismissedForToday()) {
    window.setTimeout(() => {
      if (!getDismissedForToday()) {
        showBubble()
      }
    }, config.welcomeDelayMs)
  }

  // ── Lightbox full-screen handler ──────────────────────────────────────────
  // When Alfred opens a lightbox it sends postMessage to expand the iframe.
  const PANEL_ORIG = {
    right: panel.style.right,
    bottom: panel.style.bottom,
    width: panel.style.width,
    height: panel.style.height,
    borderRadius: panel.style.borderRadius,
    zIndex: panel.style.zIndex,
  }

  window.addEventListener('message', (event) => {
    if (!event.data || typeof event.data.type !== 'string') return
    if (event.data.type === 'alfred-lightbox-open') {
      panel.style.right = '0'
      panel.style.bottom = '0'
      panel.style.left = '0'
      panel.style.top = '0'
      panel.style.width = '100vw'
      panel.style.height = '100dvh'
      panel.style.borderRadius = '0'
      panel.style.zIndex = String(Number(config.zIndex) + 100)
      panel.style.transition = 'none'
    } else if (event.data.type === 'alfred-lightbox-close') {
      panel.style.right = ''
      panel.style.bottom = ''
      panel.style.left = ''
      panel.style.top = ''
      panel.style.width = ''
      panel.style.height = ''
      panel.style.borderRadius = ''
      panel.style.zIndex = ''
      panel.style.transition = ''
    } else if (event.data.type === 'alfred-booking-open' && typeof event.data.url === 'string') {
      closePanel()
      window.location.href = event.data.url
    } else if (event.data.type === 'alfred-close-panel') {
      closePanel()
    }
  })
})()
