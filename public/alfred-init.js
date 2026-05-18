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

  const topbar = document.createElement('div')
  topbar.className = 'alfred-widget-topbar'
  topbar.innerHTML = '<strong>Alfred • Concierge</strong>'

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

  const openPanel = () => {
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
  closeBtn.addEventListener('click', closePanel)

  document.body.appendChild(launcher)
  document.body.appendChild(panel)
})()
