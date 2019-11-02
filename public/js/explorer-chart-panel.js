(function (namespace) {
  namespace.explorer = namespace.explorer || {}
  const exports = namespace.explorer

  var questionMap = {}
  var initialQuestion, selectedTab
  // var primaryColors, hoverColors
  // TODO hard coded here as temporary hack, also input in constructor might be temporary
  const primaryColors = ['#9DC680', '#80AFC6', '#8B8BCB', '#AB8BCB', '#C68680', '#CBA46C', '#CBCB6C']
  const hoverColors = ['#93C072', '#72A6C0', '#7D7DC5', '#A17DC5', '#C07972', '#C69A5D', '#C6C65D']
  const tooltipColors = ['#D5F0C2', '#C2E0F0', '#C2C2F0', '#D9C2F0', '#F0C6C2', '#F0DDC2', '#F0F0C2']

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
    dax.chart.meanbars.initializeResources(questionMap, primaryColors, hoverColors, tooltipColors)

    // TODO handle here or somewhere else?
    window.addEventListener('resize', dax.explorer.updateChartPanelSize)
    // hack to force initial sizing to work
    // TODO handle in different way
    for (i = 2; i <= 12; i++) {
      setTimeout(dax.explorer.updateChartPanelSize, Math.pow(2, i))
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
    // dax.chart.frequency.hide() // TODO
    dax.chart.meanbars.hide()
    // dax.chart.dichtimeline.hide() // TODO
    // TODO allow for animated updates of same chart type
    // d3.select('.chart')
    //     .selectAll(function () { return this.childNodes })
    //     .remove()
    //
    // d3.select('.legend').html('')
    //
    // d3.select('.external-header-sub, .external-header-dichsub, .external-header-freq-tooltip')
    //   .text('')

    // Add new content
    // var questionMeta = questionMap[questionID]
    // d3.select('.external-header-header').text(questionMeta.short)
    // if (questionMeta.short !== questionMeta.text) {
    //   d3.select('.external-header-sub').text(questionMeta.text)
    // }
    // d3.select('.external-header-dichsub').text(dichSubtitle)
    // d3.select('.external-header-freq-tooltip').text('')

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
        dax.chart.frequency.generateChart(usertexts, questionMap, primaryColors, hoverColors, stat, selectedOptions, 4)
        dax.chart.frequency.generateLegend()
        break
      }
      break
    case 'MEAN':
      switch (timepoints) {
      case 'TIMEPOINTS_ONE':
        dax.chart.meanbars.populateChart(stat, selectedOptions)
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
        dax.chart.dichtimeline.generateChart(selectedOptions, stat, usertexts, dichselectedMap, optionsMap, timepointsMap, primaryColors, hoverColors)
        dax.chart.dichtimeline.generateLegend()
        break
      }
      break
    }
    // TODO
    dax.explorer.updateChartPanelSize()
  }

  function setSelectedTab (tab) {
    if (selectedTab === tab) {
      return
    }
    selectedTab = tab
    dax.explorer.selectionUpdateCallback()
  }

  exports.updateChartPanelSize = function () {
    // Calculate available width, assuming to horizontal scroll for the page as a whole
    var availableWidth = document.documentElement.clientWidth - // window width
              d3.select('.question-panel').node().offsetWidth - // tree sidebar
              d3.select('.sidebar-column').node().offsetWidth - // right sidebar
              2 - // border of 1px + 1px (if changed here, needs to be changed in css)
              1 // 1 px fudge to account for rounding
    // Calculate minimum width needed for header
    var headerBlockWidth = d3.select('.external-header').node().offsetWidth

    // Calculate minimum width needed for the block under the chart
    var bottomBlockWidth = d3.select('.perspective-panel').node().offsetWidth
    var description = d3.select('.description-panel').node()
    if (description != null && description.offsetWidth > 0) {
      bottomBlockWidth += 250 // TODO hard coded
    }

    // Minimum width needed for the header and bottom blocks
    var topBotNeededWidth = Math.max(headerBlockWidth, bottomBlockWidth)

    // Use all the width available with no scrolling for the chart  unless the header or bottom
    // block require more width. In that case also allow the chart to be so big that the page as a
    // whole gets a vertical scroll bar. If the chart's minimum width is larger than the available
    // width then it's up to the chart to put itself in a horizontal scroll panel.
    var widthForChart = Math.max(availableWidth, topBotNeededWidth)
    switch (selectedTab) {
    case 'FREQ':
      dax.chart.frequency.updateSize(350)
      break
    case 'MEAN':
      // TODO allow more height instead of vertical scroll
      // TODO hard coded based on specific chart, should be generalized
      dax.chart.meanbars.setSize(widthForChart, 350)
      break
    case 'DICH':
      dax.chart.dichtimeline.updateSize(350)
      break
    }
  }
})(window.dax = window.dax || {})
