
listCommand =
  desc: "[ADMIN] List teams"
  usage: '/list teams'

  run: (app, type) ->
    if type == 'teams'
      app.console.puts "Fetching teams..."
      app.stream.send('list_all_teams')
    if type == 'rooms'
      app.console.puts "Fetching rooms..."
      app.stream.send('list_all_rooms')
    else
      app.console.puts "list: `#{type}` is not a valid subject."

MKS.onInit (app) ->
  return unless g.userIsAdmin
  app.commands['list'] = listCommand

  app.pubsub.on 'stream:all_teams', (teams) ->
    output = ''
    output += "#{team.id} - #{team.name}\n" for team in teams
    app.console.puts(output)

  app.pubsub.on 'stream:all_rooms', (roomList) ->
    app.console.puts("All Rooms:\n#{roomList}")
