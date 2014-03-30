
DashboardView = Backbone.View.extend
  el: '#console .widgets'

  initialize: (options) ->
    @widgets = []
    this.listenTo(@app.pubsub, 'dashboard:load', this.loadWidget)
    @$el.show()

  loadWidget: (wid, widget) ->
    @widgets.push(widgets)
    # TODO: ADD TO WIDGETS DIV
    this.render()

  render: ->
    @widgets.each (w) -> w.render()

MKConsole.onInit (app) ->
  app.dashboard = new DashboardView({ app: app })
