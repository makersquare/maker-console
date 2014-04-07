
## BACKBONE EXTENTIONS
Backbone.View = Backbone.View.exend
  constructor: (options) ->
    _.extend(this, _.pick(options, "app"))
    Backbone.View.prototype.apply(this, arguments)


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

appClass.onInit = (func) -> initializers.push(func)

