import { assert } from '../utils/assert';
import { getScale } from './noteFreq';
import { SCALE_PATTERNS } from './NOTE_FREQ';

// type PeriodSnappingOptions = {
//   paramToProcess: 'start' | 'end';
//   start: number;
//   end: number;
// };

// addTarget(target: AudioParam, paramId: string, paramType: string, scaleFactor: number = 1) {

type PeriodSnappingOptions = {
  target: number;
  constant: number;
};

// TODO: Fix loopStart bug and Clean up ramp tracking logic!
// Maybe it's best handled with custom interpolation in the source-processor ?
//       gera  closestPeriod(targetValue, 'larger')

// let idx = indexOf current period
// if (this.param === loopStart && targetValue > this.value)
//    let val = this.value
//
//    let nextLarger = arr.find((firstLarger) => firstLarger > val)
//    let idx = arr.indexOf(firstLarger)
//    while (val < nextLarger < targetValue)
//        setTargetAtTime(arr[idx], easeTime)
//        wait for easeTime to complete
//        idx++
//
//

function closestVal(
  val: number,
  arr: number[],
  direction: 'larger' | 'smaller'
) {
  if (direction === 'larger') {
    arr.find((firstLarger) => firstLarger > val);
  } else {
    arr.find((firstSmaller) => firstSmaller < val);
  }
}

export class MacroParam {
  #context: BaseAudioContext;
  #controlNode: GainNode;
  #constantSignal: ConstantSourceNode;
  // #constantOffset: number = 0; // what is dis?

  #slaveParams: AudioParam[] = []; // or map for types / param names / id's
  #paramType: string = ''; // for now
  // #slaveParamTypes: string[] = []; // for now

  #allowedValues: number[] = []; // ? test sorting! // using for zero-crossings
  #allowedPeriods: number[] = []; // SORTED low to high

  #pendingCallbacks: {
    timeoutId: number;
    scheduledTime: number;
  }[] = [];

  static MIN_PARAM_VALUE = 1e-5; // maybe check official docs but this works well so far

  constructor(context: BaseAudioContext, initialValue: number = 0) {
    this.#context = context;
    assert(context instanceof AudioContext, '', this);

    this.#constantSignal = context.createConstantSource();
    this.#constantSignal.start();

    this.#controlNode = new GainNode(context, { gain: initialValue });
    this.#constantSignal.connect(this.#controlNode);

    // default scale for periods
    const periods = getScale('C', [0, 7]).periodsInSec;
    this.#allowedPeriods = periods.sort((a, b) => a - b); // sort low to high

    console.debug({ scalePeriodsInSeconds: this.#allowedPeriods });
    console.debug({ thisparam: this.macro, this: this });
  }

  // add target audioparam to be controlled by the macro
  addTarget(
    targetParam: AudioParam,
    paramType: string, // add id (paramInfo type based on AudioParam interface)
    scaleFactor: number = 1
  ) {
    assert(targetParam !== undefined, 'target should be AudioParam!', this);
    if (!this.#paramType || this.#paramType === '') this.#paramType = paramType;

    assert(
      paramType === this.#paramType,
      'Macros only support a single ParamType',
      {
        macroType: this.#paramType,
        paramType,
      }
    );

    this.#slaveParams.push(targetParam);
    if (scaleFactor === 1) {
      this.#controlNode.connect(targetParam);
    } else {
      const scaler = new GainNode(this.#controlNode.context, {
        gain: scaleFactor,
      });
      this.#controlNode.connect(scaler).connect(targetParam);
    }

    return this;
  }

  processTargetValue(value: number, snapToPeriod?: PeriodSnappingOptions) {
    let processedValue = value;

    if (snapToPeriod && this.longestPeriod > value) {
      processedValue = this.snapToNotePeriod(snapToPeriod);
    } else if (this.snapEnabled) {
      // only snapping to zero if not snapping to periods
      // todo: test if that sounds ok or optimize zero snapping for periods
      processedValue = this.snap(processedValue);
    }
    return this.clampToMin(processedValue);
  }

  ramp(
    targetValue: number,
    rampTime: number,
    snapToPeriod?: PeriodSnappingOptions,
    // ! optimize exclusively for setTargetAtTime, at least when snapping to periods
    style: 'linear' | 'exponential' | 'setTargetAtTime' = 'setTargetAtTime',
    onComplete?: () => void // optional user callback to run when ramp completes
  ): this {
    const now = this.now;
    const param = this.macro;

    if (!this.#shouldRamp(targetValue, snapToPeriod)) return this;

    let processedValue = this.processTargetValue(targetValue, snapToPeriod);

    // TESTING the effect of always cancelling previous ramps
    this.cancelRamp();

    switch (style) {
      case 'linear':
        param.linearRampToValueAtTime(processedValue, now + rampTime);
        break;
      case 'exponential':
        param.exponentialRampToValueAtTime(processedValue, now + rampTime);
        break;
      case 'setTargetAtTime':
        param.setTargetAtTime(processedValue, now, rampTime);
        // need to approximate completion time for timeouts if using setTargetAtTime, test this
        break;
    }

    const durationSec = style === 'setTargetAtTime' ? rampTime * 2 : rampTime;

    const completionTime = now + durationSec;

    this.rampTracker = {
      isRamping: true,
      direction: processedValue > this.value ? 'up' : 'down',
      periodIndex: this.#allowedPeriods.indexOf(processedValue),
      rampStarted: { time: now, value: processedValue },
      rampEnded: { time: -1, value: -1 },
      scheduledCompletion: completionTime,
    };

    // Schedule the callback to run when the ramp completes
    const timeoutId = setTimeout(() => {
      this.onRampComplete();
      if (onComplete) onComplete();
    }, durationSec * 1000); // ms

    // Store the timeout ID, needed?
    this.#pendingCallbacks.push({
      timeoutId: timeoutId as unknown as number, // ts expects NodeJS.Timeout but this is a browser timeout
      scheduledTime: completionTime,
    });

    return this;
  }

  onRampComplete = () => {
    const previdx = this.rampTracker.periodIndex;
    this.rampTracker = {
      isRamping: false,
      direction: null,
      periodIndex: previdx, // ? or -1 ?
      rampStarted: { time: -1, value: -1 },
      rampEnded: { time: this.now, value: this.value },
      scheduledCompletion: -1,
    };

    // const periodIndex = this.#allowedPeriods.indexOf(this.value);
    // if (periodIndex > -1) {
    //   this.rampTracker.periodIndex = periodIndex;
    // } else {
    //   console.warn(
    //     'Ramp complete, but the current value is not in the allowed periods.'
    //   );
    // }

    // Only clear timeouts that have completed
    this.#pendingCallbacks = this.#pendingCallbacks.filter((callback) => {
      if (callback.scheduledTime <= this.now) {
        clearTimeout(callback.timeoutId);
        return false; // Remove from array
      }
      return true; // Keep in array
    });
  };

  rampTracker: {
    isRamping: boolean;
    direction: 'up' | 'down' | null;
    periodIndex: number;
    rampStarted: { time: number; value: number };
    rampEnded: { time: number; value: number };
    // if is ramping: last update is from ramp start
    // if not: last update is from last ramp end
    scheduledCompletion: number;
  } = {
    isRamping: false,
    direction: null,
    periodIndex: -1,
    rampStarted: { time: -1, value: -1 },
    rampEnded: { time: -1, value: -1 },
    scheduledCompletion: -1,
  };

  #shouldRamp(newTarget: number, snapToPeriod?: PeriodSnappingOptions) {
    // be aware that ramp might be in progress from the other param, e.g. start if this is end
    if (!this.rampTracker.isRamping) return true; // no ramp in progress
    if (!snapToPeriod) return true; // TEMP: check

    // const proposedDuration = snapToPeriod.end - snapToPeriod.start;

    const now = this.now;
    const periods = this.#allowedPeriods;
    const { rampStarted, periodIndex, direction } = this.rampTracker;

    const newRampDirection = newTarget > this.value ? 'up' : 'down';

    if (direction !== newRampDirection) {
      console.debug('ramp direction change occurred');
      return true; // ramp direction changed
    }

    // if (direction === 'up') {
    //   console.log(`next period should be ${periods[periodIndex + 1]}`);
    // }

    // const newPeriodIndex = this.#allowedPeriods.indexOf(..

    if (now < rampStarted.time + 0.01) {
      return false;
    }

    return true;
  }

  cancelRamp() {
    this.#pendingCallbacks.forEach((callback) => {
      clearTimeout(callback.timeoutId);
    });
    this.#pendingCallbacks = [];

    this.rampTracker = {
      isRamping: false,
      direction: null,
      periodIndex: -1,
      rampStarted: { time: -1, value: -1 },
      rampEnded: { time: -1, value: -1 },
      scheduledCompletion: -1,
    };
  }

  snap(inputValue: number) {
    // snap to zero crossings
    if (!this.snapEnabled) return inputValue;
    const values = this.#allowedValues;

    return values.reduce((prev, curr) =>
      Math.abs(curr - inputValue) < Math.abs(prev - inputValue) ? curr : prev
    );
  }

  snapToNotePeriod(options: {
    target: number; // ? rename to 'target' and 'constant' !
    constant: number;
  }): number {
    const { target, constant } = options;
    // ... if this.#slaveParamType === loopStart { loopStart = target, loopEnd = constant}
    const allowedDistances = this.#allowedPeriods;

    const initialTargetDistance = Math.abs(constant - target);

    let testThreshold = 0.01;
    let targetPeriod = allowedDistances.find(
      (period) => period - initialTargetDistance < testThreshold
    );

    if (targetPeriod) return targetPeriod; // testing - need to add / subtract in caller

    let closestAllowed = allowedDistances[0];
    let minDifference = Math.abs(initialTargetDistance - closestAllowed);

    // should use the fact they are sorted, but works fine
    for (const dist of allowedDistances) {
      const difference = Math.abs(initialTargetDistance - dist);
      if (difference < minDifference) {
        minDifference = difference;
        closestAllowed = dist;
      }
    }

    const safePeriod = Math.max(closestAllowed, this.shortestPeriod); // should not be needed

    if (this.#paramType.includes('loopEnd')) return constant + safePeriod;
    else return this.clampToMin(constant - safePeriod);
  }

  // snapToNotePeriod(options: {
  //   paramToProcess: 'start' | 'end';
  //   start: number;
  //   end: number;
  // }): number {
  //   const { paramToProcess, start, end } = options;
  //   const allowedDistances = this.#allowedPeriods;

  //   const currentDistance = Math.abs(end - start);

  //   let closestAllowed = allowedDistances[0];
  //   let minDifference = Math.abs(currentDistance - closestAllowed);

  //   // should use the fact they are sorted, but works fine
  //   for (const dist of allowedDistances) {
  //     const difference = Math.abs(currentDistance - dist);
  //     if (difference < minDifference) {
  //       minDifference = difference;
  //       closestAllowed = dist;
  //     }
  //   }

  //   const safePeriod = Math.max(closestAllowed, this.shortestPeriod); // should not be needed

  //   if (paramToProcess === 'end') return start + safePeriod;
  //   else return this.clampToMin(end - safePeriod);
  // }

  // const actualParamDistance = Math.abs(
  //   paramToProcess === 'start' ? end - this.value : this.value - start
  // );

  // const valueToProcess = paramToProcess === 'start' ? start : end;
  // const otherValue = paramToProcess === 'start' ? end : start;
  // const distanceToProcess = Math.abs(end - start);
  // const currentParamDistance = Math.abs(this.value - otherValue);

  // let find: 'firstShorterPeriod' | 'firstLongerPeriod';
  // if (distanceToProcess < currentParamDistance) {
  //   find = 'firstShorterPeriod';
  // } else {
  //   find = 'firstLongerPeriod';
  // }

  clampToMin = (value: number) => {
    return Math.max(value, MacroParam.MIN_PARAM_VALUE);
  };

  dispose(): void {
    this.#controlNode.disconnect();
  }
  /** SETTERS */

  setAllowedParamValues(values: number[]) {
    assert(values.length > 1, 'allowed values must not be empty!', this);
    this.#allowedValues = values.sort((a, b) => a - b); // !! Test whether sorting zero crossings is helpful or not!

    return this;
  }

  // set allowed periods for snapping
  setAllowedPeriods(values: number[]) {
    assert(values.length > 1, 'allowed values must not be empty!', this);
    this.#allowedPeriods = values.sort((a, b) => a - b); // sort low to high

    return this;
  }

  setScale(
    rootNote: string,
    scale: keyof typeof SCALE_PATTERNS,
    customScalePattern?: number[]
  ) {
    const scalePattern = customScalePattern
      ? customScalePattern
      : SCALE_PATTERNS[scale];
    const { periodsInSec } = getScale(rootNote, scalePattern);
    this.#allowedPeriods = periodsInSec.sort((a, b) => a - b); // sort low to high

    return this;
  }

  set macro(value: number) {
    this.macro.setValueAtTime(value, this.now + 0.001);
  }
  /** GETTERS */

  get longestPeriod() {
    return this.#allowedPeriods[this.#allowedPeriods.length - 1];
  }

  get shortestPeriod() {
    return this.#allowedPeriods[0];
  }

  get now() {
    return this.#context.currentTime;
  }

  get macro(): AudioParam {
    return this.#controlNode.gain;
  }

  get type() {
    return this.#paramType;
  }

  get numSlaves() {
    return this.#slaveParams.length;
  }

  get node() {
    return this.#controlNode;
  }

  get value(): number {
    return this.#controlNode.gain.value;
  }

  get snapEnabled() {
    return this.#allowedValues.length > 0;
  }

  get numAllowedValues() {
    return this.#allowedValues.length;
  }
}

// Usage example
// const loopStartMacro = new MacroParam(context, 0);
// loopStartMacro.addTarget(sourceNode1.loopStart);
// loopStartMacro.addTarget(sourceNode2.loopStart);

// Control all connected params at once
// loopStartMacro.param.linearRampToValueAtTime(0.5, context.currentTime + 0.1);

/** Snap tolerance / threshold if needed (made the code ugly) */
// #snapTolerance: number = 0.01;
// if (this.#snapTolerance > 0) {
//   allowedValues = this.#snapValues.filter(
//     (value) => Math.abs(value - inputValue) <= this.#snapTolerance
//   );
// } else {
//   allowedValues = this.#snapValues;
// }

// TODO: finna útúr þessu ef ég nenni

// snapToNotePeriod(options: {
//   paramToProcess: 'start' | 'end';
//   start: number;
//   end: number;
// }): number {
//   const { paramToProcess, start, end } = options;
//   const allowedDistances = this.#allowedPeriods;

//   const currentDistance = Math.abs(end - start);

//   // Important: Determine if we're growing or shrinking the period
//   // For 'start': decreasing start grows the period
//   // For 'end': increasing end grows the period
//   const isGrowingPeriod =
//     (paramToProcess === 'start' && start > this.value) ||
//     (paramToProcess === 'end' && end < this.value);

//   // Find the appropriate allowed distance based on whether we're growing or shrinking
//   let closestAllowed;

//   if (isGrowingPeriod) {
//     // Find the first allowed distance smaller than current
//     closestAllowed =
//       [...allowedDistances]
//         .reverse()
//         .find((dist) => dist < currentDistance) || allowedDistances[0];
//   } else {
//     // Find the first allowed distance larger than current
//     closestAllowed =
//       allowedDistances.find((dist) => dist > currentDistance) ||
//       allowedDistances[allowedDistances.length - 1];
//   }

//   // Apply the new distance correctly
//   return paramToProcess === 'end'
//     ? start + closestAllowed
//     : end - closestAllowed;
// }

// snapToNotePeriod(options: {
//   paramToProcess: 'start' | 'end';
//   start: number;
//   end: number;
// }): number {
//   const { paramToProcess, start, end } = options;
//   const allowedDistances = this.#allowedPeriods;

//   console.log(this.param);

//   const currentDistance = Math.abs(end - start);

//   // If exact match exists in allowed distances, use it
//   const exactMatch = allowedDistances.find(
//     (dist) => dist === currentDistance
//   );
//   if (exactMatch) {
//     return paramToProcess === 'end' ? start + exactMatch : end - exactMatch;
//   }

//   // Find first larger and first smaller allowed distances
//   const firstLarger = allowedDistances.find((dist) => dist > currentDistance);
//   const firstSmaller = [...allowedDistances]
//     .reverse()
//     .find((dist) => dist < currentDistance);

//   // Choose appropriate distance based on whether we're growing or shrinking
//   let closestAllowed;
//   if (!firstLarger) {
//     closestAllowed =
//       firstSmaller || allowedDistances[allowedDistances.length - 1];
//   } else if (!firstSmaller) {
//     closestAllowed = firstLarger;
//   } else {
//     // Choose the closest of the two options
//     closestAllowed =
//       currentDistance - firstSmaller <= firstLarger - currentDistance
//         ? firstSmaller
//         : firstLarger;
//   }

//   return paramToProcess === 'end'
//     ? start + closestAllowed
//     : end - closestAllowed;
// }

// snapToNotePeriod(options: {
//   paramToProcess: 'start' | 'end';
//   start: number;
//   end: number;
// }): number {
//   const { paramToProcess, start, end } = options;
//   const allowedDistances = this.#allowedPeriods;

//   const valueToProcess = paramToProcess === 'start' ? start : end;
//   const otherValue = paramToProcess === 'start' ? end : start;

//   const distanceToProcess = Math.abs(end - start);
//   const currentParamDistance = Math.abs(this.value - otherValue);

//   let find: 'firstShorterPeriod' | 'firstLongerPeriod';
//   if (distanceToProcess < currentParamDistance) {
//     find = 'firstShorterPeriod';
//   } else {
//     find = 'firstLongerPeriod';
//   }

//   let closestAllowed = allowedDistances[0];
//   let minDifference = Math.abs(distanceToProcess - closestAllowed);

//   // should use the fact they are sorted, but works fine
//   for (const dist of allowedDistances) {
//     const difference = Math.abs(distanceToProcess - dist);
//     if (difference < minDifference) {
//       minDifference = difference;
//       closestAllowed = dist;
//     }
//   }

//   if (paramToProcess === 'end') return start + closestAllowed;
//   else return end - closestAllowed;
// }

// const direction = valueToProcess > this.value ? 'up' : 'down';
