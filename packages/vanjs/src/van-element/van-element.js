import van from '../van.js';

// Short prop names because class props are not minified.
function define(name, element, options = { mode: 'open' }) {
  window.customElements.define(
    name,
    class extends HTMLElement {
      constructor() {
        super();
        // Attributes
        this.a = [];
        // Properties (added by kiddi)
        this.p = new Map();
      }

      setAttribute(name, value) {
        super.setAttribute(name, value);
        this.a[name] && (this.a[name].val = value);
      }

      connectedCallback() {
        let mount;
        van.add(
          options ? this.attachShadow(options) : this,
          element({
            attr: (i, v) =>
              (this.a[i] ??= van.state(this.getAttribute(i) ?? v)),

            prop: (i, v) => {
              if (!this.p.has(i)) {
                this.p.set(i, van.state(v));
              }
              return this.p.get(i);
            },

            mount: (newMount) => {
              let currentMount = mount;
              mount = () => {
                let currentDismount = currentMount?.();
                let newDismount = newMount();

                return () => {
                  currentDismount?.();
                  newDismount?.();
                };
              };
            },
            $this: this,
          })
        );
        // Dismount
        this.d = mount?.();
      }

      disconnectedCallback() {
        this.d?.();
      }

      // Public API for setting props
      setProp(name, value) {
        if (this.p.has(name)) {
          this.p.get(name).val = value;
        } else {
          this.p.set(name, van.state(value));
        }
        return this;
      }

      // Public API for getting prop values
      getProp(name) {
        return this.p.has(name) ? this.p.get(name).val : undefined;
      }
    }
  );
}

export { define };
