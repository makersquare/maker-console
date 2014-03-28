var Stream,
  __slice = [].slice;

Stream = Backbone.View.extend({
  initialize: function(options) {
    this.lastConnected = null;
    this.heartbeatTimeout = null;
    _.bindAll(this, 'heartbeat');
    this.listenTo(this.app.pubsub, 'stream:auth_success', (function(_this) {
      return function() {
        $('body').addClass('online');
        _this.heartbeat();
        return _this.send('whoami', _this.lastConnected || '');
      };
    })(this));
    return this.listenTo(this.app.pubsub, 'stream:the_chosen_one', (function(_this) {
      return function(data) {
        var team, _i, _len, _ref;
        if (data.teams) {
          _this.app.teams = data.teams;
          _this.app.teamNames = {};
          _ref = data.teams;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            team = _ref[_i];
            _this.app.teamNames[team.id] = team.name;
          }
        }
        if (data.prefs) {
          _this.app.prefs = new MKS.Prefs(data.prefs);
        }
        return _this.app.pubsub.trigger('whoami', data);
      };
    })(this));
  },
  connect: function() {
    var socket;
    this.socket = socket = new ReconnectingWebSocket("ws://" + g.streamUrl);
    socket.onopen = function() {
      console.log("stream:open");
      return socket.send('2|auth|' + g.sid);
    };
    socket.onmessage = (function(_this) {
      return function(e) {
        var argCount, argStr, args, i, msg;
        if (e.data !== '1|x') {
          console.log("stream:message", e.data);
        }
        msg = e.data;
        argCount = parseInt(msg.split('|', 1)[0]);
        argStr = msg.substring(msg.indexOf('|') + 1);
        args = _.splitPayload(argStr, argCount);
        args[0] = "stream:" + args[0];
        try {
          i = args.length - 1;
          args[i] = JSON.parse(args[i]);
        } catch (_error) {
          e = _error;
        }
        return _this.app.pubsub.trigger.apply(_this.app.pubsub, args);
      };
    })(this);
    socket.onclose = (function(_this) {
      return function() {
        _this.lastConnected = Date.now();
        console.log("stream:close");
        $('body').removeClass('online');
        return clearTimeout(_this.heartbeatTimeout);
      };
    })(this);
    return socket.onerror = function(e, x) {
      return console.log('stream:error', e, x);
    };
  },
  send: function() {
    var i, messages;
    messages = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    i = messages.length - 1;
    if (typeof messages[i] === 'object') {
      messages[i] = JSON.stringify(messages[i]);
    }
    console.log('Sending', messages.join('|'));
    return this.socket.send(("" + messages.length + "|") + messages.join('|'));
  },
  heartbeat: function() {
    this.socket.send('2|echo|x');
    return this.heartbeatTimeout = setTimeout(this.heartbeat, 9847);
  }
});

MKS.onInit(function(app) {
  app.stream = new Stream({
    app: app
  });
  return app.stream.connect();
});
