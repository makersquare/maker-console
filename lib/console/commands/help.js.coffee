
helpCommand =
  desc: "Get details about a specific command"
  usage: '/help COMMAND'

  run: (app, commandName) ->
    if commandName
      this.showCommand(commandName)
    else
      this.showAllCommands()

  showCommand: (name) ->
    cmd = app.commands[name]
    output =
      """
      #{name}:
        #{cmd.desc}
        Usage: #{cmd.usage}
      """
    app.console.puts(output)

  showAllCommands: ->
    output = "Commands:\n"
    for name, cmd of app.commands
      output += "  #{name} - #{cmd.desc}\n"
    output += "Use `/help COMMAND` to get more details about a specific command."
    app.console.puts(output)

MKConsole.onInit (app) -> app.commands['help'] = helpCommand
