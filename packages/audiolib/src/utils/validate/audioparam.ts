import { isCancelAndHoldSupported } from './environment';

export function cancelScheduledParamValues(
  param: AudioParam | AudioParam[],
  now: number
) {
  const cancelMethod = isCancelAndHoldSupported()
    ? 'cancelAndHoldAtTime' // not supported in firefox
    : 'cancelScheduledValues';

  if (Array.isArray(param)) {
    param.forEach((p) => p[cancelMethod](now));
  } else {
    param[cancelMethod](now);
  }
}

// Original function below, delete once above is confirmed to work
// export function cancelScheduledParamValues(param: AudioParam, now: number) {
//   isCancelAndHoldSupported()
//     ? param.cancelAndHoldAtTime(now) // not supported in firefox
//     : param.cancelScheduledValues(now);
// }
