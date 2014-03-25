
Request = Backbone.Model.extend({})

HelpQueue = Backbone.Collection.extend
  initialize: (models, options) ->
    @app = options.app
    this.listenTo @app.pubsub, 'stream:help_queue_requests', this.add

MKS.onInit (app) ->
  return unless g.userIsAdmin
  app.helpQueue ||= new HelpQueue([], { app })
