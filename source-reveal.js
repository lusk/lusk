let self = class HTMLSourceRevealElement extends HTMLElement {
	constructor () {
		super();
    this.attachShadow({
      mode: 'open'
    });

    // <style>@import url("${ styleURL }")</style>
    this.shadowRoot.innerHTML = `
			<style>
			  :host { display: flex; flex-flow: column; }
				header { display: grid; gap: 1em; grid-template-columns: auto 1fr; align-items: baseline; }
				header h1 { opacity: 20%; }
        pre { background-color: #3e3e3e; padding: 1em; overflow: auto; }
			</style>
		`;
	}

  connectedCallback() {
		this.#render();
  }

  #indent(level) {
    const whitespace = [];
    for (let x = 0; x < level; x++) {
      whitespace.push(' ');
    }
    return whitespace.join('')
  }

  #isSelfClosing(tag) {
    return ['hr', 'br', 'img', 'input', 'source'].includes(tag)
  }

	#render () {
		if (this.children.length === 0) {
			return;
    }

    this.silent = this.hasAttribute("silent");
    this.code = Array.from(this.children).map(el => el.outerHTML ?? el.textContent).map(codeBlock => {
      return codeBlock.split("\n").reduce((memo, val, index, arr) => {
        const trimmed = val.trim()

        if (trimmed.length === 0) {
          memo.wasLastLineEmpty = true
          memo.output = memo.output + "\n"
          return memo
        }

        const matches = trimmed.match(/<([^\/]*?)[\s|>]/g) ?? []
        const tagNames = matches.map(m => m.replaceAll('<', '').replaceAll(' ', '').replaceAll('>', ''))
        console.debug("tagNames", tagNames)

        // Line has no opening or closing tags
        if (tagNames.length === 0 && !trimmed.includes('</')) {
          memo.output = memo.output + this.#indent(memo.level) + trimmed + "\n"
          return memo
        }

        // A line begins with closing tag
        if (trimmed.startsWith('</')) {
          memo.level = memo.level-1
          memo.output = memo.output + this.#indent(memo.level) + trimmed + "\n"
          return memo
        }

        // Line has only closing tag and no opening tags
        if (trimmed.includes('</') && tagNames.length === 0) {
          memo.output = memo.output + this.#indent(memo.level) + trimmed + "\n"
          memo.level = memo.level - 1
          return memo
        }

        if (trimmed.includes('</')) {
          if (tagNames.every(tag => trimmed.includes(`</${tag}`) || this.#isSelfClosing(tag))) {
            // Line closes every opened tag
            memo.output = memo.output + this.#indent(memo.level) + trimmed + "\n"
          } else {
            // Line closes some previously opened tag
            memo.output = memo.output + this.#indent(memo.level) + trimmed + "\n"
            memo.level = memo.level - 1
          }

          return memo
        }

        // Line only has self-losing tags
        if (tagNames.every(tag => this.#isSelfClosing(tag))) {
          memo.output = memo.output + this.#indent(memo.level) + trimmed + "\n"
          return memo
        }

        memo.output = memo.output + this.#indent(memo.level) + trimmed + "\n"
        memo.level = memo.level+1
        return memo
      }, { level: 0, wasLastLineEmpty: false, output: ''}).output
    }).join('')

    let wrapper = document.createElement('slot');
    let header = document.createElement('header');
    let pre
    let code

    if (!this.silent) {
      pre = document.createElement("pre");
      code = document.createElement("code");
      pre.classList.add("language-html","source-reveal");
      code.textContent = this.code;
      pre.append(code);
    }

    // Turns id="text__some_text" into "<h1>Text, Some text</h1>"
    const parts = `${this.getAttribute("id")}`.split('__').map(part => part[0].toLocaleUpperCase() + part.substring(1).toLocaleLowerCase().replaceAll('_', ' '))
    header.innerHTML = `<h1>${parts[0]}, ${parts[1]}</h1><a href="#top">top</a>`

    this.shadowRoot.appendChild(header);
    this.shadowRoot.appendChild(wrapper);

    if (!this.silent) {
      this.shadowRoot.appendChild(pre);
    }
	}
}

customElements.define("source-reveal", self);

export default self;
