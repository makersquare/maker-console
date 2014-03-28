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
