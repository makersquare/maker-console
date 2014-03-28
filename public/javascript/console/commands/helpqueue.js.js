var toggleHelpQueueCommand;

toggleHelpQueueCommand = {
  desc: "Toggles help queue notifications",
  usage: '/helpqueue (on|off)',
  alias: '/helpq',
  run: function(app, onOrOff) {
    var state, toggle;
    if (onOrOff === void 0 || _.yes(onOrOff)) {
      toggle = 'true';
    } else if (_.no(onOrOff)) {
      toggle = 'false';
    } else {
      app.console.puts("" + onOrOff + " is not a valid option");
      return;
    }
    state = toggle === 'true' ? 'on' : 'off';
    app.console.puts("Turning help queue " + state);
    return app.prefs.set('notifyHelpQueue', toggle);
  }
};

MKS.onInit(function(app) {
  if (!g.userIsAdmin) {
    return;
  }
  app.commands['helpqueue'] = toggleHelpQueueCommand;
  return app.commandAliases['helpq'] = toggleHelpQueueCommand;
});
