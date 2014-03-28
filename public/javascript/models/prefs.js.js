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
