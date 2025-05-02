import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createRoot } from 'react-dom/client';
import { useRef, useState } from 'react';
import './styles.css';
import { audiolib } from '@repo/audiolib';
import Canvas from './components/Canvas';
import SamplerFlowExample from './components/nodes/SamplerFlow.js';
const App = () => {
    const audiolibRef = useRef(audiolib);
    const [isInitialized, setInitialized] = useState(false);
    return (_jsx("div", { children: isInitialized ? (_jsx(_Fragment, { children: _jsxs("div", { children: [_jsx(Canvas, {}), _jsx(SamplerFlowExample, {})] }) })) : (_jsx("div", { children: _jsx("button", { id: 'initAudiolib', onClick: async () => {
                    await audiolibRef.current.init();
                    setInitialized(true);
                }, children: "Initialize Audiolib!" }) })) }));
};
createRoot(document.getElementById('app')).render(_jsx(App, {}));
