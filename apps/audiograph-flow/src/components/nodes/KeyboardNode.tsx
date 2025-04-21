import { useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { keymap } from './keymap';

interface KeyboardNodeData {
  onNoteOn?: (midiNote: number, velocity?: number) => void;
  onNoteOff?: (midiNote: number) => void;
  registerMethods?: (methods: any) => void;
}

const KeyboardNode = ({ data, isConnectable }: NodeProps<KeyboardNodeData>) => {
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({});
  const [isEnabled, setIsEnabled] = useState(true);

  const triggerNoteOn = useCallback(
    (midiNote: number, velocity: number = 127) => {
      if (isEnabled && data.onNoteOn) data.onNoteOn(midiNote, velocity);
    },
    [data, isEnabled]
  );

  const triggerNoteOff = useCallback(
    (midiNote: number) => {
      if (isEnabled && data.onNoteOff) data.onNoteOff(midiNote);
    },
    [data, isEnabled]
  );

  useEffect(() => {
    if (data.registerMethods) {
      data.registerMethods({
        noteOn: triggerNoteOn,
        noteOff: triggerNoteOff,
      });
    }
  }, [data, triggerNoteOn, triggerNoteOff]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEnabled || e.repeat) return;
      const midiNote = keymap[e.code];
      if (midiNote && !activeKeys[e.code]) {
        setActiveKeys((prev) => ({ ...prev, [e.code]: true }));
        triggerNoteOn(midiNote);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isEnabled || e.repeat) return;
      const midiNote = keymap[e.code];
      if (midiNote) {
        setActiveKeys((prev) => ({ ...prev, [e.code]: false }));
        triggerNoteOff(midiNote);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeKeys, triggerNoteOn, triggerNoteOff, isEnabled]);

  const renderKeys = () => {
    const midiToKeyMap: Record<number, string[]> = {};
    Object.entries(keymap).forEach(([keyCode, midiNote]) => {
      if (!midiToKeyMap[midiNote]) midiToKeyMap[midiNote] = [];
      midiToKeyMap[midiNote].push(keyCode);
    });

    const sortedMidiNotes = Object.keys(midiToKeyMap)
      .map(Number)
      .sort((a, b) => a - b);

    return sortedMidiNotes.map((midiNote) => {
      const keyCodes = midiToKeyMap[midiNote];
      if (!keyCodes || !keyCodes[0]) throw Error;

      const keyLabel = keyCodes[0].replace('Key', '').replace('Digit', '');
      const noteInOctave = midiNote % 12;
      const isSharp = [1, 3, 6, 8, 10].includes(noteInOctave);
      const isActive = keyCodes.some((keyCode) => activeKeys[keyCode]);

      return (
        <div
          key={midiNote}
          className={`piano-key ${isSharp ? 'sharp' : 'natural'} ${isActive ? 'active' : ''} nodrag`}
          style={{
            width: isSharp ? '28px' : '40px',
            height: isSharp ? '80px' : '120px',
            backgroundColor: isActive ? '#90caf9' : isSharp ? '#333' : '#fff',
            border: '1px solid #333',
            display: 'inline-block',
            marginRight: isSharp ? '-15px' : '2px',
            position: isSharp ? 'relative' : 'static',
            zIndex: isSharp ? 1 : 0,
            verticalAlign: 'top',
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
          onMouseDown={() => triggerNoteOn(midiNote)}
          onMouseUp={() => triggerNoteOff(midiNote)}
          onMouseLeave={() => {
            if (keyCodes.some((keyCode) => activeKeys[keyCode])) {
              triggerNoteOff(midiNote);
              setActiveKeys((prev) => {
                const newState = { ...prev };
                keyCodes.forEach((keyCode) => {
                  newState[keyCode] = false;
                });
                return newState;
              });
            }
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: '5px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '10px',
              color: isSharp ? '#fff' : '#333',
            }}
          >
            {keyLabel}
          </div>
        </div>
      );
    });
  };

  return (
    <div
      className='keyboard-node'
      style={{
        padding: '10px',
        background: '#f5f5f5',
        borderRadius: '5px',
        width: '400px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      }}
    >
      <div style={{ marginBottom: '8px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Keyboard Controller</h4>
        <p style={{ fontSize: '12px', margin: '0 0 8px 0' }}>
          Use computer keyboard or click/touch keys
        </p>
        <button
          onClick={() => setIsEnabled((prev) => !prev)}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            borderRadius: '3px',
            border: '1px solid #ccc',
            background: isEnabled ? '#90caf9' : '#f5f5f5',
            cursor: 'pointer',
          }}
        >
          {isEnabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      <div
        className='piano-keyboard nodrag'
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          position: 'relative',
          height: '120px',
          marginBottom: '10px',
        }}
      >
        {renderKeys()}
      </div>

      <Handle
        type='source'
        position={Position.Bottom}
        id='note-out'
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default KeyboardNode;
