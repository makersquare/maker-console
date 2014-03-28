var joinCommand;

joinCommand = {
  desc: "Joins a new or existing room",
  usage: '/join ROOM_NAME',
  run: function(app, roomId) {
    var existingRoom;
    existingRoom = _.find(app.rooms, function(room, id) {
      return id === roomId;
    });
    if (existingRoom) {
      return app.console.viewTab("room:" + roomId);
    } else {
      app.console.puts("Joining room `" + roomId + "`...");
      return app.stream.send('join_room', roomId);
    }
  }
};

MKS.onInit(function(app) {
  if (!g.userIsAdmin) {
    return;
  }
  return app.commands['join'] = joinCommand;
});
