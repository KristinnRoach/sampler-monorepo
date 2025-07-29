// src/shared/state/keyboard-state.ts

export const keyboardEnabledInstruments = new Set<string>(); // NodeID's

export const pressedKeys = new Set<string>(); // KeyCodes (e.code)

export function enableComputerKeyboard(id: string) {
  keyboardEnabledInstruments.add(id);
}

export function disableComputerKeyboard(id: string) {
  keyboardEnabledInstruments.delete(id);
}

export function clearKeyboardEnabledInstruments() {
  keyboardEnabledInstruments.clear();
}
