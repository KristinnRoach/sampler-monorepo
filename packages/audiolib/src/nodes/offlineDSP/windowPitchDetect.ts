interface PitchCandidate {
  pitch: number;
  confidence: number;
  time: number;
}

interface WindowAnalysisResult {
  pitch: number;
  confidence: number;
}

export async function detectPitch(audioBuffer: AudioBuffer): Promise<number> {
  const data = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // Window parameters
  const windowSize = 4096; // ~93ms at 44.1kHz
  const hopSize = 1024; // 75% overlap for smooth tracking
  const numWindows = Math.floor((data.length - windowSize) / hopSize) + 1;

  const pitchCandidates: PitchCandidate[] = [];

  // Analyze each window
  for (let w = 0; w < numWindows; w++) {
    const start = w * hopSize;
    const end = Math.min(start + windowSize, data.length);
    const windowData = data.slice(start, end);

    const result = analyzeWindow(windowData, sampleRate);
    if (result.pitch > 0 && result.confidence > 0.3) {
      // Minimum confidence threshold
      pitchCandidates.push({
        pitch: result.pitch,
        confidence: result.confidence,
        time: start / sampleRate,
      });
    }
  }

  if (pitchCandidates.length === 0) {
    return 0; // No pitch detected
  }

  // Find most stable fundamental frequency
  return findMostStablePitch(pitchCandidates);
}

function analyzeWindow(
  windowData: Float32Array,
  sampleRate: number
): WindowAnalysisResult {
  // Pad window if too short
  if (windowData.length < 1000) {
    return { pitch: 0, confidence: 0 };
  }

  let correlations = new Float32Array(1000);

  // Center-clipping (reduced threshold for vocals)
  const clipLevel = 0.15 * Math.max(...windowData.map(Math.abs));
  const clipped = windowData.map((x) => (Math.abs(x) > clipLevel ? x : 0));

  // Check if we have enough signal after clipping
  const nonZeroSamples = clipped.filter((x) => x !== 0).length;
  if (nonZeroSamples < windowData.length * 0.1) {
    // Too much was clipped, use raw data
    clipped.set(windowData);
  }

  // Autocorrelation
  for (let lag = 20; lag < correlations.length; lag++) {
    let sum = 0;
    for (let i = 0; i < clipped.length - lag; i++) {
      sum += clipped[i] * clipped[i + lag];
    }
    correlations[lag] = sum;
  }

  // Find peak correlation
  const minLag = Math.floor(sampleRate / 1000); // ~1kHz upper bound
  const maxLag = Math.floor(sampleRate / 80); // ~80Hz lower bound

  let bestLag = minLag;
  let maxCorr = correlations[minLag];

  for (let i = minLag; i < Math.min(maxLag, correlations.length); i++) {
    if (correlations[i] > maxCorr) {
      bestLag = i;
      maxCorr = correlations[i];
    }
  }

  // Calculate confidence (peak vs average)
  const avgCorr =
    correlations
      .slice(minLag, Math.min(maxLag, correlations.length))
      .reduce((sum, val) => sum + val, 0) /
    (Math.min(maxLag, correlations.length) - minLag);

  const confidence = avgCorr > 0 ? maxCorr / avgCorr : 0;

  // Quadratic interpolation for sub-sample precision
  if (bestLag > 0 && bestLag < correlations.length - 1) {
    const y1 = correlations[bestLag - 1];
    const y2 = correlations[bestLag];
    const y3 = correlations[bestLag + 1];

    const denominator = 2 * (2 * y2 - y1 - y3);
    const offset = Math.abs(denominator) < 1e-10 ? 0 : (y3 - y1) / denominator;

    const pitch = sampleRate / (bestLag + offset);
    return { pitch, confidence };
  }

  return { pitch: 0, confidence: 0 };
}

function findMostStablePitch(pitchCandidates: PitchCandidate[]): number {
  // Strategy 1: Find the most prominent fundamental (try this first)
  const fundamentalFreq = findMostProminentFundamental(pitchCandidates);

  // Strategy 2: Find longest sustained section (fallback)
  // const fundamentalFreq = findLongestSustainedPitch(pitchCandidates);

  return fundamentalFreq;
}

function findMostProminentFundamental(candidates: PitchCandidate[]): number {
  // Group similar pitches (within 20 cents tolerance)
  const groups: PitchCandidate[][] = [];
  const tolerance = 0.02; // ~20 cents

  for (const candidate of candidates) {
    let foundGroup = false;

    for (const group of groups) {
      const avgPitch =
        group.reduce((sum, c) => sum + c.pitch, 0) / group.length;
      const ratio = candidate.pitch / avgPitch;

      // Check if within tolerance (accounting for octave errors)
      if (
        Math.abs(ratio - 1) < tolerance ||
        Math.abs(ratio - 0.5) < tolerance ||
        Math.abs(ratio - 2) < tolerance
      ) {
        // Normalize to same octave as group average
        let normalizedPitch = candidate.pitch;
        if (Math.abs(ratio - 0.5) < tolerance) normalizedPitch *= 2;
        if (Math.abs(ratio - 2) < tolerance) normalizedPitch /= 2;

        group.push({ ...candidate, pitch: normalizedPitch });
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.push([candidate]);
    }
  }

  // Find group with highest total confidence
  let bestGroup = groups[0];
  let bestScore = 0;

  for (const group of groups) {
    const totalConfidence = group.reduce((sum, c) => sum + c.confidence, 0);
    const avgConfidence = totalConfidence / group.length;
    const duration = group.length; // Number of windows

    // Score = average confidence * duration (favors sustained notes)
    const score = avgConfidence * Math.sqrt(duration);

    if (score > bestScore) {
      bestScore = score;
      bestGroup = group;
    }
  }

  // Return weighted average of best group
  const totalWeight = bestGroup.reduce((sum, c) => sum + c.confidence, 0);
  const weightedPitch =
    bestGroup.reduce((sum, c) => sum + c.pitch * c.confidence, 0) / totalWeight;

  return weightedPitch;
}

function findLongestSustainedPitch(candidates: PitchCandidate[]): number {
  // Alternative strategy: find longest continuous section with stable pitch
  let longestRun: PitchCandidate[] = [];
  let currentRun: PitchCandidate[] = [candidates[0]];

  const tolerance = 0.05; // 5% pitch variation allowed

  for (let i = 1; i < candidates.length; i++) {
    const prev = currentRun[currentRun.length - 1];
    const curr = candidates[i];

    // Check if pitch is stable (within tolerance)
    if (Math.abs(curr.pitch - prev.pitch) / prev.pitch < tolerance) {
      currentRun.push(curr);
    } else {
      // Run ended, check if it's the longest
      if (currentRun.length > longestRun.length) {
        longestRun = [...currentRun];
      }
      currentRun = [curr];
    }
  }

  // Check final run
  if (currentRun.length > longestRun.length) {
    longestRun = currentRun;
  }

  if (longestRun.length === 0) return 0;

  // Return average pitch of longest sustained section
  return longestRun.reduce((sum, c) => sum + c.pitch, 0) / longestRun.length;
}
