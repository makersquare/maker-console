
pingCommand =
  desc: "Pings an instructor / TA"
  usage: '/ping PROBLEM_DESCRIPTION'

  run: (app, messageParts...) ->
    message = messageParts.join(' ')
    console.log 'Pinging instructor:', message

    app.console.puts "Sending ping..."
    app.queuePanel.sendHelpRequest(message)
      .done(-> app.console.puts "Ping sent successfully (\"#{message}\")")
      .fail(@handleError)

  handleError: (jqXHR, textStatus, errorThrown) ->
    reason = jqXHR.responseText
    msg = null
    if reason.match('user_already_in_queue')
      msg = "ERROR: You are already in queue."
    else
      msg = "ERROR: Ping could not be sent:\n  [#{textStatus}] #{errorThrown}"

    app.console.puts(msg)

MKConsole.onInit (app) -> app.commands['ping'] = pingCommand
