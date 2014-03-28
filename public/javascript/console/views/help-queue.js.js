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
