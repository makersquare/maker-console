# ## BACKBONE EXTENTIONS
# Backbone.View = Backbone.View.exend
#   constructor: (options) ->
#     @app = options.app




initializers = []

appClass = (window.MKConsole ||= {})

appClass.App = Backbone.View.extend
  el: $(document)
  initialize: ->
    # Event Aggregator
    @pubsub = _.extend({}, Backbone.Events)
    @commands = {}

    init(this) for init in initializers


appClass.config =
    userIsAdmin: false
    streamUrl:

appClass.onInit = (func) -> initializers.push(func)

