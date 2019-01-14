(function (namespace) {
  namespace.explorer = namespace.explorer || {}
  const exports = namespace.explorer

  var questionMap = {}
  var initialQuestion, selectedTab
  var primaryColors, hoverColors
  var usertexts

  // Initialize the chart panel
  // TODO fix constructor
  exports.generateChartPanel = function (questions, groups, primaryColorsInput, hoverColorsInput, usertextsInput) {
    primaryColors = primaryColorsInput
    hoverColors = hoverColorsInput
    usertexts = usertextsInput

    // Unpack the data
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i]
      questionMap[q.column] = q
    }
    initialQuestion = groups[0].questions[0]
    selectedTab = questionMap[initialQuestion].displaytypes[0]
    var displaytypes = questionMap[initialQuestion].displaytypes

    // Add click events to the tabs
    d3.selectAll('.chart-tab')
      .on('click',
        function () {
          var classes = this.classList
          for (var i = 0; i < classes.length; i++) {
            if (classes[i] === 'frequency' || classes[i] === 'mean' || classes[i] === 'dichotomized' || classes[i] === 'mean') {
              setSelectedTab(classes[i].toUpperCase())
            }
          }
        })

    // Apply special classes to style the tabs
    // TODO duplicate code, used again in chartSetQUeeryDefinition function, should probably be unified
    d3.selectAll('.chart-tab, .chart-tab-spacing')
      .style('display', function (d, i, tabs) {
        if (displaytypes.length <= 1) {
          return 'none'
        }
        for (var j = 0; j < displaytypes.length; j++) {
          if (tabs[i].classList.contains(displaytypes[j].toLowerCase())) {
            return 'block'
          }
        }
        return 'none'
      })
  }

  // Getter for selected tab
  exports.getSelectedTab = function () {
    return selectedTab
  }

  exports.chartSetQueryDefinition = function (charttype, timepoints, stat, selectedOptions, dichSubtitle) {
    selectedTab = charttype
    var questionID = stat['q']
    // TODO unused: var perspectiveID = stat['p']

    var questionMeta = questionMap[questionID]
    d3.select('.daxplore-ExternalHeader-header').text(questionMeta.short)
    if (questionMeta.short !== questionMeta.text) {
      d3.select('.daxplore-ExternalHeader-sub').text(questionMeta.text)
    }
    d3.select('.daxplore-ExternalHeader-dichsub').text(dichSubtitle)
    d3.select('.daxplore-ExternalHeader-freq-tooltip').text('')

    // reset any side scroll set by previous charts
    d3.select('.chart-panel')
      .classed('chart-scroll', false)
      .style('width', null)

    var displaytypes = questionMap[questionID].displaytypes
    d3.selectAll('.chart-tab')
      .classed('chart-tab-selected', function (d, i, tabs) { return tabs[i].classList.contains(selectedTab.toLowerCase()) })

    d3.selectAll('.chart-tab, .chart-tab-spacing')
      .style('display', function (d, i, tabs) {
        if (displaytypes.length <= 1) {
          return 'none'
        }
        for (var j = 0; j < displaytypes.length; j++) {
          if (tabs[i].classList.contains(displaytypes[j].toLowerCase())) {
            return 'block'
          }
        }
        return 'none'
      })

    // TODO allow for animated updates of same chart type
    d3.select('.chart-panel')
        .selectAll(function () { return this.childNodes })
        .remove()

    // Select chart to displaytypes
    switch (selectedTab) {
    case 'FREQUENCY':
      switch (timepoints) {
      case 'TIMEPOINTS_ONE':
      case 'TIMEPOINTS_TWO':
      case 'TIMEPOINTS_ALL':
        // TODO temporary hardcoded timepoint
        daxplore.chart.frequency.generateChart(primaryColors, hoverColors, stat, selectedOptions, 4)
        daxplore.chart.frequency.generateLegend()
        break
      }
      break
    case 'MEAN':
      switch (timepoints) {
      case 'TIMEPOINTS_ONE':
        daxplore.chart.mean.generateChart(usertexts, questionMap, selectedOptions, stat)
        daxplore.chart.mean.generateLegend()
        break
      case 'TIMEPOINTS_TWO':
        break
      case 'TIMEPOINTS_ALL':
        break
      }
      break
    case 'DICHOTOMIZED':
      switch (timepoints) {
      case 'TIMEPOINTS_ONE':
      case 'TIMEPOINTS_TWO':
      case 'TIMEPOINTS_ALL':
        daxplore.chart.dichtimeline.generateChart(selectedOptions, stat, primaryColors, hoverColors)
        daxplore.chart.dichtimeline.generateLegend()
        break
      }
      break
    }
    daxplore.explorer.updateChartPanelSize()
  }

  function setSelectedTab (tab) {
    if (selectedTab === tab) {
      return
    }
    selectedTab = tab
    // TODO replace gwt callback with js callback
    // gwtChartPanelCallback(tab)
    daxplore.explorer.selectionUpdateCallback()
  }

  exports.updateChartPanelSize = function () {
    switch (selectedTab) {
    case 'FREQUENCY':
      daxplore.chart.frequency.updateSize(350)
      break
    case 'MEAN':
    // TODO allow more height instead of vertical scroll
      daxplore.chart.mean.updateSize(350)
      break
    case 'DICHOTOMIZED':
      daxplore.chart.dichtimeline.updateSize(350)
      break
    }
  }
})(window.daxplore = window.daxplore || {})
