var noStrs, urlRegex, yesStrs;

_.templateSettings.interpolate = /\{\{(.+?)\}\}/g;

urlRegex = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

yesStrs = ['on', 'true', '1', 'up'];

noStrs = ['off', 'false', '0', 'down'];

_.mixin({
  getTemplate: function(name) {
    return _.template($('#templates .' + name).html());
  },
  splitPayload: function(payload, argCount) {
    var extra, result, split;
    split = payload.split('|');
    result = _.first(split, argCount);
    extra = _.rest(split, argCount);
    if (_.any(extra)) {
      result[result.length - 1] += '|' + extra.join('|');
    }
    return result;
  },
  ordinalize: function(num) {
    var end, lastTwo;
    lastTwo = num.toString().slice(-2);
    if (lastTwo === '11') {
      return '11th';
    }
    if (lastTwo === '12') {
      return '12th';
    }
    if (lastTwo === '13') {
      return '13th';
    }
    end = (function() {
      switch (num.toString().slice(-1)) {
        case '1':
          return 'st';
        case '2':
          return 'nd';
        case '3':
          return 'rd';
        default:
          return 'th';
      }
    })();
    return "" + num + end;
  },
  capitalize: function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
  },
  formatDate: function(date) {
    var ampm, hour, hourStr, minStr, minutes;
    hour = date.getHours();
    if (hour === 0) {
      hour = 12;
    } else if (hour > 12) {
      hour = hour - 12;
    }
    hourStr = hour < 10 ? "0" + hour : hour;
    minutes = date.getMinutes();
    minStr = minutes < 10 ? "0" + minutes : minutes;
    ampm = hour < 12 ? 'am' : 'pm';
    return "" + hourStr + ":" + minStr + " " + ampm;
  },
  linkify: function(text) {
    return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
  },
  yes: function(str) {
    return _.include(yesStrs, str);
  },
  no: function(str) {
    return _.include(noStrs, str);
  },
  isJSON: function(str) {
    if (!str) {
      return false;
    }
    str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
    str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
    str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
    return /^[\],:{}\s]*$/.test(str);
  }
});

var HelpQueue, Request;

Request = Backbone.Model.extend({});

HelpQueue = Backbone.Collection.extend({
  initialize: function(models, options) {
    this.app = options.app;
    return this.listenTo(this.app.pubsub, 'stream:help_queue_requests', this.add);
  }
});

MKS.onInit(function(app) {
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

MKS.Prefs = Backbone.Model.extend({
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

MKS.onInit(function(app) {
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

MKS.onInit(function(app) {
  return app.dashboard = new DashboardView({
    app: app
  });
});

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

var helpCommand;

helpCommand = {
  desc: "Get details about a specific command",
  usage: '/help COMMAND',
  run: function(app, commandName) {
    if (commandName) {
      return this.showCommand(commandName);
    } else {
      return this.showAllCommands();
    }
  },
  showCommand: function(name) {
    var cmd, output;
    cmd = app.commands[name];
    output = "" + name + ":\n  " + cmd.desc + "\n  Usage: " + cmd.usage;
    return app.console.puts(output);
  },
  showAllCommands: function() {
    var cmd, name, output, _ref;
    output = "Commands:\n";
    _ref = app.commands;
    for (name in _ref) {
      cmd = _ref[name];
      output += "  " + name + " - " + cmd.desc + "\n";
    }
    output += "Use `/help COMMAND` to get more details about a specific command.";
    return app.console.puts(output);
  }
};

MKS.onInit(function(app) {
  return app.commands['help'] = helpCommand;
});

var toggleHelpQueueCommand;

toggleHelpQueueCommand = {
  desc: "Toggles help queue notifications",
  usage: '/helpqueue (on|off)',
  alias: '/helpq',
  run: function(app, onOrOff) {
    var state, toggle;
    if (onOrOff === void 0 || _.yes(onOrOff)) {
      toggle = 'true';
    } else if (_.no(onOrOff)) {
      toggle = 'false';
    } else {
      app.console.puts("" + onOrOff + " is not a valid option");
      return;
    }
    state = toggle === 'true' ? 'on' : 'off';
    app.console.puts("Turning help queue " + state);
    return app.prefs.set('notifyHelpQueue', toggle);
  }
};

MKS.onInit(function(app) {
  if (!g.userIsAdmin) {
    return;
  }
  app.commands['helpqueue'] = toggleHelpQueueCommand;
  return app.commandAliases['helpq'] = toggleHelpQueueCommand;
});

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

var pingCommand,
  __slice = [].slice;

pingCommand = {
  desc: "Pings an instructor / TA",
  usage: '/ping PROBLEM_DESCRIPTION',
  run: function() {
    var app, message, messageParts;
    app = arguments[0], messageParts = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    message = messageParts.join(' ');
    console.log('Pinging instructor:', message);
    app.console.puts("Sending ping...");
    return app.queuePanel.sendHelpRequest(message).done(function() {
      return app.console.puts("Ping sent successfully (\"" + message + "\")");
    }).fail(this.handleError);
  },
  handleError: function(jqXHR, textStatus, errorThrown) {
    var msg, reason;
    reason = jqXHR.responseText;
    msg = null;
    if (reason.match('user_already_in_queue')) {
      msg = "ERROR: You are already in queue.";
    } else {
      msg = "ERROR: Ping could not be sent:\n  [" + textStatus + "] " + errorThrown;
    }
    return app.console.puts(msg);
  }
};

MKS.onInit(function(app) {
  return app.commands['ping'] = pingCommand;
});

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

var helpTemplate, layoutTemplate;

layoutTemplate = _.template("<div class=\"manager\"></div>\n<div class=\"requests\"></div>");

helpTemplate = _.template("<div class=\"help-request\">\n  <div class=\"author {{ me }}\">{{ username }}</div>\n  <div class=\"content\">\n    <div class=\"time\">{{ formatedTime }}</div>\n    <span class=\"team\">[{{ roomName }}]</span>\n    {{ content }}\n  </div>\n</div>");

MKS.HelpQueueView = Backbone.View.extend({
  initialize: function(options) {
    this.roomId = options.collection.roomId;
    this.tabId = "helpQueue";
    this.console = this.app.console;
    this.listenTo(this.collection, 'add', this.addMessage);
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
    return this.app.console.viewTab(this.tabId);
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

MKS.HelpQueueView.load = function() {
  if (!g.userIsAdmin) {
    return;
  }
  return app.helpQueueView || (app.helpQueueView = new MKS.HelpQueueView());
};
