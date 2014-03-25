_.templateSettings.interpolate = /\{\{(.+?)\}\}/g

urlRegex = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig

yesStrs = ['on', 'true', '1', 'up']
noStrs = ['off', 'false', '0', 'down']

# Add our own utility functions to underscore
_.mixin
  getTemplate: (name) -> _.template $('#templates .' + name).html()

  splitPayload: (payload, argCount) ->
    split = payload.split('|')
    result = _.first(split, argCount)
    extra = _.rest(split, argCount)

    if _.any(extra)
      # Append extras to last argument
      result[result.length - 1] += '|' + extra.join('|')
    result

  ordinalize: (num) ->
    # Edge cases
    lastTwo = num.toString().slice(-2)
    return '11th' if lastTwo == '11'
    return '12th' if lastTwo == '12'
    return '13th' if lastTwo == '13'

    # All others
    end = switch num.toString().slice(-1)
      when '1' then 'st'
      when '2' then 'nd'
      when '3' then 'rd'
      else 'th'
    "#{num}#{end}"

  capitalize: (str) ->
    str.charAt(0).toUpperCase() + str.substring(1).toLowerCase()

  formatDate: (date) ->
    hour = date.getHours()
    if hour == 0
      hour = 12
    else if hour > 12
      hour = hour - 12

    hourStr = if hour < 10 then "0#{hour}" else hour

    minutes = date.getMinutes()
    minStr = if minutes < 10 then "0#{minutes}" else minutes

    ampm = if hour < 12 then 'am' else 'pm'

    "#{hourStr}:#{minStr} #{ampm}"

  linkify: (text) ->
    text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>')

  yes: (str) -> _.include yesStrs, str
  no: (str) -> _.include noStrs, str

  isJSON: (str) ->
    return false if !str
    str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
    str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
    str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '')
    (/^[\],:{}\s]*$/).test(str)
