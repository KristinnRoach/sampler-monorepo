/* @refresh reload */
import { render } from 'solid-js/web';
import { defineSampler } from '@repo/audio-components';
import App from './App';
import './styles/themes.css';
import './style-org-layout.css';

defineSampler(); // Define all web components for the sampler

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?'
  );
}

render(() => <App />, root!);
