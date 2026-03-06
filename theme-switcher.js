const customElementName = 'theme-switcher'
const modesAttributeName = 'supported'
const prefixAttributeName = 'prefix'
const prefixAttributeDefault = 'theme-'
const osColorSchemes = { light: 'light', dark: 'dark' } // Standard operating system's modes need special mediaQuery treatment
const defaultStyles = `<style>button { font-size: inherit; cursor: pointer; display: inline-block; }</style>`
const markupFor = `<button onclick="this.getRootNode().host.setNextTheme()" part="button"><slot>theme</slot></button>`
const slotMarkupFor = (keyword) => `<button onclick="this.getRootNode().host.setTheme('${keyword}')" part="button ${keyword}"><slot name="${keyword}">${keyword}</slot></button>`
const template = document.createElement('template')

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

const getStyleElements = (themes) => {
  return themes.reduce((memo,theme) => {
      const found = document.querySelector(`link[rel=stylesheet][href*="${theme}"]`)

      if (found !== null) {
        memo[theme] = found
      } else {
        console.warn(`Stylesheet link for '${theme}' theme was not found in the document <head> section.`)
      }

      return memo
    }, {})
}

class ThemeSwitcher extends HTMLElement{
  constructor(){
    super()
    this.prefersDark = undefined
    this.localStorageKey = customElementName
  }

  styleElementMedia = (key, operation) => {
    if (!operation) return

    if (!Object.keys(this.linkedStylesElements).includes(key)) {
      console.warn(`Stylesheet link for '${key}' theme was not found in the document <head> section.`)
    }

    const el = this.linkedStylesElements[key]

    if (operation === 'enable') {
      el.media = 'all'
    }

    if (operation === 'disable') {
      el.media = 'not all'
    }

    if (operation === 'reset') {
      el.media = Object.values(osColorSchemes).includes(key) ? `(prefers-color-scheme: ${key})` : 'not all'
    }
  }

  useScheme = (selected) => {
    if (selected === undefined) {
      console.warn(`Attempt to use undefined theme canceled!`)
      return
    }

    if (selected === null) {
      delete this.bodyEl.dataset[toCamelCase(customElementName)]

      const all = Array.from(document.querySelectorAll(`link[rel=stylesheet][href*="${this.prefixString}"]`))

      all.map(el => {
        let query = 'not all'

        if (el.getAttribute('href').includes(osColorSchemes.light)) {
          query = `(prefers-color-scheme: ${osColorSchemes.light})`
        } else if (el.getAttribute('href').includes(osColorSchemes.dark)) {
          query = `(prefers-color-scheme: ${osColorSchemes.dark})`
        }

        el.media = query
      })
    } else {
      this.bodyEl.dataset[toCamelCase(customElementName)] = selected

      this.themes.map(theme => {
        if (theme === selected) {
          this.styleElementMedia(selected, 'enable')
        } else {
          this.styleElementMedia(theme, 'disable')
        }
      })
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

  setOverridePreference = (nextColorScheme) => {
    if (nextColorScheme === null) {
     console.warn('Discarded localStorage.setItem(null)')
     return
    }

    if (nextColorScheme === undefined) {
     console.warn('Attempted localStorage.setItem(undefined)')
     return
    }

    window.localStorage.setItem(this.localStorageKey, nextColorScheme)
  }

  removeOverridePreference = () => {
    window.localStorage.removeItem(this.localStorageKey)
  }

  setTheme = (newTheme) => {
    const overridePreference = this.getOverridePreference()

    if (newTheme === overridePreference) {
      this.removeOverridePreference()
      this.useScheme(null)
    } else {
      this.setOverridePreference(newTheme)
      this.useScheme(newTheme)
    }
  }

  setNextTheme = () => {
    const newTheme = this.getNextTheme()

    if (newTheme === undefined) {
      this.removeOverridePreference()
      this.useScheme(null)
    } else {
      this.useScheme(newTheme)
      this.setOverridePreference(newTheme)
    }
  }

  getNextTheme = () => {
    const systemPreference = this.getSystemPreference()
    const overridePreference = this.getOverridePreference()
    let current = overridePreference === null ? systemPreference : overridePreference

    if (!this.themes.includes(current)) {
      console.warn(`'${current}' theme not found in declared themes`)
      return undefined
    }

    while (current !==this.themesGenerator.next().value) {
      // Forwards the generator until persisted preference is found
    }

    // Now get the next theme in sequence
    return this.themesGenerator.next().value
  }

  usePrefered = () => {
    const systemPreference = this.getSystemPreference()
    const overridePreference = this.getOverridePreference()

    if (overridePreference === null) {
      this.useScheme(systemPreference)
    } else {
      this.useScheme(overridePreference)
    }
  }

  connectedCallback(){
    const customPrefix = this.getAttribute(prefixAttributeName)
    this.prefixString = customPrefix ? customPrefix : prefixAttributeDefault

    this.modesListString = this.getAttribute(modesAttributeName)

    if (!this.modesListString) {
      console.warn(`Missing '${modesAttributeName}' attribute`)
      return
    }

    this.declaredThemes = this.modesListString.split(' ')

    if (!Object.keys(osColorSchemes).every(key => this.declaredThemes.includes(key)) ) {
      console.warn(`The '${modesAttributeName}' attribute must include at least '${Object.values(osColorSchemes).join(' ')}' values`)
      return
    }

    // Query for stylesheet link tags of all declared themes
    this.linkedStylesElements = getStyleElements(this.declaredThemes)
    this.bodyEl = document.querySelector('body')
    // But only the actually linked themes should be taken into account
    this.themes =  Object.keys(this.linkedStylesElements)

    // Query inside of the webcomponent for elements with `slot` attribute
    // This will help with deciding what kind of markup should be rendered
    // either single button that cycles themes or one button for each theme
    const slotsUsed = this.querySelectorAll("[slot]").length === 0 ? false : true

    this.attachShadow({ mode: 'open'})

    this.themesGenerator  = repeatedArray(this.themes)

    template.innerHTML = `
    ${ defaultStyles }
    ${ slotsUsed ? this.themes.map(theme => slotMarkupFor(theme)).join('') : markupFor }`

    this.shadowRoot.appendChild(template.content.cloneNode(true))

    this.preferenceChangeHandler = (e) => {
      // TODO: In future handle changes to img src attributes here to match system color scheme
      void(e)
    }

    if (window.hasOwnProperty('matchMedia')) {
      this.prefersDark = window.matchMedia(`(prefers-color-scheme: ${osColorSchemes.dark})`)
      this.prefersDark.addEventListener('change', this.preferenceChangeHandler)
    }

    this.usePrefered()
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

window.customElements.define(customElementName, ThemeSwitcher)
