var noStrs, urlRegex, yesStrs;

_.templateSettings.interpolate = /\{\{(.+?)\}\}/g;

urlRegex = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

yesStrs = ['on', 'true', '1', 'up'];

noStrs = ['off', 'false', '0', 'down'];

_.mixin({
  getTemplate: function(name) {
    return _.template($('#templates .' + name).html());
  },
  splitPayload: function(payload, argCount) {
    var extra, result, split;
    split = payload.split('|');
    result = _.first(split, argCount);
    extra = _.rest(split, argCount);
    if (_.any(extra)) {
      result[result.length - 1] += '|' + extra.join('|');
    }
    return result;
  },
  ordinalize: function(num) {
    var end, lastTwo;
    lastTwo = num.toString().slice(-2);
    if (lastTwo === '11') {
      return '11th';
    }
    if (lastTwo === '12') {
      return '12th';
    }
    if (lastTwo === '13') {
      return '13th';
    }
    end = (function() {
      switch (num.toString().slice(-1)) {
        case '1':
          return 'st';
        case '2':
          return 'nd';
        case '3':
          return 'rd';
        default:
          return 'th';
      }
    })();
    return "" + num + end;
  },
  capitalize: function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
  },
  formatDate: function(date) {
    var ampm, hour, hourStr, minStr, minutes;
    hour = date.getHours();
    if (hour === 0) {
      hour = 12;
    } else if (hour > 12) {
      hour = hour - 12;
    }
    hourStr = hour < 10 ? "0" + hour : hour;
    minutes = date.getMinutes();
    minStr = minutes < 10 ? "0" + minutes : minutes;
    ampm = hour < 12 ? 'am' : 'pm';
    return "" + hourStr + ":" + minStr + " " + ampm;
  },
  linkify: function(text) {
    return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
  },
  yes: function(str) {
    return _.include(yesStrs, str);
  },
  no: function(str) {
    return _.include(noStrs, str);
  },
  isJSON: function(str) {
    if (!str) {
      return false;
    }
    str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
    str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
    str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
    return /^[\],:{}\s]*$/.test(str);
  }
});
