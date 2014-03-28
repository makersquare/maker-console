var listCommand;

listCommand = {
  desc: "[ADMIN] List teams",
  usage: '/list teams',
  run: function(app, type) {
    if (type === 'teams') {
      app.console.puts("Fetching teams...");
      app.stream.send('list_all_teams');
    }
    if (type === 'rooms') {
      app.console.puts("Fetching rooms...");
      return app.stream.send('list_all_rooms');
    } else {
      return app.console.puts("list: `" + type + "` is not a valid subject.");
    }
  }
};

MKS.onInit(function(app) {
  if (!g.userIsAdmin) {
    return;
  }
  app.commands['list'] = listCommand;
  app.pubsub.on('stream:all_teams', function(teams) {
    var output, team, _i, _len;
    output = '';
    for (_i = 0, _len = teams.length; _i < _len; _i++) {
      team = teams[_i];
      output += "" + team.id + " - " + team.name + "\n";
    }
    return app.console.puts(output);
  });
  return app.pubsub.on('stream:all_rooms', function(roomList) {
    return app.console.puts("All Rooms:\n" + roomList);
  });
});
