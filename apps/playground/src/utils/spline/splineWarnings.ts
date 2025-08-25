/** Script to suppress warnings from the spline viewer about passive event listeners */
(function () {
  const originalAddEventListener = EventTarget.prototype.addEventListener;

  EventTarget.prototype.addEventListener = function (type, listener, options) {
    const scrollBlockingEvents = [
      'wheel',
      'touchstart',
      'touchmove',
      'touchend',
      'touchcancel',
    ];

    if (scrollBlockingEvents.includes(type)) {
      if (options === undefined) {
        options = { passive: true };
      } else if (typeof options === 'object' && options.passive === undefined) {
        options = Object.assign({}, options, { passive: true });
      }
    }

    return originalAddEventListener.call(this, type, listener, options);
  };
})();
