
toggleHelpQueueCommand =
  desc: "Toggles help queue notifications"
  usage: '/helpqueue (on|off)'
  alias: '/helpq'

  run: (app, onOrOff) ->
    # Be lenient in reading
    if onOrOff == undefined || _.yes(onOrOff)
      toggle = 'true'
    else if _.no(onOrOff)
      toggle = 'false'
    else
      app.console.puts "#{onOrOff} is not a valid option"
      return

    state = if toggle == 'true' then 'on' else 'off'
    app.console.puts "Turning help queue #{state}"
    app.prefs.set 'notifyHelpQueue', toggle

MKConsole.onInit (app) ->
  return unless g.userIsAdmin
  app.commands['helpqueue'] = toggleHelpQueueCommand
  app.commandAliases['helpq'] = toggleHelpQueueCommand
