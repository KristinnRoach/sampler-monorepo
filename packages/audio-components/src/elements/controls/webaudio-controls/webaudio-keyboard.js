/* WebAudio Keyboard Component - Extracted from WebAudio-Controls
 * Minimal version containing only the keyboard component and required dependencies
 */

if (window.customElements) {
  // Base widget class with essential functionality
  class WebAudioControlsWidget extends HTMLElement {
    constructor() {
      super();
      this.addEventListener('mousedown', this.pointerdown, { passive: false });
      this.addEventListener('touchstart', this.pointerdown, { passive: false });
      this.addEventListener('wheel', this.wheel, { passive: false });
      this.addEventListener('mouseover', this.pointerover);
      this.addEventListener('mouseout', this.pointerout);
      this.hover = this.drag = 0;

      this.basestyle = `
.webaudioctrl-tooltip{
  display:inline-block;
  position:absolute;
  margin:0 -1000px;
  z-index: 999;
  background:#eee;
  color:#000;
  border:1px solid #666;
  border-radius:4px;
  padding:5px 10px;
  text-align:center;
  left:0; top:0;
  font-size:11px;
  opacity:0;
  visibility:hidden;
}
`;
    }

    sendEvent(ev) {
      let event = document.createEvent('HTMLEvents');
      event.initEvent(ev, false, true);
      this.dispatchEvent(event);
    }

    getAttr(n, def) {
      let v = this.getAttribute(n);
      if (v == null) return def;
      switch (typeof def) {
        case 'number':
          if (v == 'true') return 1;
          v = +v;
          if (isNaN(v)) return 0;
          return v;
      }
      return v;
    }

    showtip(d) {
      // Simplified tooltip functionality
      if (this.ttframe) {
        this.ttframe.style.opacity = 0;
        this.ttframe.style.visibility = 'hidden';
      }
    }

    pointerover(e) {
      this.hover = 1;
      this.showtip(0.6);
    }

    pointerout(e) {
      this.hover = 0;
      this.showtip(0);
    }

    // Empty implementations for compatibility
    keydown(e) {}
    keyup(e) {}
    wheel(e) {}
    pointerdown(e) {}
  }

  // WebAudio Keyboard Component
  customElements.define(
    'webaudio-keyboard',
    class WebAudioKeyboard extends WebAudioControlsWidget {
      constructor() {
        super();
        // Optional keyboard event listeners - disabled by default
        // Can be enabled by setting the 'keyboard' attribute to 'true'
        if (this.getAttribute('keyboard') === 'true') {
          // Store bound references for proper cleanup
          this._boundKeydown = this.keydown.bind(this);
          this._boundKeyup = this.keyup.bind(this);
          document.addEventListener('keydown', this._boundKeydown);
          document.addEventListener('keyup', this._boundKeyup);
          this._keyboardEnabled = true;
        } else {
          this._keyboardEnabled = false;
        }
      }

      connectedCallback() {
        let root;
        if (this.attachShadow) root = this.attachShadow({ mode: 'open' });
        else root = this;

        root.innerHTML = `<style>
${this.basestyle}
:host{
  display:inline-block;
  position:relative;
  margin:0;
  padding:0;
  font-family: sans-serif;
  font-size: 11px;
}
.webaudio-keyboard-body{
  display:inline-block;
  margin:0;
  padding:0;
  vertical-align:bottom;
}
</style>
<canvas class='webaudio-keyboard-body' tabindex='1' touch-action='none'></canvas><div class='webaudioctrl-tooltip'></div>
`;

        this.elem = this.cv = root.childNodes[2];
        this.ttframe = root.childNodes[3];
        this.ctx = this.cv.getContext('2d');
        this._values = [];

        this.enable = this.getAttr('enable', 1);
        this._width = this.getAttr('width', 480);

        if (!this.hasOwnProperty('width'))
          Object.defineProperty(this, 'width', {
            get: () => this._width,
            set: (v) => {
              this._width = v;
              this.setupImage();
            },
          });

        this._height = this.getAttr('height', 128);
        if (!this.hasOwnProperty('height'))
          Object.defineProperty(this, 'height', {
            get: () => this._height,
            set: (v) => {
              this._height = v;
              this.setupImage();
            },
          });

        this._min = this.getAttr('min', 0);
        if (!this.hasOwnProperty('min'))
          Object.defineProperty(this, 'min', {
            get: () => this._min,
            set: (v) => {
              this._min = +v;
              this.redraw();
            },
          });

        this._keys = this.getAttr('keys', 25);
        if (!this.hasOwnProperty('keys'))
          Object.defineProperty(this, 'keys', {
            get: () => this._keys,
            set: (v) => {
              this._keys = +v;
              this.setupImage();
            },
          });

        this._colors = this.getAttr(
          'colors',
          '#222;#eee;#ccc;#333;#000;#e88;#c44;#c33;#800'
        );
        if (!this.hasOwnProperty('colors'))
          Object.defineProperty(this, 'colors', {
            get: () => this._colors,
            set: (v) => {
              this._colors = v;
              this.setupImage();
            },
          });

        this.press = 0;
        // Lower row (white keys) - matches your defaultKeymap lower notes
        this.keycodes1 = [
          'KeyZ',
          'KeyS',
          'KeyX',
          'KeyD',
          'KeyC',
          'KeyV',
          'KeyG',
          'KeyB',
          'KeyH',
          'KeyN',
          'KeyJ',
          'KeyM',
          'Comma',
          'KeyL',
          'Period',
          'Semicolon',
          'Slash',
        ];
        // Upper row (black keys offset +12) - matches your defaultKeymap upper notes
        this.keycodes2 = [
          'KeyQ',
          'Digit2',
          'KeyW',
          'Digit3',
          'KeyE',
          'KeyR',
          'Digit5',
          'KeyT',
          'Digit6',
          'KeyY',
          'Digit7',
          'KeyU',
          'KeyI',
          'Digit9',
          'KeyO',
          'Digit0',
          'KeyP',
          'BracketLeft',
          'Equal',
          'BracketRight',
        ];

        this.setupImage();
        this.digits = 0;
      }

      disconnectedCallback() {
        // Only remove listeners if they were added
        if (this._keyboardEnabled) {
          document.removeEventListener('keydown', this._boundKeydown);
          document.removeEventListener('keyup', this._boundKeyup);
        }
      }

      setupImage() {
        this.cv.style.width = this.width + 'px';
        this.cv.style.height = this.height + 'px';
        this.bheight = this.height * 0.55;

        this.kp = [
          0,
          7 / 12,
          1,
          (3 * 7) / 12,
          2,
          3,
          (6 * 7) / 12,
          4,
          (8 * 7) / 12,
          5,
          (10 * 7) / 12,
          6,
        ];
        this.kf = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
        this.ko = [
          0,
          0,
          (7 * 2) / 12 - 1,
          0,
          (7 * 4) / 12 - 2,
          (7 * 5) / 12 - 3,
          0,
          (7 * 7) / 12 - 4,
          0,
          (7 * 9) / 12 - 5,
          0,
          (7 * 11) / 12 - 6,
        ];
        this.kn = [0, 2, 4, 5, 7, 9, 11];

        this.coltab = this.colors.split(';');
        this.cv.width = this.width;
        this.cv.height = this.height;
        this.cv.style.width = this.width + 'px';
        this.cv.style.height = this.height + 'px';
        this.style.height = this.height + 'px';
        this.bheight = this.height * 0.55;
        this.max = this.min + this.keys - 1;
        this.dispvalues = [];
        this.valuesold = [];

        if (this.kf[this.min % 12]) --this.min;
        if (this.kf[this.max % 12]) ++this.max;
        this.redraw();
      }

      redraw() {
        function rrect(ctx, x, y, w, h, r, c1, c2) {
          if (c2) {
            let g = ctx.createLinearGradient(x, y, x + w, y);
            g.addColorStop(0, c1);
            g.addColorStop(1, c2);
            ctx.fillStyle = g;
          } else ctx.fillStyle = c1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + w, y);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y);
          ctx.fill();
        }

        this.ctx.fillStyle = this.coltab[0];
        this.ctx.fillRect(0, 0, this.width, this.height);

        let x0 = 7 * ((this.min / 12) | 0) + this.kp[this.min % 12];
        let x1 = 7 * ((this.max / 12) | 0) + this.kp[this.max % 12];
        let n = x1 - x0;
        this.wwidth = (this.width - 1) / (n + 1);
        this.bwidth = (this.wwidth * 7) / 12;
        let h2 = this.bheight;
        let r = Math.min(8, this.wwidth * 0.2);

        // Draw white keys
        for (let i = this.min, j = 0; i <= this.max; ++i) {
          if (this.kf[i % 12] == 0) {
            let x = this.wwidth * j++ + 1;
            if (this.dispvalues.indexOf(i) >= 0)
              rrect(
                this.ctx,
                x,
                1,
                this.wwidth - 1,
                this.height - 2,
                r,
                this.coltab[5],
                this.coltab[6]
              );
            else
              rrect(
                this.ctx,
                x,
                1,
                this.wwidth - 1,
                this.height - 2,
                r,
                this.coltab[1],
                this.coltab[2]
              );
          }
        }

        // Draw black keys
        r = Math.min(8, this.bwidth * 0.3);
        for (let i = this.min; i < this.max; ++i) {
          if (this.kf[i % 12]) {
            let x =
              this.wwidth * this.ko[this.min % 12] +
              this.bwidth * (i - this.min) +
              1;
            if (this.dispvalues.indexOf(i) >= 0)
              rrect(
                this.ctx,
                x,
                1,
                this.bwidth,
                h2,
                r,
                this.coltab[7],
                this.coltab[8]
              );
            else
              rrect(
                this.ctx,
                x,
                1,
                this.bwidth,
                h2,
                r,
                this.coltab[3],
                this.coltab[4]
              );
            this.ctx.strokeStyle = this.coltab[0];
            this.ctx.stroke();
          }
        }
      }

      _setValue(v) {
        if (this.step)
          v = Math.round((v - this.min) / this.step) * this.step + this.min;
        this._value = Math.min(this.max, Math.max(this.min, v));
        if (this._value != this.oldvalue) {
          this.oldvalue = this._value;
          this.redraw();
          this.showtip(0);
          return 1;
        }
        return 0;
      }

      setValue(v, f) {
        if (this._setValue(v) && f)
          this.sendEvent('input'), this.sendEvent('change');
      }

      wheel(e) {}

      keydown(e) {
        let m = Math.floor((this.min + 11) / 12) * 12;
        let k = this.keycodes1.indexOf(e.code);
        if (k < 0) {
          k = this.keycodes2.indexOf(e.code);
          if (k >= 0) k += 12;
        }
        if (k >= 0) {
          k += m;
          if (this.currentKey != k) {
            this.currentKey = k;
            this.setdispvalues(1, k);
            this.sendEventFromKey(1, k);
            this.setNote(1, k);
          }
        }
      }

      keyup(e) {
        let m = Math.floor((this.min + 11) / 12) * 12;
        let k = this.keycodes1.indexOf(e.code);
        if (k < 0) {
          k = this.keycodes2.indexOf(e.code);
          if (k >= 0) k += 12;
        }
        if (k >= 0) {
          k += m;
          this.currentKey = -1;
          this.setdispvalues(0, k);
          this.sendEventFromKey(0, k);
          this.setNote(0, k);
        }
      }

      pointerdown(ev) {
        this.cv.focus();
        if (this.enable) {
          ++this.press;
        }

        let pointermove = (ev) => {
          if (!this.enable) return;
          let r = this.getBoundingClientRect();
          let v = [],
            p;
          if (ev.touches) p = ev.targetTouches;
          else if (this.press) p = [ev];
          else p = [];
          if (p.length > 0) this.drag = 1;

          for (let i = 0; i < p.length; ++i) {
            let px = p[i].clientX - r.left;
            let py = p[i].clientY - r.top;
            let x, k, ko;
            if (py >= 0 && py < this.height) {
              if (py < this.bheight) {
                x = px - this.wwidth * this.ko[this.min % 12];
                k = this.min + ((x / this.bwidth) | 0);
              } else {
                k = (px / this.wwidth) | 0;
                ko = this.kp[this.min % 12];
                k += ko;
                k =
                  this.min +
                  ((k / 7) | 0) * 12 +
                  this.kn[k % 7] -
                  this.kn[ko % 7];
              }
              if (k >= this.min && k <= this.max) v.push(k);
            }
          }
          v.sort();
          this.values = v;
          this.sendevent();
          this.redraw();
        };

        let pointerup = (ev) => {
          if (this.enable) {
            if (ev.touches) this.press = ev.touches.length;
            else this.press = 0;
            pointermove(ev);
            this.sendevent();
            if (this.press == 0) {
              window.removeEventListener('mousemove', pointermove);
              window.removeEventListener('touchmove', pointermove, {
                passive: false,
              });
              window.removeEventListener('mouseup', pointerup);
              window.removeEventListener('touchend', pointerup);
              window.removeEventListener('touchcancel', pointerup);
              document.body.removeEventListener('touchstart', preventScroll, {
                passive: false,
              });
            }
            this.redraw();
          }
          this.drag = 0;
          ev.preventDefault();
        };

        let preventScroll = (ev) => {
          ev.preventDefault();
        };

        window.addEventListener('mousemove', pointermove);
        window.addEventListener('touchmove', pointermove, { passive: false });
        window.addEventListener('mouseup', pointerup);
        window.addEventListener('touchend', pointerup);
        window.addEventListener('touchcancel', pointerup);
        document.body.addEventListener('touchstart', preventScroll, {
          passive: false,
        });
        pointermove(ev);
        ev.preventDefault();
        ev.stopPropagation();
      }

      sendEventFromKey(s, k) {
        let ev = document.createEvent('HTMLEvents');
        ev.initEvent('keyboard', true, true);
        ev.note = [s, k];
        this.dispatchEvent(ev);
      }

      sendevent() {
        let notes = [];
        for (let i = 0, j = this.valuesold.length; i < j; ++i) {
          if (this.values.indexOf(this.valuesold[i]) < 0)
            notes.push([0, this.valuesold[i]]);
        }
        for (let i = 0, j = this.values.length; i < j; ++i) {
          if (this.valuesold.indexOf(this.values[i]) < 0)
            notes.push([1, this.values[i]]);
        }
        if (notes.length) {
          this.valuesold = this.values;
          for (let i = 0; i < notes.length; ++i) {
            this.setdispvalues(notes[i][0], notes[i][1]);
            let ev = document.createEvent('HTMLEvents');
            ev.initEvent('pointer', true, true);
            ev.note = notes[i];
            this.dispatchEvent(ev);
          }
        }
      }

      setdispvalues(state, note) {
        let n = this.dispvalues.indexOf(note);
        if (state) {
          if (n < 0) this.dispvalues.push(note);
        } else {
          if (n >= 0) this.dispvalues.splice(n, 1);
        }
      }

      setNote(state, note, actx, when) {
        const t = actx && when - actx.currentTime;
        if (t > 0) {
          setTimeout(() => {
            this.setNote(state, note);
          }, t * 1000);
        } else {
          this.setdispvalues(state, note);
          this.redraw();
        }
      }
    }
  );
}
