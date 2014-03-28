var chatCommand,
  __slice = [].slice;

chatCommand = {
  desc: "Sends a chat message to your classmates",
  usage: '/chat MESSAGE',
  run: function() {
    var app, match, message, messageParts, roomId, subcmd;
    app = arguments[0], subcmd = arguments[1], roomId = arguments[2], messageParts = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
    message = messageParts.join(' ');
    match = app.console.currentTab.id.match(/^room:([^ ]+)$/);
    if (match) {
      roomId = match[1];
    } else if (app.rooms.length === 1) {
      roomId = app.rooms[0].id;
    } else {
      app.console.puts("Please select a room to chat in.");
      app.console.input.val(message);
      return;
    }
    if (subcmd === 'send') {
      console.log('Sending chat message:', message, roomId);
      return app.stream.send('chat', roomId, message);
    }
  }
};

MKS.onInit(function(app) {
  return app.commands['chat'] = chatCommand;
});
