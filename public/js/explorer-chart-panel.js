(function (namespace) {
  namespace.explorer = namespace.explorer || {}
  const exports = namespace.explorer

  const questionMap = {}
  let initialQuestion, selectedTab
  // let primaryColors, hoverColors
  // TODO hard coded here as temporary hack, also input in constructor might be temporary
  const primaryColors = ['#9DC680', '#80AFC6', '#8B8BCB', '#AB8BCB', '#C68680', '#CBA46C', '#CBCB6C']
  const hoverColors = ['#93C072', '#72A6C0', '#7D7DC5', '#A17DC5', '#C07972', '#C69A5D', '#C6C65D']
  const tooltipColors = ['#D5F0C2', '#C2E0F0', '#C2C2F0', '#D9C2F0', '#F0C6C2', '#F0DDC2', '#F0F0C2']

  // Initialize the chart panel
  // TODO fix constructor
  exports.generateChartPanel =
  function (
    questions,
    groups,
  ) {
    // Unpack the data
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      questionMap[q.column] = q
    }
    initialQuestion = groups[0].questions[0]
    selectedTab = questionMap[initialQuestion].displaytypes[0]
    const displaytypes = questionMap[initialQuestion].displaytypes

    // Add click events to the tabs
    d3.selectAll('.chart-tab')
      .on('click',
        function () {
          const classes = this.classList
          for (let i = 0; i < classes.length; i++) {
            if (classes[i] === 'freq' || classes[i] === 'mean' || classes[i] === 'dich') {
              setSelectedTab(classes[i].toUpperCase())
            }
          }
        })

    // Set chart tab names
    d3.select('.chart-tab.freq')
      .text(dax.text('explorer.chart_tab.frequency_bar'))
    d3.select('.chart-tab.mean')
      .text(dax.text('explorer.chart_tab.mean_bar'))
    d3.select('.chart-tab.dich')
      .text(dax.text('explorer.chart_tab.dichotomized_line'))

    // Apply special classes to style the tabs
    // TODO duplicate code, used again in chartSetQueryDefinition function, should probably be unified
    d3.selectAll('.chart-tab, .chart-tab-spacing')
      .style('display', function (d, i, tabs) {
        if (displaytypes.length <= 1) {
          return 'none'
        }
        for (let j = 0; j < displaytypes.length; j++) {
          if (tabs[i].classList.contains(displaytypes[j].toLowerCase())) {
            return 'block'
          }
        }
        return 'none'
      })

    // Initialize chart resources
    dax.chart.meanbars.initializeResources(questionMap, primaryColors, hoverColors, tooltipColors)
    dax.chart.meanprofile.initializeResources()
    dax.chart.frequency.initializeResources(primaryColors, hoverColors)
    dax.chart.dichtimeline.initializeResources(primaryColors, tooltipColors)

    // TODO handle here or somewhere else?
    window.addEventListener('resize', dax.explorer.updateChartPanelSize)
    // hack to force initial sizing to work
    // TODO handle in different way
    for (let i = 2; i <= 13; i++) {
      setTimeout(dax.explorer.updateChartPanelSize, Math.pow(2, i))
    }
  }

  // Getter for selected tab
  exports.getSelectedTab =
  function () {
    return selectedTab
  }

  exports.chartSetQueryDefinition =
  function (
    chartTab,
    timepoints,
    question,
    perspectives,
    selectedOptions,
  ) {
    selectedTab = chartTab

    // Hide all charts elements
    dax.chart.frequency.hide()
    dax.chart.meanbars.hide()
    dax.chart.meanprofile.hide()
    dax.chart.dichtimeline.hide()

    // TODO allow for animated updates of same chart type
    // d3.select('.chart')
    //     .selectAll(function () { return this.childNodes })
    //     .remove()
    //
    // d3.select('.legend').html('')
    //
    // d3.select('.header-section-sub, .header-section-dichsub, .header-section-freq-tooltip')
    //   .text('')

    // Add new content
    // let questionMeta = questionMap[questionID]
    // d3.select('.header-section-header').text(questionMeta.short)
    // if (questionMeta.short !== questionMeta.text) {
    //   d3.select('.header-section-sub').text(questionMeta.text)
    // }
    // d3.select('.header-section-dichsub').text(dichSubtitle)
    // d3.select('.header-section-freq-tooltip').text('')

    // reset any side scroll set by previous charts
    d3.select('.chart-panel')
      .classed('chart-scroll', false)
      .style('width', null)

    const displaytypes = questionMap[question].displaytypes
    d3.selectAll('.chart-tab')
      .classed('chart-tab-selected', function (d, i, tabs) { return tabs[i].classList.contains(selectedTab.toLowerCase()) })

    d3.selectAll('.chart-tab, .chart-tab-spacing')
      .style('display', function (d, i, tabs) {
        if (displaytypes.length <= 1) {
          return 'none'
        }
        for (let j = 0; j < displaytypes.length; j++) {
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
        dax.chart.frequency.populateChart(question, perspectives, selectedOptions)
        break
      }
      break
    case 'MEAN':
      switch (dax.settings('chart.mean.orientation')) {
      case 'HORIZONTAL':
        switch (timepoints) {
        case 'TIMEPOINTS_ONE':
          dax.chart.meanbars.populateChart(question, perspectives, selectedOptions)
          break
        }
        break
      case 'VERTICAL':
        dax.chart.meanprofile.populateChart(question, perspectives, selectedOptions)
        break
      }
      break
    case 'DICH':
      switch (timepoints) {
      case 'TIMEPOINTS_ONE':
      case 'TIMEPOINTS_TWO':
      case 'TIMEPOINTS_ALL':
        dax.chart.dichtimeline.populateChart(question, perspectives, selectedOptions)
        break
      }
      break
    }

    dax.explorer.updateChartPanelSize()
  }

  function setSelectedTab (tab) {
    if (selectedTab === tab) {
      return
    }
    selectedTab = tab
    dax.explorer.selectionUpdateCallback(true)
  }

  exports.updateChartPanelSize =
  function () {
    // TODO ask all elements for their needed width
    const windowWidth = document.documentElement.clientWidth
    const leftSidebarWidth = d3.select('.question-panel').node().offsetWidth
    const rightSidebarWidth = d3.select('.sidebar-column').node().offsetWidth
    const headerBlockWidth = d3.select('.header-section-wrapper').node().offsetWidth

    let bottomBlockWidth = 0
    if (dax.settings('structure.descriptionPosition') === 'BOTTOM') {
      const descriptionPanel = d3.select('.description-panel.description-bottom').node()
      if (descriptionPanel !== null && descriptionPanel.offsetWidth > 0) {
        bottomBlockWidth = 350 // TODO hard coded
      }
    }

    // Calculate available width, assuming to horizontal scroll for the page as a whole
    const availableWidth = windowWidth -
              leftSidebarWidth -
              rightSidebarWidth - // right sidebar
              2 - // border of 1px + 1px (if changed here, needs to be changed in css)
              1 // 1 px fudge to account for rounding

    // Minimum width needed for the header and bottom blocks
    const topBotNeededWidth = Math.max(headerBlockWidth, bottomBlockWidth)

    // Use all the width available with no scrolling for the chart  unless the header or bottom
    // block require more width. In that case also allow the chart to be so big that the page as a
    // whole gets a vertical scroll bar. If the chart's minimum width is larger than the available
    // width then it's up to the chart to put itself in a horizontal scroll panel.
    const widthForChart = Math.max(availableWidth, topBotNeededWidth)
    switch (selectedTab) {
    case 'FREQ':
      dax.chart.frequency.setSize(widthForChart, 350)
      break
    case 'MEAN':
      switch (dax.settings('chart.mean.orientation')) {
      case 'HORIZONTAL':
        // TODO allow more height instead of vertical scroll
        // TODO hard coded based on specific chart, should be generalized
        dax.chart.meanbars.setSize(widthForChart, 350)
        break
      case 'VERTICAL':
        dax.chart.meanprofile.setSize(widthForChart)
        break
      }
      break
    case 'DICH':
      dax.chart.dichtimeline.setSize(widthForChart, 350)
      break
    }
  }
})(window.dax = window.dax || {})
