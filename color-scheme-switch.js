const template = document.createElement('template')

const multiSwitchMarkup = `
  <button onclick="this.getRootNode().host.setColorScheme('light')" part="button">
    <slot name="light">
      <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon" aria-labelledby="title">
        <title id="title">Toggle light color scheme</title>
        <path d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    </slot>
  </button>

  <button onclick="this.getRootNode().host.setColorScheme('dark')" part="button">
    <slot name="dark">
      <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon" aria-labelledby="title">
        <title id="title">Toggle dark color scheme</title>
        <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
      </svg>
    </slot>
  </button>

  <button onclick="this.getRootNode().host.setColorScheme('sepia')" part="button">
    <slot name="sepia">
      <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon" aria-labelledby="title">
        <title id="title">Toggle sepia color scheme</title>
        <path d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    </slot>
  </button>
`

const singleSwitchMarkup = `
  <button onclick="this.getRootNode().host.setNextColorScheme()" part="button">
    <slot>
      <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon" aria-labelledby="title">
        <title id="title">Cycle color schemes</title>
        <path d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" />
      </svg>
    </slot>
  </button>
`

const SYSTEM = 'system'
const LIGHT = 'light'
const DARK = 'dark'
const SEPIA = 'sepia'

const schemes = {
  [SYSTEM]: [
    '',
    'manifest-light.webmanifest',
    '/styles/light/icon.ico',
    '#ffffff',
    '(prefers-color-scheme: light)',
    '(prefers-color-scheme: dark)',
    'not all'
  ],
  [LIGHT]: [
    'light',
    'manifest-light.webmanifest',
    '/styles/light/icon.ico',
    '#ffffff',
    'all',
    'not all',
    'not all'
  ],
  [SEPIA]: [
    'sepia',
    'manifest-sepia.webmanifest',
    '/styles/sepia/icon.ico',
    '#c2ae95',
    'not all',
    'not all',
    'all'
  ],
  [DARK]: [
    'dark',
    'manifest-dark.webmanifest',
    '/styles/dark/icon.ico',
    '#000000',
    'not all',
    'all',
    'not all'
  ]
}

function* repeatedArray(arr) {
  let index = 0
  while (true) {
    yield arr[index++ % arr.length]
  }
}

const nextColorSchemeGenerator = repeatedArray(Object.keys(schemes))

const getElements = () => {
  return {
    elManifest: document.querySelector('link[rel="manifest"]'),
    elFavicon: document.querySelector('link[rel="icon"]'),
    elMetaThemeColor: document.querySelector('meta[name="theme-color"]'),
    elStyleLinkLight: document.querySelector('link[rel=stylesheet][href*="light"]'),
    elStyleLinkDark: document.querySelector('link[rel=stylesheet][href*="dark"]'),
    elStyleLinkSepia: document.querySelector('link[rel=stylesheet][href*="sepia"]'),
    elBody: document.querySelector('body')
  }
}

const useScheme = (key) => {
  const { elManifest, elFavicon, elMetaThemeColor, elStyleLinkLight, elStyleLinkDark, elStyleLinkSepia, elBody } = getElements()
  const [bodyDataColorScheme, manifestLink, faviconLink, metaThemeColor, mediaQueryLight, mediaQueryDark, mediaQuerySepia] = schemes[key]

  elBody.dataset.colorScheme = bodyDataColorScheme
  elBody.classList.add('animate-color-scheme-switch')

  elManifest.href = manifestLink
  elFavicon.href = faviconLink
  elMetaThemeColor.content = metaThemeColor

  if (elStyleLinkLight && elStyleLinkLight.media) {
    elStyleLinkLight.media = mediaQueryLight
  }
  if (elStyleLinkDark && elStyleLinkDark.media) {
    elStyleLinkDark.media = mediaQueryDark
  }
  if (elStyleLinkSepia && elStyleLinkSepia.media) {
    elStyleLinkSepia.media = mediaQuerySepia
  }
}

class ColorSchemeSwitch extends HTMLElement{

  constructor(){
    super()
    this.attachShadow({ mode: 'open'})

    this.isSingleVariant = this.getAttribute('variant') !== 'multi'


    // Override using global styles: `color-scheme-switch::part(button)`
    template.innerHTML = `
    <style>
      button {
        color: #444;
        background: none;
        border: none;
        cursor: pointer;
        padding: 1rem;
      }

      button svg {
        fill: currentColor;
      }

      svg.icon {
        min-height: 1rem;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    </style>
    <div class="color-scheme-switch">
    ${ this.isSingleVariant ? singleSwitchMarkup : multiSwitchMarkup  }
    </div>`

    this.shadowRoot.appendChild(template.content.cloneNode(true))
    this.localStorageKey = 'color-scheme'
    this.prefersDark = undefined
    this.preferenceChangeHandler = (e) => {
      // TODO: In future handle changes to img src attributes here to match system color scheme
      void(e)
    }
  }

  getSystemPreference = () => {
    if (window.hasOwnProperty('matchMedia')) {
      return this.prefersDark.matches ? DARK : SYSTEM
    }

    return SYSTEM
  }

  getOverridePreference = () => {
    const overridePreference = window.localStorage.getItem(this.localStorageKey)
    return overridePreference === null ? SYSTEM : overridePreference
  }

  setOverridePreference = (nextColorScheme) => {
    window.localStorage.setItem(this.localStorageKey, nextColorScheme)
  }

  removeOverridePreference = () => {
    window.localStorage.removeItem(this.localStorageKey)
  }

  setColorScheme = (forceColorScheme = undefined) => {
    const overridePreference = this.getOverridePreference()

    if (forceColorScheme === overridePreference) {
      this.removeOverridePreference()
      useScheme(SYSTEM)
    } else {
      this.setOverridePreference(forceColorScheme)
      useScheme(forceColorScheme)
    }
  }

  setNextColorScheme = () => {
    const newColorScheme = this.getNextColorScheme()
    useScheme(newColorScheme)
    this.setOverridePreference(newColorScheme)
  }

  getNextColorScheme = () => {
    const overridePreference = this.getOverridePreference()

    while (overridePreference !== nextColorSchemeGenerator.next().value) {
      // Forwards the generator until persisted preference is found
    }

    const maybeNextColorScheme = nextColorSchemeGenerator.next().value

    if (maybeNextColorScheme === SYSTEM) {
      return nextColorSchemeGenerator.next().value
    } else {
      return maybeNextColorScheme
    }
  }

  setPreferedColorScheme = () => {
    const systemPreference = this.getSystemPreference()
    const overridePreference = this.getOverridePreference()

    if (overridePreference === SYSTEM) {
      useScheme(systemPreference)
    } else {
      useScheme(overridePreference)
    }
  }

  connectedCallback(){
    if (window.hasOwnProperty('matchMedia')) {
      this.prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
      this.prefersDark.addEventListener('change', this.preferenceChangeHandler)
    }

    this.setPreferedColorScheme()
    this.render()
  }

  disconnectedCallback() {
    if (this.prefersDark instanceof MediaQueryList) {
      this.prefersDark.removeEventListener('change', this.preferenceChangeHandler)
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(
      `Attribute ${name} has changed from ${oldValue} to ${newValue}.`,
    );
  }

  render(){}
}

window.customElements.define('color-scheme-switch', ColorSchemeSwitch)
