var ChatRoomView, template;

template = _.template("<div class=\"chat-message\">\n  <div class=\"author {{ me }}\">{{ username }}</div>\n  <div class=\"content\">\n    <div class=\"time\">{{ formatedTime }}</div>\n    <span class=\"team\">[{{ roomName }}]</span>\n    {{ content }}\n  </div>\n</div>");

ChatRoomView = Backbone.View.extend({
  initialize: function(options) {
    this.roomId = options.collection.roomId;
    this.tabId = "room:" + this.roomId;
    this.console = this.app.console;
    this.listenTo(this.collection, 'add', this.addMessage);
    if (this.roomId.match(/^team\-/)) {
      this.roomName = this.app.teamNames[parseInt(this.roomId.split('-')[1])];
    } else {
      this.roomName = this.roomId;
    }
    this.console.addTab(this.tabId, {
      label: this.roomName
    });
    return this.render();
  },
  addMessage: function(message) {
    return this.console.append(this.tabId, this.present(message), {
      showInMain: true
    });
  },
  render: function() {
    var html, message, _i, _len, _ref;
    html = '';
    _ref = this.collection.models;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      message = _ref[_i];
      html += this.present(message);
    }
    return this.console.append(this.tabId, html, {
      replace: true
    });
  },
  view: function() {
    return this.console.viewTab(this.tabId);
  },
  present: function(message) {
    var data, extra;
    data = message.toJSON();
    extra = {
      content: _.linkify(_.escape(data.content)),
      formatedTime: moment(data.time).format('h:mma ddd'),
      roomName: this.roomName,
      me: data.userId === g.userId ? 'me' : ''
    };
    return template(_.extend(data, extra));
  }
});

MKS.onInit(function(app) {
  app.roomViews || (app.roomViews = {});
  return app.pubsub.on('chat_room_init', function(chatRoom) {
    return app.roomViews[chatRoom.roomId] = new ChatRoomView({
      app: app,
      collection: chatRoom
    });
  });
});
