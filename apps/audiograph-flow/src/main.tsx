import { createRoot } from 'react-dom/client';
import './styles.css';
// import Canvas from './components/Canvas';
import SamplerFlowExample from './components/nodes/SamplerFlow.js';

const App = () => {
  return (
    <div className='app'>
      {/* <Canvas /> */}
      <SamplerFlowExample />
    </div>
  );
};

createRoot(document.getElementById('app')!).render(<App />);
