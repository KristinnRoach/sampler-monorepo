import { isCancelAndHoldSupported } from './environment';

export function cancelScheduledParamValues(param: AudioParam, now: number) {
  isCancelAndHoldSupported()
    ? param.cancelAndHoldAtTime(now) // not supported in firefox
    : param.cancelScheduledValues(now);
}
