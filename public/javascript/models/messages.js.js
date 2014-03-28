var ChatRoom, Message;

Message = Backbone.Model.extend({});

ChatRoom = Backbone.Collection.extend({
  model: Message,
  comparator: function(m) {
    return -m.time;
  },
  initialize: function(models, options) {
    this.roomId = options.roomId;
    return this.listenTo(this.app.pubsub, 'stream:chat_message', this.addMessage);
  },
  addMessage: function(roomId, message) {
    if (roomId !== this.roomId) {
      return;
    }
    return this.add(message);
  }
});

MKS.onInit(function(app) {
  var createOrUpdateRoom;
  app.rooms || (app.rooms = {});
  createOrUpdateRoom = function(roomId, history) {
    var room;
    room = app.rooms[roomId];
    if (room) {
      return room.add(history);
    } else {
      room = app.rooms[roomId] = new ChatRoom(history, {
        app: app,
        roomId: roomId
      });
      return app.pubsub.trigger('chat_room_init', room);
    }
  };
  app.pubsub.on('whoami', function(data) {
    var history, roomId, _ref, _results;
    _ref = data.chat_history;
    _results = [];
    for (roomId in _ref) {
      history = _ref[roomId];
      _results.push(createOrUpdateRoom(roomId, history));
    }
    return _results;
  });
  return app.pubsub.on('stream:join_room', function(roomId, chatHistory) {
    console.log('Joining room:', roomId);
    createOrUpdateRoom(roomId, chatHistory);
    return app.roomViews[roomId].view();
  });
});
