(function () {
  var analytics = window.analytics = window.analytics || [];
  if (analytics.initialize) return;
  if (analytics.invoked) {
    if (window.console && console.error) {
      console.error('Segment snippet included twice.');
    }
    return;
  }
  analytics.invoked = true;
  analytics.methods = [
    'trackSubmit',
    'trackClick',
    'trackLink',
    'trackForm',
    'pageview',
    'identify',
    'reset',
    'group',
    'track',
    'ready',
    'alias',
    'debug',
    'page',
    'once',
    'off',
    'on',
    'addSourceMiddleware',
    'addIntegrationMiddleware',
    'setAnonymousId',
    'addDestinationMiddleware'
  ];
  analytics.factory = function (method) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(method);
      analytics.push(args);
      return analytics;
    };
  };
  for (var i = 0; i < analytics.methods.length; i++) {
    var key = analytics.methods[i];
    analytics[key] = analytics.factory(key);
  }
  analytics.SNIPPET_VERSION = '4.15.2';
})();
