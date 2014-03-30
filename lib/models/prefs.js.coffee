
MKConsole.Prefs = Backbone.Model.extend
  initialize: ->
    this.on 'change', (prefs, options) =>
      for prop, val of prefs.changed
        console.log 'Updating pref:', prop, val
        app.stream.send('update_pref', prop, val)
