export class ToggleButton extends HTMLElement {
  static observedAttributes = ['active', 'disabled', 'label-on', 'label-off'];

  #active: boolean = false;
  #disabled: boolean = false;
  #labelOn: string = 'On';
  #labelOff: string = 'Off';
  button: HTMLButtonElement | null = null;

  constructor() {
    super();

    // Create button element
    this.button = document.createElement('button');
    this.appendChild(this.button);

    // Set up event listener
    this.button.addEventListener('click', this.toggle.bind(this));
  }

  connectedCallback(): void {
    // Initial render
    this.updateButtonState();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    if (oldValue === newValue) return;

    switch (name) {
      case 'active':
        this.#active = newValue !== null;
        break;
      case 'disabled':
        this.#disabled = newValue !== null;
        break;
      case 'label-on':
        this.#labelOn = newValue || 'On';
        break;
      case 'label-off':
        this.#labelOff = newValue || 'Off';
        break;
    }

    this.updateButtonState();
  }

  toggle(event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    if (this.#disabled) return;

    this.#active = !this.#active;

    if (this.#active) {
      this.setAttribute('active', '');
    } else {
      this.removeAttribute('active');
    }

    this.updateButtonState();

    // Dispatch custom event
    this.dispatchEvent(
      new CustomEvent('toggle', {
        bubbles: true,
        detail: { active: this.#active },
      })
    );
  }

  updateButtonState(): void {
    if (!this.button) return;

    this.button.textContent = this.#active ? this.#labelOn : this.#labelOff;
    this.button.disabled = this.#disabled;
    this.button.classList.toggle('active', this.#active);
  }

  // Public API
  get active(): boolean {
    return this.#active;
  }

  set active(value: boolean) {
    if (value === this.#active) return;

    if (value) {
      this.setAttribute('active', '');
    } else {
      this.removeAttribute('active');
    }
  }

  get disabled(): boolean {
    return this.#disabled;
  }

  set disabled(value: boolean) {
    if (value === this.#disabled) return;

    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }
}

customElements.define('toggle-button', ToggleButton);

declare global {
  interface HTMLElementTagNameMap {
    'toggle-button': ToggleButton;
  }
}
