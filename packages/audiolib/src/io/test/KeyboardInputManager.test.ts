import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KeyboardInputManager } from '../KeyboardInputManager';
import { InputHandler } from '../types';
// import { defaultKeymap } from '../keymap';

describe('KeyboardInputManager', () => {
  let keyboardManager: KeyboardInputManager;
  let mockHandler: InputHandler;

  beforeEach(() => {
    // Reset DOM event listeners before each test
    vi.stubGlobal('document', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    // Mock isModifierStateSupported to return true for testing
    vi.mock('@/utils', () => ({
      isKeyboardAPISupported: () => true,
      isModifierStateSupported: () => true,
    }));

    // Get a fresh instance for each test
    // @ts-ignore - accessing private method for testing
    KeyboardInputManager['#instance'] = undefined;
    keyboardManager = KeyboardInputManager.getInstance();

    // Add a handler to ensure the keyboard manager is listening
    mockHandler = {
      onNoteOn: vi.fn(),
      onNoteOff: vi.fn(),
      onBlur: vi.fn(),
    };
    keyboardManager.addHandler(mockHandler);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Capslock handling', () => {
    it('should detect capslock state from KeyboardEvent', () => {
      const mockEvent = {
        getModifierState: vi.fn().mockReturnValue(true),
      } as unknown as KeyboardEvent;

      expect(keyboardManager.getCapslock(mockEvent)).toBe(true);
      expect(mockEvent.getModifierState).toHaveBeenCalledWith('CapsLock');
    });
  });
});

// todo: handleCaps has been replaced with handleModKeyDown
// it('should update capslock state when capslock key is pressed', () => {
//   // @ts-ignore - accessing private method for testing
//   const handleCaps = keyboardManager['handleCaps'];

//   const mockEvent = {
//     key: 'CapsLock',
//     getModifierState: vi.fn().mockReturnValue(true),
//   } as unknown as KeyboardEvent;

//   handleCaps(mockEvent);

//   expect(keyboardManager.getCapslock()).toBe(true);
// });

//     it('should maintain capslock state during blur events', () => {
//       // First set capslock state to true using the handleCaps method
//       // @ts-ignore - accessing private method for testing
//       const handleCaps = keyboardManager['handleCaps'];
//       const mockCapsEvent = {
//         key: 'CapsLock',
//         getModifierState: vi.fn().mockReturnValue(true),
//       } as unknown as KeyboardEvent;
//       handleCaps(mockCapsEvent);

//       // Mock the isPressed method to simulate a key being pressed
//       const originalIsPressed = keyboardManager.isPressed;
//       keyboardManager.isPressed = vi.fn((code) => {
//         if (code === 'KeyA') return true;
//         if (code === 'CapsLock') return keyboardManager.getCapslock();
//         return false;
//       });

//       // Verify our setup worked
//       expect(keyboardManager.isPressed('KeyA')).toBe(true);

//       // @ts-ignore - accessing private method for testing
//       const handleBlur = keyboardManager['handleBlur'];

//       // Simulate blur event
//       handleBlur({} as FocusEvent);

//       // Capslock should still be true after blur
//       expect(keyboardManager.getCapslock()).toBe(true);

//       // Restore the original isPressed method
//       keyboardManager.isPressed = originalIsPressed;
//     });

//     it('should correctly report capslock state with isPressed method', () => {
//       // Set capslock state using the handleCaps method
//       // @ts-ignore - accessing private method for testing
//       const handleCaps = keyboardManager['handleCaps'];

//       // First set to true
//       const mockCapsOnEvent = {
//         key: 'CapsLock',
//         getModifierState: vi.fn().mockReturnValue(true),
//       } as unknown as KeyboardEvent;
//       handleCaps(mockCapsOnEvent);

//       expect(keyboardManager.isPressed('CapsLock')).toBe(true);

//       // Then set to false
//       const mockCapsOffEvent = {
//         key: 'CapsLock',
//         getModifierState: vi.fn().mockReturnValue(false),
//       } as unknown as KeyboardEvent;
//       handleCaps(mockCapsOffEvent);

//       expect(keyboardManager.isPressed('CapsLock')).toBe(false);
//     });
//   });
// });
