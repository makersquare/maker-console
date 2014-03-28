var pingCommand,
  __slice = [].slice;

pingCommand = {
  desc: "Pings an instructor / TA",
  usage: '/ping PROBLEM_DESCRIPTION',
  run: function() {
    var app, message, messageParts;
    app = arguments[0], messageParts = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    message = messageParts.join(' ');
    console.log('Pinging instructor:', message);
    app.console.puts("Sending ping...");
    return app.queuePanel.sendHelpRequest(message).done(function() {
      return app.console.puts("Ping sent successfully (\"" + message + "\")");
    }).fail(this.handleError);
  },
  handleError: function(jqXHR, textStatus, errorThrown) {
    var msg, reason;
    reason = jqXHR.responseText;
    msg = null;
    if (reason.match('user_already_in_queue')) {
      msg = "ERROR: You are already in queue.";
    } else {
      msg = "ERROR: Ping could not be sent:\n  [" + textStatus + "] " + errorThrown;
    }
    return app.console.puts(msg);
  }
};

MKS.onInit(function(app) {
  return app.commands['ping'] = pingCommand;
});
