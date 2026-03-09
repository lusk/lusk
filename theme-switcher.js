const customElementName = 'theme-switcher'
const allowedAttrName = 'allowed'
const osColorSchemes = { light: 'light', dark: 'dark' } // Standard operating system's modes need special mediaQuery treatment

function* repeatedArray(arr) {
  let index = 0
  while (true) {
    yield arr[index++ % arr.length]
  }
}

function toCamelCase(str) {
  const parts = str.trim().toLowerCase().split('-')
  const firstPart = parts.shift()

  return firstPart + parts.map((str) =>
    str[0].toUpperCase().concat(str.slice(1))
  ).join('')
}

function themeFromDataset (el) {
  return el.dataset[toCamelCase(customElementName)]
}

class ThemeSwitcher extends HTMLButtonElement{
  // Changes to the following attributes trigger attributeChangedCallback
  static observedAttributes = [allowedAttrName]

  constructor(){
    super()
    this.debug = false
    this.prefersDark = undefined
    this.localStorageKey = customElementName
  }

  setLinkMedia = (el, selectedTheme) => {
    const linkTheme = themeFromDataset(el)
    const operation = selectedTheme === null ? 'reset' : selectedTheme === linkTheme ? 'enable' : 'disable'
    let query = undefined

    switch (operation) {
      case 'enable':
        query = 'all'
        break
      case 'disable':
        query = 'not all'
        break
      case 'reset':
        query = Object.values(osColorSchemes).includes(linkTheme) ? `(prefers-color-scheme: ${linkTheme})` : 'not all'
        break
      default:
        if (this.debug) console.debug('Invalid operation aborted.')
      return
    }

    el.media = query
  }

  useTheme = (selected) => {
    if (selected === undefined) {
      if (this.debug) console.debug(`Attempt to use undefined theme canceled!`)
      return
    }

    if (selected === null) {
      delete this.bodyEl.dataset[toCamelCase(customElementName)]
      this.themesLinks.map(el => this.setLinkMedia(el, null))
    } else {
      this.bodyEl.dataset[toCamelCase(customElementName)] = selected
      this.themesLinks.map(el => this.setLinkMedia(el, selected))
    }

    // Even if we're reseting to system default (in other words !selected is true)
    // we need to animate the change
    this.bodyEl.classList.add('animate-color-scheme-switch')
  }

  getSystemPreference = () => {
    if (window.hasOwnProperty('matchMedia')) {
      return this.prefersDark.matches ? osColorSchemes.dark : osColorSchemes.light
    }

    return null
  }

  getOverridePreference = () => {
    return window.localStorage.getItem(this.localStorageKey)
  }

  setOverridePreference = (nextTheme) => {
    if ([null, undefined].includes(nextTheme)) {
      if (this.debug) console.debug('Discarded localStorage.setItem attempt')
     return
    }

    window.localStorage.setItem(this.localStorageKey, nextTheme)
  }

  removeOverridePreference = () => {
    window.localStorage.removeItem(this.localStorageKey)
  }

  setTheme = (newTheme) => {
    const overridePreference = this.getOverridePreference()

    if (newTheme === overridePreference) {
      this.removeOverridePreference()
      this.useTheme(null)
    } else {
      this.setOverridePreference(newTheme)
      this.useTheme(newTheme)
    }
  }

  setNextTheme = () => {
    const newTheme = this.getNextTheme()

    if (newTheme === undefined) {
      this.removeOverridePreference()
      this.useTheme(null)
    } else {
      this.useTheme(newTheme)
      this.setOverridePreference(newTheme)
    }
  }

  getNextTheme = () => {
    const systemPreference = this.getSystemPreference()
    const overridePreference = this.getOverridePreference()
    let current = overridePreference === null ? systemPreference : overridePreference

    if (!this.allowedThemes.includes(current)) {
      if (this.debug) console.debug(`Preferred '${current}' theme not allowed. Falling back to OS system preference.`)

      return undefined
    }

    while (current !==this.themesGenerator.next().value) {
      // Forwards the generator until persisted preference is found
    }

    // Now get the next theme in sequence
    return this.themesGenerator.next().value
  }

  clickHandler = () => {
    if (this.allowedThemes.length > 1) {
      // More allowed themes means cycling through them
      this.setNextTheme()
    } else {
      // Single allowed theme means selecting it
      this.setTheme(this.allowedThemes[0])
    }
  }

  connectedCallback() {
    this.debug = this.getAttribute('debug') === null ? false : true
    this.themesLinks = Array.from(document.querySelectorAll(`link[rel=stylesheet][data-${customElementName}]`))
    this.themes = Array.from(new Set(this.themesLinks.map(el => themeFromDataset(el))))
    this.allowedThemes = this.themes

    let errorMessage
    const errorMarkup = '<em style="cursor: help;">Almost there!</em>'

    if (!this.themes.includes(osColorSchemes.light)) {
      errorMessage = `Could not find '<link rel="stylesheet" data-${customElementName}="${osColorSchemes.light}" ...' in <head> section`
      if (this.debug) {
        console.debug(errorMessage)
        this.innerHTML = errorMarkup
        this.title = errorMessage
      } else {
        this.innerHTML = null
      }

      return
    }

    if (!this.themes.includes(osColorSchemes.dark)) {
      errorMessage = `Could not find '<link rel="stylesheet" data-${customElementName}="${osColorSchemes.dark}" ...' in <head> section`
      if (this.debug) console.debug(errorMessage)
      return
    }

    // If allowed attribute is present restrict the list of linked themes to allowed ones only
    const allowedString = this.getAttribute(allowedAttrName)
    if (allowedString !== null) {
      this.allowedThemes = allowedString.split(' ').filter(key => this.themes.includes(key))
    }

    // Create endless sequence of themes to cycle through
    this.themesGenerator  = repeatedArray(this.allowedThemes)

    this.bodyEl = document.querySelector('body')

    this.addEventListener('click', this.clickHandler)
    this.addEventListener('touchstart', this.clickHandler)

    this.preferenceChangeHandler = (e) => void(e) // TODO: In future handle changes to img src attributes here to match system color scheme

    if (window.hasOwnProperty('matchMedia')) {
      this.prefersDark = window.matchMedia(`(prefers-color-scheme: ${osColorSchemes.dark})`)
      this.prefersDark.addEventListener('change', this.preferenceChangeHandler)
    }

    // Use persisted value if any
    this.useTheme(this.getOverridePreference())
    this.render()
  }

  disconnectedCallback() {
    if (this.prefersDark instanceof MediaQueryList) {
      this.prefersDark.removeEventListener('change', this.preferenceChangeHandler)
    }

    this.removeEventListener('click', this.clickHandler)
    this.removeEventListener('touchstart', this.clickHandler)
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this.debug) console.debug(`Attribute ${name} has changed from ${oldValue} to ${newValue}.`);
  }

  render(){}
}

window.customElements.define(customElementName, ThemeSwitcher, { extends: 'button' })
