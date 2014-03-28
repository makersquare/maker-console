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
