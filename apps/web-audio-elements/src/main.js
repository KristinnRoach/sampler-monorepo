// Get references to elements
const sampler = document.getElementById('sampler1');
const output = document.getElementById('output1');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const connectionInfo = document.getElementById('connection-info');

// Event listeners
sampler.addEventListener('sampler-initialized', () => {
  connectionInfo.innerHTML = '<p>Sampler initialized</p>';
});

sampler.addEventListener('sample-loaded', (event) => {
  connectionInfo.innerHTML += `<p>Sample loaded: ${event.detail.fileName} (${event.detail.duration.toFixed(2)}s)</p>`;
});

output.addEventListener('output-initialized', () => {
  connectionInfo.innerHTML += '<p>Output initialized</p>';
});

// Connect/disconnect buttons
connectBtn.addEventListener('click', () => {
  sampler.connect(output);
  connectionInfo.innerHTML += '<p>Connected sampler to output</p>';
});

disconnectBtn.addEventListener('click', () => {
  sampler.disconnect();
  connectionInfo.innerHTML += '<p>Disconnected sampler</p>';
});

console.log('Web Audio Elements app initialized');
