
template = _.template """
<div class="{{ className }}" data-tab-id="{{ tabId }}">{{ content }}</div>
"""

tabTemplate = (tabId, className, content='') ->
  template({ tabId, content, className })

defaultTabOptions = {
  addContentMethod: 'append'
}


ConsoleTabView = Backbone.View.extend
  el: '#console .tabs'

ConsoleView = Backbone.View.extend
  el: '#console'
  events:
    'click .toggle-interface': 'toggle'
    'keypress .interface input': 'handleInput'
    'click .interface .tab': 'onTabClick'

  initialize: ->
    @input = this.$('.interface input')
    @tabs = {}

    @tabs['main'] = {
      id: 'main'
      tabDiv: this.$(".interface .tabs .tab[data-tab-id='main']")
      output: this.$('.interface .output-scroller [data-tab-id="main"]')
      addContentMethod: 'append'
      options: _.defaults({}, defaultTabOptions)
    }
    @currentTab = @tabs['main']

    @scroller = this.$('.interface .output-scroller')

    @$el.show()
    $(document).on 'keypress', (e) =>
      this.toggle() if e.ctrlKey && e.keyCode == 47

  puts: (content) ->
    method = @currentTab.addContentMethod
    @currentTab.output[method]("<pre>#{content}</pre>")
    this.scroll()

  addTab: (tabId, options) ->
    return if @tabs[tabId]
    tab = {
      id: tabId
      tabDiv: $ tabTemplate(tabId, 'tab', options.label)
      output: $ tabTemplate(tabId, 'output')
      options: _.defaults(options, defaultTabOptions)
    }
    tab.addContentMethod = tab.options.addContentMethod

    this.$('.interface .tabs').append(tab.tabDiv)
    this.$('.interface .output-scroller').append(tab.output)
    @tabs[tabId] = tab

  viewTab: (tabId) ->
    @currentTab.output.hide()
    @currentTab = @tabs[tabId]
    @currentTab.output.show()

    this.scroll()

    # Visually select tab
    this.$('.tabs .tab').removeClass('active')
    @tabs[tabId].tabDiv.addClass('active')

  append: (tabId, content, { showInMain, replace }) ->
    method = if replace then 'html' else @currentTab.addContentMethod
    @tabs[tabId].output[method](content)

    if showInMain
      method = @tabs['main'].addContentMethod
      @tabs['main'].output[method](content)

    this.scroll()

  scroll: ->
    return if @currentTab.addContentMethod == 'prepend'
    @scroller.scrollTop( @currentTab.output[0].scrollHeight )

  toggle: (e) ->
    this.$('.interface').toggle()
    $('body').toggleClass('console')
    if this.$('.interface').is(':visible')
      this.$('.interface input').focus()

  onTabClick: (e) ->
    this.viewTab e.currentTarget.getAttribute('data-tab-id')

  handleInput: (e) ->
    return unless e.keyCode == 13

    split = @input.val().split(' ')
    if split[0][0] == '/'
      cmd = split.shift().substring(1)
      args = split
    else
      cmd = 'chat'
      args = ['send', undefined].concat(split)

    args.unshift(@app)

    # Clear input before anything goes wrong
    @input.val('')

    # Run command
    command = @app.commands[cmd] || @app.commandAliases[cmd]
    if command
      command.run.apply(command, args)
    else
      this.puts "`/#{cmd}` is not a command."


MKConsole.onInit (app) ->
  app.console = new ConsoleView({ app: app })
