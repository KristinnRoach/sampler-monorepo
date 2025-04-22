// original: https://github.com/joshreiss/Working-with-the-Web-Audio-API/blob/master/19%20Wonders%20of%20audio%20worklets/KarplusStrong/KarplusStrongV2.js

var context = new AudioContext();

context.audioWorklet.addModule('processors.js').then(() => {
  let Noise = new AudioWorkletNode(context, 'noise-generator'),
    NoiseGain = new GainNode(context, { gain: 0 }),
    output = new GainNode(context),
    feedbackDelay = new AudioWorkletNode(context, 'feedbackDelay-processor', {
      parameterData: { delayTime: 5, gain: 0.9 },
    });

  Noise.connect(NoiseGain);
  NoiseGain.connect(output);
  NoiseGain.connect(feedbackDelay);
  feedbackDelay.connect(output);
  output.connect(context.destination);

  Decay.oninput = function () {
    feedbackDelay.parameters.get('gain').value = this.value;
    DecayLabel.innerHTML = this.value;
  };
  Delay.oninput = function () {
    feedbackDelay.parameters.get('delayTime').value = this.value;
    DelayLabel.innerHTML = this.value;
  };
  Width.oninput = function () {
    WidthLabel.innerHTML = this.value;
  };

  Play.onclick = function () {
    context.resume();
    var newDelay = Number(Delay.value) + (1000 * 128) / context.sampleRate;
    feedbackDelay.parameters.get('delayTime').value = newDelay;
    let now = context.currentTime;
    NoiseGain.gain.setValueAtTime(0.5, now);
    NoiseGain.gain.linearRampToValueAtTime(0, now + Width.value / 1000);
  };
});
