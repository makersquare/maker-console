
joinCommand =
  desc: "Joins a new or existing room"
  usage: '/join ROOM_NAME'

  run: (app, roomId) ->
    existingRoom = _.find app.rooms, (room, id) -> id == roomId
    if existingRoom
      app.console.viewTab("room:#{roomId}")
    else
      app.console.puts "Joining room `#{roomId}`..."
      app.stream.send('join_room', roomId)

MKS.onInit (app) ->
  return unless g.userIsAdmin
  app.commands['join'] = joinCommand
