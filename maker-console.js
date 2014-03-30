var appClass, initializers;

initializers = [];

appClass = (window.MKConsole || (window.MKConsole = {}));

appClass.App = Backbone.View.extend({
  el: $(document),
  initialize: function() {
    var init, _i, _len, _results;
    this.pubsub = _.extend({}, Backbone.Events);
    this.commands = {};
    _results = [];
    for (_i = 0, _len = initializers.length; _i < _len; _i++) {
      init = initializers[_i];
      _results.push(init(this));
    }
    return _results;
  }
});

appClass.onInit = function(func) {
  return initializers.push(func);
};

var HelpQueue, Request;

Request = Backbone.Model.extend({});

HelpQueue = Backbone.Collection.extend({
  initialize: function(models, options) {
    this.app = options.app;
    return this.listenTo(this.app.pubsub, 'stream:help_queue_requests', this.add);
  }
});

MKConsole.onInit(function(app) {
  if (!g.userIsAdmin) {
    return;
  }
  return app.helpQueue || (app.helpQueue = new HelpQueue([], {
    app: app
  }));
});

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

MKConsole.onInit(function(app) {
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

MKConsole.Prefs = Backbone.Model.extend({
  initialize: function() {
    return this.on('change', (function(_this) {
      return function(prefs, options) {
        var prop, val, _ref, _results;
        _ref = prefs.changed;
        _results = [];
        for (prop in _ref) {
          val = _ref[prop];
          console.log('Updating pref:', prop, val);
          _results.push(app.stream.send('update_pref', prop, val));
        }
        return _results;
      };
    })(this));
  }
});

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
          _this.app.prefs = new MKConsole.Prefs(data.prefs);
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

MKConsole.onInit(function(app) {
  app.stream = new Stream({
    app: app
  });
  return app.stream.connect();
});

var ConsoleTabView, ConsoleView, defaultTabOptions, tabTemplate, template;

template = _.template("<div class=\"{{ className }}\" data-tab-id=\"{{ tabId }}\">{{ content }}</div>");

tabTemplate = function(tabId, className, content) {
  if (content == null) {
    content = '';
  }
  return template({
    tabId: tabId,
    content: content,
    className: className
  });
};

defaultTabOptions = {
  addContentMethod: 'append'
};

ConsoleTabView = Backbone.View.extend({
  el: '#console .tabs'
});

ConsoleView = Backbone.View.extend({
  el: '#console',
  events: {
    'click .toggle-interface': 'toggle',
    'keypress .interface input': 'handleInput',
    'click .interface .tab': 'onTabClick'
  },
  initialize: function() {
    this.input = this.$('.interface input');
    this.tabs = {};
    this.tabs['main'] = {
      id: 'main',
      tabDiv: this.$(".interface .tabs .tab[data-tab-id='main']"),
      output: this.$('.interface .output-scroller [data-tab-id="main"]'),
      addContentMethod: 'append',
      options: _.defaults({}, defaultTabOptions)
    };
    this.currentTab = this.tabs['main'];
    this.scroller = this.$('.interface .output-scroller');
    this.$el.show();
    return $(document).on('keypress', (function(_this) {
      return function(e) {
        if (e.ctrlKey && e.keyCode === 47) {
          return _this.toggle();
        }
      };
    })(this));
  },
  puts: function(content) {
    var method;
    method = this.currentTab.addContentMethod;
    this.currentTab.output[method]("<pre>" + content + "</pre>");
    return this.scroll();
  },
  addTab: function(tabId, options) {
    var tab;
    if (this.tabs[tabId]) {
      return;
    }
    tab = {
      id: tabId,
      tabDiv: $(tabTemplate(tabId, 'tab', options.label)),
      output: $(tabTemplate(tabId, 'output')),
      options: _.defaults(options, defaultTabOptions)
    };
    tab.addContentMethod = tab.options.addContentMethod;
    this.$('.interface .tabs').append(tab.tabDiv);
    this.$('.interface .output-scroller').append(tab.output);
    return this.tabs[tabId] = tab;
  },
  viewTab: function(tabId) {
    this.currentTab.output.hide();
    this.currentTab = this.tabs[tabId];
    this.currentTab.output.show();
    this.scroll();
    this.$('.tabs .tab').removeClass('active');
    return this.tabs[tabId].tabDiv.addClass('active');
  },
  append: function(tabId, content, _arg) {
    var method, replace, showInMain;
    showInMain = _arg.showInMain, replace = _arg.replace;
    method = replace ? 'html' : this.currentTab.addContentMethod;
    this.tabs[tabId].output[method](content);
    if (showInMain) {
      method = this.tabs['main'].addContentMethod;
      this.tabs['main'].output[method](content);
    }
    return this.scroll();
  },
  scroll: function() {
    if (this.currentTab.addContentMethod === 'prepend') {
      return;
    }
    return this.scroller.scrollTop(this.currentTab.output[0].scrollHeight);
  },
  toggle: function(e) {
    this.$('.interface').toggle();
    $('body').toggleClass('console');
    if (this.$('.interface').is(':visible')) {
      return this.$('.interface input').focus();
    }
  },
  onTabClick: function(e) {
    return this.viewTab(e.currentTarget.getAttribute('data-tab-id'));
  },
  handleInput: function(e) {
    var args, cmd, command, split;
    if (e.keyCode !== 13) {
      return;
    }
    split = this.input.val().split(' ');
    if (split[0][0] === '/') {
      cmd = split.shift().substring(1);
      args = split;
    } else {
      cmd = 'chat';
      args = ['send', void 0].concat(split);
    }
    args.unshift(this.app);
    this.input.val('');
    command = this.app.commands[cmd] || this.app.commandAliases[cmd];
    if (command) {
      return command.run.apply(command, args);
    } else {
      return this.puts("`/" + cmd + "` is not a command.");
    }
  }
});

MKConsole.onInit(function(app) {
  return app.console = new ConsoleView({
    app: app
  });
});

var DashboardView;

DashboardView = Backbone.View.extend({
  el: '#console .widgets',
  initialize: function(options) {
    this.widgets = [];
    this.listenTo(this.app.pubsub, 'dashboard:load', this.loadWidget);
    return this.$el.show();
  },
  loadWidget: function(wid, widget) {
    this.widgets.push(widgets);
    return this.render();
  },
  render: function() {
    return this.widgets.each(function(w) {
      return w.render();
    });
  }
});

MKConsole.onInit(function(app) {
  return app.dashboard = new DashboardView({
    app: app
  });
});
