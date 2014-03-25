
# Yep, inline templates. With coffeescript it might not be so bad.
layoutTemplate = _.template """
<div class="manager"></div>
<div class="requests"></div>
"""

helpTemplate = _.template """
<div class="help-request">
  <div class="author {{ me }}">{{ username }}</div>
  <div class="content">
    <div class="time">{{ formatedTime }}</div>
    <span class="team">[{{ roomName }}]</span>
    {{ content }}
  </div>
</div>
"""

MKS.HelpQueueView = Backbone.View.extend

  initialize: (options) ->
    @roomId = options.collection.roomId
    @tabId = "helpQueue"
    @console = @app.console

    this.listenTo(@collection, 'add', this.addMessage)

    # Add chat room tab to console
    @console.addTab(@tabId, { label: @roomName })
    this.render()

  addMessage: (message) ->
    @console.append(@tabId, this.present(message), { showInMain: true })

  render: ->
    html = ''
    html += this.present(message) for message in @collection.models
    @console.append(@tabId, html, { replace: true })

  view: -> @app.console.viewTab(@tabId)

  present: (message) ->
    data = message.toJSON()
    extra =
      content: _.linkify _.escape(data.content)
      formatedTime: moment(data.time).format('h:mma ddd')
      roomName: @roomName
      me: if data.userId == g.userId then 'me' else ''
    template _.extend(data, extra)

MKS.HelpQueueView.load = ->
  return unless g.userIsAdmin
  app.helpQueueView ||= new MKS.HelpQueueView()
