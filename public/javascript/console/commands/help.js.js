var helpCommand;

helpCommand = {
  desc: "Get details about a specific command",
  usage: '/help COMMAND',
  run: function(app, commandName) {
    if (commandName) {
      return this.showCommand(commandName);
    } else {
      return this.showAllCommands();
    }
  },
  showCommand: function(name) {
    var cmd, output;
    cmd = app.commands[name];
    output = "" + name + ":\n  " + cmd.desc + "\n  Usage: " + cmd.usage;
    return app.console.puts(output);
  },
  showAllCommands: function() {
    var cmd, name, output, _ref;
    output = "Commands:\n";
    _ref = app.commands;
    for (name in _ref) {
      cmd = _ref[name];
      output += "  " + name + " - " + cmd.desc + "\n";
    }
    output += "Use `/help COMMAND` to get more details about a specific command.";
    return app.console.puts(output);
  }
};

MKS.onInit(function(app) {
  return app.commands['help'] = helpCommand;
});
