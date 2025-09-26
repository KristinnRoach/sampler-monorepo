import 'solid-js';
import { KnobElement } from '@repo/audio-components';
declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      // Sampler core
      'sampler-element': any;

      // Envelope components
      'envelope-switcher': any;
      'envelope-display': any;

      // Sample controls
      'record-button': any;
      'load-button': any;
      'save-button': any;
      'input-select': any;

      // Knob components
      'knob-element': KnobElement;
      'volume-knob': any;
      'dry-wet-knob': any;
      'feedback-knob': any;
      'drive-knob': any;
      'clipping-knob': any;
      'glide-knob': any;
      'feedback-pitch-knob': any;
      'feedback-decay-knob': any;
      'feedback-lpf-knob': any;
      'gain-lfo-rate-knob': any;
      'gain-lfo-depth-knob': any;
      'pitch-lfo-rate-knob': any;
      'pitch-lfo-depth-knob': any;
      'reverb-send-knob': any;
      'reverb-size-knob': any;
      'lowpass-filter-knob': any;
      'highpass-filter-knob': any;
      'loop-start-knob': any;
      'loop-duration-knob': any;
      'loop-duration-drift-knob': any;
      'am-modulation': any;
      'trim-start-knob': any;
      'trim-end-knob': any;
      'distortion-knob': any;
      'delay-send-knob': any;
      'delay-time-knob': any;
      'delay-feedback-knob': any;
      'tempo-knob': any;

      // Toggle components
      'feedback-mode-toggle': any;
      'midi-toggle': any;
      'loop-lock-toggle': any;
      'hold-lock-toggle': any;
      'gain-lfo-sync-toggle': any;
      'pitch-lfo-sync-toggle': any;
      'playback-direction-toggle': any;
      'pan-drift-toggle': any;
      'pitch-toggle': any;

      // Keyboard components
      'computer-keyboard': any;
      'piano-keyboard': any;

      // Select components
      'keymap-select': any;
      'waveform-select': any;
      'input-source-select': any;
      'rootnote-select': any;

      // Status
      'sampler-status': any;
    }
  }
}
