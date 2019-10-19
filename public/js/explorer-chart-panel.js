(function (namespace) {
  namespace.explorer = namespace.explorer || {}
  const exports = namespace.explorer

  var questionMap = {}
  var initialQuestion, selectedTab
  // var primaryColors, hoverColors
  // TODO hard coded here as temporary hack, also input in constructor might be temporary
  const primaryColors = ['#9DC680', '#80AFC6', '#8B8BCB', '#AB8BCB', '#C68680', '#CBA46C', '#CBCB6C']
  const hoverColors = ['#D5F0C2', '#C2E0F0', '#C2C2F0', '#D9C2F0', '#F0C6C2', '#F0DDC2', '#F0F0C2']
  var usertexts, dichselectedMap, optionsMap, timepointsMap

  // Initialize the chart panel
  // TODO fix constructor
  exports.generateChartPanel = function (questions, groups, primaryColorsInput, hoverColorsInput, usertextsInput, dichselectedMapInput, optionsMapInput, timepointsMapInput) {
    // primaryColors = primaryColorsInput
    // hoverColors = hoverColorsInput
    usertexts = usertextsInput
    dichselectedMap = dichselectedMapInput
    optionsMap = optionsMapInput
    timepointsMap = timepointsMapInput

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
            if (classes[i] === 'freq' || classes[i] === 'mean' || classes[i] === 'dich') {
              setSelectedTab(classes[i].toUpperCase())
            }
          }
        })

    // Set chart tab names
    d3.select('.chart-tab.freq')
      .text(usertexts.chartTabFrequencies)
    d3.select('.chart-tab.mean')
      .text(usertexts.chartTabMeans)
    d3.select('.chart-tab.dich')
      .text(usertexts.chartTabDichotomized)

    // Apply special classes to style the tabs
    // TODO duplicate code, used again in chartSetQueryDefinition function, should probably be unified
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

    // Initialize chart resources
    daxplore.chart.meanbars.initializeChartResources(usertexts, questionMap, primaryColors, hoverColors)

    // TODO handle here or somewhere else?
    window.addEventListener('resize', daxplore.explorer.updateChartPanelSize)
    // hack to force initial sizing to work
    // TODO handle in different way
    for (i = 2; i <= 12; i++) {
      setTimeout(daxplore.explorer.updateChartPanelSize, Math.pow(2, i))
    }
  }

  // Getter for selected tab
  exports.getSelectedTab = function () {
    return selectedTab
  }

  exports.chartSetQueryDefinition = function (chartType, timepoints, stat, selectedOptions, dichSubtitle) {
    selectedTab = chartType
    var questionID = stat.q
    // TODO unused: var perspectiveID = stat['p']

    // Hide all charts elements
    // daxplore.chart.frequency.hide() // TODO
    daxplore.chart.meanbars.hide()
    // daxplore.chart.dichtimeline.hide() // TODO
    // TODO allow for animated updates of same chart type
    // d3.select('.chart')
    //     .selectAll(function () { return this.childNodes })
    //     .remove()
    //
    // d3.select('.legend').html('')
    //
    // d3.select('.daxplore-ExternalHeader-sub, .daxplore-ExternalHeader-dichsub, .daxplore-ExternalHeader-freq-tooltip')
    //   .text('')

    // Add new content
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

    // Select chart to displaytypes
    switch (selectedTab) {
    case 'FREQ':
      switch (timepoints) {
      case 'TIMEPOINTS_ONE':
      case 'TIMEPOINTS_TWO':
      case 'TIMEPOINTS_ALL':
        // TODO temporary hard coded timepoint
        daxplore.chart.frequency.generateChart(usertexts, questionMap, primaryColors, hoverColors, stat, selectedOptions, 4)
        daxplore.chart.frequency.generateLegend()
        break
      }
      break
    case 'MEAN':
      switch (timepoints) {
      case 'TIMEPOINTS_ONE':
        daxplore.chart.meanbars.populateChart(stat, selectedOptions)
        break
      case 'TIMEPOINTS_TWO':
        break
      case 'TIMEPOINTS_ALL':
        break
      }
      break
    case 'DICH':
      switch (timepoints) {
      case 'TIMEPOINTS_ONE':
      case 'TIMEPOINTS_TWO':
      case 'TIMEPOINTS_ALL':
        daxplore.chart.dichtimeline.generateChart(selectedOptions, stat, usertexts, dichselectedMap, optionsMap, timepointsMap, primaryColors, hoverColors)
        daxplore.chart.dichtimeline.generateLegend()
        break
      }
      break
    }
    // TODO
    // daxplore.explorer.updateChartPanelSize()
  }

  function setSelectedTab (tab) {
    if (selectedTab === tab) {
      return
    }
    selectedTab = tab
    daxplore.explorer.selectionUpdateCallback()
  }

  exports.updateChartPanelSize = function () {
    switch (selectedTab) {
    case 'FREQ':
      daxplore.chart.frequency.updateSize(350)
      break
    case 'MEAN':
      // TODO allow more height instead of vertical scroll
      // TODO hard coded based on specific chart, should be generalized, though if dynamic perspective picker will move up and down
      daxplore.chart.meanbars.setSize(800, 350)
      break
    case 'DICH':
      daxplore.chart.dichtimeline.updateSize(350)
      break
    }
  }
})(window.daxplore = window.daxplore || {})
