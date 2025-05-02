import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { keymap } from './keymap';
const KeyboardNode = ({ data, isConnectable }) => {
    const [activeKeys, setActiveKeys] = useState({});
    const [isEnabled, setIsEnabled] = useState(true);
    const triggerNoteOn = useCallback((midiNote, velocity = 127) => {
        if (isEnabled && data.onNoteOn)
            data.onNoteOn(midiNote, velocity);
    }, [data, isEnabled]);
    const triggerNoteOff = useCallback((midiNote) => {
        if (isEnabled && data.onNoteOff)
            data.onNoteOff(midiNote);
    }, [data, isEnabled]);
    useEffect(() => {
        if (data.registerMethods) {
            data.registerMethods({
                noteOn: triggerNoteOn,
                noteOff: triggerNoteOff,
            });
        }
    }, [data, triggerNoteOn, triggerNoteOff]);
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isEnabled || e.repeat)
                return;
            const midiNote = keymap[e.code];
            if (midiNote && !activeKeys[e.code]) {
                setActiveKeys((prev) => ({ ...prev, [e.code]: true }));
                triggerNoteOn(midiNote);
            }
        };
        const handleKeyUp = (e) => {
            if (!isEnabled || e.repeat)
                return;
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
        const midiToKeyMap = {};
        Object.entries(keymap).forEach(([keyCode, midiNote]) => {
            if (!midiToKeyMap[midiNote])
                midiToKeyMap[midiNote] = [];
            midiToKeyMap[midiNote].push(keyCode);
        });
        const sortedMidiNotes = Object.keys(midiToKeyMap)
            .map(Number)
            .sort((a, b) => a - b);
        return sortedMidiNotes.map((midiNote) => {
            const keyCodes = midiToKeyMap[midiNote];
            if (!keyCodes || !keyCodes[0])
                throw Error;
            const keyLabel = keyCodes[0].replace('Key', '').replace('Digit', '');
            const noteInOctave = midiNote % 12;
            const isSharp = [1, 3, 6, 8, 10].includes(noteInOctave);
            const isActive = keyCodes.some((keyCode) => activeKeys[keyCode]);
            return (_jsx("div", { className: `piano-key ${isSharp ? 'sharp' : 'natural'} ${isActive ? 'active' : ''} nodrag`, style: {
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
                }, onMouseDown: () => triggerNoteOn(midiNote), onMouseUp: () => triggerNoteOff(midiNote), onMouseLeave: () => {
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
                }, children: _jsx("div", { style: {
                        position: 'absolute',
                        bottom: '5px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '10px',
                        color: isSharp ? '#fff' : '#333',
                    }, children: keyLabel }) }, midiNote));
        });
    };
    return (_jsxs("div", { className: 'keyboard-node', style: {
            padding: '10px',
            background: '#f5f5f5',
            borderRadius: '5px',
            width: '400px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        }, children: [_jsxs("div", { style: { marginBottom: '8px' }, children: [_jsx("h4", { style: { margin: '0 0 8px 0' }, children: "Keyboard Controller" }), _jsx("p", { style: { fontSize: '12px', margin: '0 0 8px 0' }, children: "Use computer keyboard or click/touch keys" }), _jsx("button", { onClick: () => setIsEnabled((prev) => !prev), style: {
                            padding: '5px 10px',
                            fontSize: '12px',
                            borderRadius: '3px',
                            border: '1px solid #ccc',
                            background: isEnabled ? '#90caf9' : '#f5f5f5',
                            cursor: 'pointer',
                        }, children: isEnabled ? 'Disable' : 'Enable' })] }), _jsx("div", { className: 'piano-keyboard nodrag', style: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    position: 'relative',
                    height: '120px',
                    marginBottom: '10px',
                }, children: renderKeys() }), _jsx(Handle, { type: 'source', position: Position.Bottom, id: 'note-out', style: { background: '#555' }, isConnectable: isConnectable })] }));
};
export default KeyboardNode;
