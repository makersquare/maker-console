
# Yep, inline templates. With coffeescript it might not be so bad.
# Let's experiment.
template = _.template """
<div class="chat-message">
  <div class="author {{ me }}">{{ username }}</div>
  <div class="content">
    <div class="time">{{ formatedTime }}</div>
    <span class="team">[{{ roomName }}]</span>
    {{ content }}
  </div>
</div>
"""

ChatRoomView = Backbone.View.extend

  initialize: (options) ->
    @roomId = options.collection.roomId
    @tabId = "room:#{@roomId}"
    @console = @app.console

    this.listenTo(@collection, 'add', this.addMessage)

    # Add chat room tab to console
    if @roomId.match /^team\-/
      @roomName = @app.teamNames[ parseInt @roomId.split('-')[1] ]
    else
      @roomName = @roomId
    @console.addTab(@tabId, { label: @roomName })
    this.render()

  addMessage: (message) ->
    @console.append(@tabId, this.present(message), { showInMain: true })

  render: ->
    html = ''
    html += this.present(message) for message in @collection.models
    @console.append(@tabId, html, { replace: true })

  view: -> @console.viewTab(@tabId)

  present: (message) ->
    data = message.toJSON()
    extra =
      content: _.linkify _.escape(data.content)
      formatedTime: moment(data.time).format('h:mma ddd')
      roomName: @roomName
      me: if data.userId == g.userId then 'me' else ''
    template _.extend(data, extra)

MKS.onInit (app) ->
  app.roomViews ||= {}

  app.pubsub.on 'chat_room_init', (chatRoom) ->
    # console.log 'Initializing chat room view for', chatRoom.roomId
    app.roomViews[chatRoom.roomId] = new ChatRoomView({ app, collection: chatRoom })
