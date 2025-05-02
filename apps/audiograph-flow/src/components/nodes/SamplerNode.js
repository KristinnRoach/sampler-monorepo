import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Handle, Position } from 'reactflow';
import { useEffect, useRef, useState } from 'react';
import { audiolib } from '@repo/audiolib';
const SamplerNode = ({ id, data }) => {
    const [isInitialized, setInitialized] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const samplerRef = useRef(null);
    // Initialize the sampler
    useEffect(() => {
        const initSampler = async () => {
            if (isInitialized)
                return;
            try {
                const ctx = await audiolib.ensureAudioCtx();
                samplerRef.current = audiolib.createSampler();
                if (samplerRef.current) {
                    // Connect to destination
                    samplerRef.current.connect(ctx.destination);
                    setInitialized(true);
                    // Register methods for the flow
                    if (data.registerMethods) {
                        data.registerMethods({
                            playNote: (note, velocity = 100) => {
                                console.log('SamplerNode playNote:', note, velocity);
                                samplerRef.current?.playNote(note, velocity);
                            },
                            stopNote: (note) => {
                                console.log('SamplerNode stopNote:', note);
                                samplerRef.current?.stopNote(note);
                            },
                            getSampler: () => samplerRef.current,
                        });
                    }
                    // Load a default sample
                    const response = await fetch('/initsample.wav');
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                    await samplerRef.current.loadSample(audioBuffer);
                    setIsLoaded(true);
                }
            }
            catch (error) {
                console.error('Failed to initialize sampler:', error);
            }
        };
        initSampler();
        return () => {
            if (samplerRef.current) {
                samplerRef.current.disconnect();
                samplerRef.current = null;
            }
        };
    }, [data.registerMethods, isInitialized]);
    return (_jsxs("div", { className: 'sampler-node', children: [_jsx(Handle, { type: 'target', position: Position.Top, id: 'note-in' }), _jsxs("div", { children: [_jsx("h3", { children: "Sampler" }), _jsxs("div", { children: ["Status: ", isLoaded ? 'Ready' : 'Loading...'] })] }), _jsx(Handle, { type: 'source', position: Position.Bottom, id: 'audio-out' })] }));
};
export default SamplerNode;
