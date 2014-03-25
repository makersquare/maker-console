
chatCommand =
  desc: "Sends a chat message to your classmates"
  usage: '/chat MESSAGE'

  run: (app, subcmd, roomId, messageParts...) ->
    message = messageParts.join(' ')

    # Attempt to find active tab
    match = app.console.currentTab.id.match /^room:([^ ]+)$/
    if match
      roomId = match[1]
    else if app.rooms.length == 1
      roomId = app.rooms[0].id
    else
      app.console.puts "Please select a room to chat in."
      app.console.input.val(message)
      return

    if subcmd == 'send'
      console.log 'Sending chat message:', message, roomId
      app.stream.send('chat', roomId, message)

    # TODO: Once notifications are in place, write subcmd
    #       for turning on/off chat

MKS.onInit (app) -> app.commands['chat'] = chatCommand
