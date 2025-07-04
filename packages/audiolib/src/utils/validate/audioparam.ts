import { isCancelAndHoldSupported } from './environment';

export function cancelScheduledParamValues(
  param: AudioParam | AudioParam[],
  timestamp: number,
  holdValue?: number
) {
  const paramsToProcess = Array.isArray(param) ? param : [param];

  paramsToProcess.forEach((p) => {
    if (isCancelAndHoldSupported()) {
      p.cancelAndHoldAtTime(timestamp);
    } else {
      p.cancelScheduledValues(timestamp);
      p.setValueAtTime(
        holdValue !== undefined ? holdValue : p.value,
        timestamp
      );
    }
  });
}
