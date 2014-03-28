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
