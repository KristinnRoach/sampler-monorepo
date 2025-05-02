import { LibNode, LibParamNode, ParamType } from '@/LibNode';
import { createNodeId, deleteNodeId, NodeID } from '@/state/registry/NodeIDs';
import {
  MessageHandler,
  Message,
  MessageBus,
  createMessageBus,
} from '@/events';
import { assert, cancelScheduledParamValues } from '@/utils';
import { createScale } from '@/utils/musical/scales/createScale';
import { NOTES } from '@/constants';

export class MacroParam implements LibParamNode {
  readonly nodeId: NodeID;
  readonly nodeType: ParamType = 'macro';

  #context: BaseAudioContext;
  #controlNode: GainNode;
  #constantSignal: ConstantSourceNode;

  #slaveParams: AudioParam[] = []; // LibParam?
  #paramType: string = '';
  #allowedValues: number[] = [];
  #allowedPeriods: number[] = [];
  #messages: MessageBus<Message>;

  static MIN_EXPONENTIAL_RAMP_VALUE = 1e-6;

  constructor(context: BaseAudioContext, initialValue: number = 0) {
    this.#context = context;
    assert(context instanceof AudioContext, '', this);

    this.nodeId = createNodeId(this.nodeType);
    this.#messages = createMessageBus(this.nodeId);

    this.#constantSignal = context.createConstantSource();
    this.#constantSignal.start();

    this.#controlNode = new GainNode(context, { gain: initialValue });
    this.#constantSignal.connect(this.#controlNode);

    const periods = createScale('C', [0, 7]).periodsInSec;
    this.#allowedPeriods = periods.sort((a, b) => a - b);
  }

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    // TODO: implement proper message handling
    return () => {};
  }

  connect(): this {
    assert(
      false,
      `connect() is not implemented in Macro.
       Remove from interface if not needed`,
      this.macro
    );
  }

  disconnect(): void {
    assert(
      false,
      `disconnect() is not implemented in Macro.
       Remove from interface if not needed`,
      this.macro
    );
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

  processTargetValue(value: number, constant: number) {
    let processedValue = value;
    let targetPeriod = Math.abs(value - constant);

    if (this.longestPeriod > targetPeriod) {
      const zeroSnapped = this.snap(processedValue); // Testing
      processedValue = this.snapToNotePeriod(zeroSnapped, constant);
    } else if (this.snapEnabled) {
      // only snapping to zero if not snapping to periods
      // todo: test if this sounds ok or optimize zero snapping for periods
      processedValue = this.snap(processedValue);
    }
    return processedValue;
  }

  ramp(
    targetValue: number,
    rampTime: number,
    constant: number,
    style: 'linear' | 'exponential' | 'setTargetAtTime' = 'exponential',
    onComplete?: () => void // optional user callback to run when ramp completes
  ): this {
    const now = this.now;
    const param = this.macro;
    // if (!this.#shouldRamp(targetValue, snapToPeriod)) return this;

    cancelScheduledParamValues(this.macro, now);

    let processedValue = this.processTargetValue(targetValue, constant);

    switch (style) {
      case 'linear':
        param.linearRampToValueAtTime(processedValue, now + rampTime);
        break;
      case 'exponential':
        param.exponentialRampToValueAtTime(
          this.ensureNonZero(processedValue),
          now + rampTime
        );
        break;
      case 'setTargetAtTime':
        param.setTargetAtTime(processedValue, now, rampTime);
        // need to approximate completion time for timeouts if using setTargetAtTime, test this
        break;
    }

    // Schedule callback if provided
    if (onComplete) {
      const durationSec = style === 'setTargetAtTime' ? rampTime * 2 : rampTime;
      // const timeoutId = // Todo: cleanup considerations?
      setTimeout(onComplete, durationSec * 1000); // ms
    }

    return this;
  }

  snap(inputValue: number) {
    // snap to zero crossings
    if (!this.snapEnabled) return inputValue;
    const values = this.#allowedValues;

    return values.reduce((prev, curr) =>
      Math.abs(curr - inputValue) < Math.abs(prev - inputValue) ? curr : prev
    );
  }

  snapToNotePeriod(target: number, constant: number) {
    console.debug('\nEnter snapToNotePeriod');

    const allowedDistances = this.#allowedPeriods;
    const initialTargetDistance = Math.abs(constant - target);

    let closestAllowed = allowedDistances[0];
    let minDifference = Math.abs(initialTargetDistance - closestAllowed);

    // could use the fact allowedDistances are sorted (low to high)
    for (const dist of allowedDistances) {
      const difference = Math.abs(initialTargetDistance - dist);
      if (difference < minDifference) {
        minDifference = difference;
        closestAllowed = dist;
      }
    }

    const safePeriod = Math.max(closestAllowed, this.shortestPeriod); // should not be needed

    let returnValue: number = 0; // target
    if (this.#paramType === 'loopEnd') {
      returnValue = constant + safePeriod;
    } else if (this.#paramType === 'loopStart') {
      returnValue = constant - safePeriod;
    } else {
      console.warn("Macro's paramType not set");
    }

    // console.debug(
    //   `\nparamType: ${this.#paramType}
    //   \nCurrent Value: ${this.getValue()},
    //   \nTarget Value: ${target},
    //   \nBound constant: ${constant}
    //   \nReturn Value: ${returnValue}`
    // );
    return returnValue;
  }

  // Used to ensure that values passed into 'exponentialRamp' are non-zero
  ensureNonZero = (value: number) => {
    return Math.max(value, MacroParam.MIN_EXPONENTIAL_RAMP_VALUE);
  };

  /** SETTERS */

  setValue(value: number) {
    this.macro.setValueAtTime(value, this.now + 0.001);
    return this;
  }

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
    scale: keyof typeof NOTES.scales,
    customScalePattern?: number[]
  ) {
    const scalePattern = customScalePattern
      ? customScalePattern
      : NOTES.scales[scale];
    const { periodsInSec } = createScale(rootNote, scalePattern);
    this.#allowedPeriods = periodsInSec.sort((a, b) => a - b); // sort low to high

    return this;
  }

  /** GETTERS */

  getValue(): number {
    return this.#controlNode.gain.value;
  }

  get macro(): AudioParam {
    return this.#controlNode.gain;
  }

  get controlNode() {
    return this.#controlNode;
  }

  get type() {
    return this.#paramType;
  }

  get now() {
    return this.#context.currentTime;
  }

  get numSlaves() {
    return this.#slaveParams.length;
  }

  get snapEnabled() {
    return this.#allowedValues.length > 0;
  }

  get longestPeriod() {
    return this.#allowedPeriods[this.#allowedPeriods.length - 1];
  }

  get shortestPeriod() {
    return this.#allowedPeriods[0];
  }

  get numAllowedValues() {
    return this.#allowedValues.length;
  }

  dispose(): void {
    this.#constantSignal.stop();
    this.#constantSignal.disconnect();
    this.#controlNode.disconnect();
    deleteNodeId(this.nodeId);
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

// let testThreshold = 0.01;
// let targetPeriod = allowedDistances.find(
//   (period) => period - initialTargetDistance < testThreshold
// );

// if (targetPeriod) {
//   console.warn(`Target PERIOD: ${targetPeriod}`); // Always: 0.00031888161838798966

//   if (this.#paramType === 'loopEnd') return constant + targetPeriod;
//   else if (this.#paramType === 'loopStart')
//     return this.clampToMin(constant - targetPeriod);
// }
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

// function closestVal(
//   val: number,
//   arr: number[],
//   direction: 'larger' | 'smaller'
// ) {
//   if (direction === 'larger') {
//     arr.find((firstLarger) => firstLarger > val);
//   } else {
//     arr.find((firstSmaller) => firstSmaller < val);
//   }
// }

// ? trash

// onRampComplete = () => {
//   const previdx = this.rampTracker.periodIndex;
//   this.rampTracker = {
//     isRamping: false,
//     direction: null,
//     periodIndex: previdx, // ? or -1 ?
//     rampStarted: { time: -1, value: -1 },
//     rampEnded: { time: this.now, value: this.value },
//     scheduledCompletion: -1,
//   };

//   // const periodIndex = this.#allowedPeriods.indexOf(this.value);
//   // if (periodIndex > -1) {
//   //   this.rampTracker.periodIndex = periodIndex;
//   // } else {
//   //   console.warn(
//   //     'Ramp complete, but the current value is not in the allowed periods.'
//   //   );
//   // }

//   // Only clear timeouts that have completed
//   this.#pendingCallbacks = this.#pendingCallbacks.filter((callback) => {
//     if (callback.scheduledTime <= this.now) {
//       clearTimeout(callback.timeoutId);
//       return false; // Remove from array
//     }
//     return true; // Keep in array
//   });
// };

// rampTracker: {
//   isRamping: boolean;
//   direction: 'up' | 'down' | null;
//   periodIndex: number;
//   rampStarted: { time: number; value: number };
//   rampEnded: { time: number; value: number };
//   // if is ramping: last update is from ramp start
//   // if not: last update is from last ramp end
//   scheduledCompletion: number;
// } = {
//   isRamping: false,
//   direction: null,
//   periodIndex: -1,
//   rampStarted: { time: -1, value: -1 },
//   rampEnded: { time: -1, value: -1 },
//   scheduledCompletion: -1,
// };

// #shouldRamp(newTarget: number, snapToPeriod?: unknown) {
//   // be aware that ramp might be in progress from the other param, e.g. start if this is end
//   if (!this.rampTracker.isRamping) return true; // no ramp in progress
//   if (!snapToPeriod) return true; // TEMP: check

//   // const proposedDuration = snapToPeriod.end - snapToPeriod.start;

//   const now = this.now;
//   const periods = this.#allowedPeriods;
//   const { rampStarted, periodIndex, direction } = this.rampTracker;

//   const newRampDirection = newTarget > this.value ? 'up' : 'down';

//   if (direction !== newRampDirection) {
//     console.debug('ramp direction change occurred');
//     return true; // ramp direction changed
//   }

//   // if (direction === 'up') {
//   //   console.log(`next period should be ${periods[periodIndex + 1]}`);
//   // }

//   // const newPeriodIndex = this.#allowedPeriods.indexOf(..

//   if (now < rampStarted.time + 0.2) {
//     // test, optimize or remove
//     return false;
//   }

//   return true;
// }

// cancelRamp() {
//   this.#pendingCallbacks.forEach((callback) => {
//     clearTimeout(callback.timeoutId);
//   });
//   this.#pendingCallbacks = [];

//   this.rampTracker = {
//     isRamping: false,
//     direction: null,
//     periodIndex: -1,
//     rampStarted: { time: -1, value: -1 },
//     rampEnded: { time: -1, value: -1 },
//     scheduledCompletion: -1,
//   };
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
