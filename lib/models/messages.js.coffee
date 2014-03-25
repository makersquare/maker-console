
Message = Backbone.Model.extend({})

ChatRoom = Backbone.Collection.extend
  model: Message
  comparator: (m) -> -m.time

  initialize: (models, options) ->
    @roomId = options.roomId
    this.listenTo(@app.pubsub, 'stream:chat_message', this.addMessage)

  addMessage: (roomId, message) ->
    return if roomId != @roomId
    this.add(message)

MKS.onInit (app) ->
  app.rooms ||= {}

  createOrUpdateRoom = (roomId, history) ->
    room = app.rooms[roomId]
    if room
      room.add(history)
    else
      # console.log 'Initializing chat room data for', roomId, history
      room = app.rooms[roomId] = new ChatRoom(history, { app, roomId })
      app.pubsub.trigger('chat_room_init', room)

  app.pubsub.on 'whoami', (data) ->
    for roomId, history of data.chat_history
      createOrUpdateRoom(roomId, history)

  app.pubsub.on 'stream:join_room', (roomId, chatHistory) ->
    console.log 'Joining room:', roomId
    createOrUpdateRoom(roomId, chatHistory)

    # This assumes the chat room view was created immedietely
    app.roomViews[roomId].view()
