
Stream = Backbone.View.extend
  initialize: (options) ->
    @lastConnected = null
    @heartbeatTimeout = null

    # Bind the value of `this` so we can easily use `setTimeout`
    _.bindAll this, 'heartbeat'

    # Do things when we know we're authenticated
    this.listenTo @app.pubsub, 'stream:auth_success', =>
      $('body').addClass('online')
      this.heartbeat()
      # Only ask for data if we need it
      this.send 'whoami', (@lastConnected || '')

    # Listen for init data
    this.listenTo @app.pubsub, 'stream:the_chosen_one', (data) =>
      if data.teams
        @app.teams = data.teams
        @app.teamNames = {}
        @app.teamNames[team.id] = team.name for team in data.teams
      if data.prefs
        @app.prefs = new MKConsole.Prefs(data.prefs)

      @app.pubsub.trigger 'whoami', data

  connect: ->
    @socket = socket = new ReconnectingWebSocket("ws://#{g.streamUrl}");

    # Set event handlers.
    socket.onopen = ->
      console.log("stream:open")
      socket.send('2|auth|' + g.sid);

    socket.onmessage = (e) =>
      # e.data contains received string.
      console.log("stream:message", e.data) unless e.data == '1|x'
      msg = e.data

      argCount = parseInt(msg.split('|', 1)[0])
      argStr = msg.substring(msg.indexOf('|') + 1)
      args = _.splitPayload(argStr, argCount)

      # The first is the event name
      args[0] = "stream:#{args[0]}"

      # Attempt to parse last argument as JSON
      try
        i = args.length - 1
        args[i] = JSON.parse(args[i])
      catch e
        # Do nothing!

      # TODO: Consider security implications
      @app.pubsub.trigger.apply(@app.pubsub, args)

    socket.onclose = =>
      @lastConnected = Date.now()
      console.log("stream:close")
      $('body').removeClass('online')
      clearTimeout(@heartbeatTimeout)

    socket.onerror = (e,x) ->
      console.log('stream:error', e,x)

  send: (messages...) ->
    # Stringify last argument if it's an object
    i = messages.length - 1
    messages[i] = JSON.stringify messages[i] if typeof messages[i] == 'object'

    console.log 'Sending', messages.join '|'
    @socket.send("#{messages.length}|" + messages.join '|')

  heartbeat: ->
    @socket.send('2|echo|x')
    @heartbeatTimeout = setTimeout this.heartbeat, 9847

MKConsole.onInit (app) ->
  app.stream = new Stream({ app: app })
  app.stream.connect()
