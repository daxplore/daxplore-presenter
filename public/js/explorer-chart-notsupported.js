(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.notsupported = namespace.chart.notsupported || {}
  const exports = namespace.chart.notsupported

  /** CHART TYPE AND INSTANCE VARIABLES**/
  let chartContainer, lineOne, lineTwo, lineThree

  // CHART SIZE VARIABLES
  const maxWidth = 800
  let availableWidth = 600 // initial placeholder value
  let availableHeight = 300 // initial placeholder value

  /** EXPORTED FUNCTIONS **/

  exports.initializeResources =
  function () {
    chartContainer = d3.select('.chart').append('div')
      .attr('class', 'explorer-notsupported')
    const textbox = chartContainer.append('div')
      .attr('class', 'explorer-notsupported__textbox')
    lineOne = textbox.append('div')
    lineTwo = textbox.append('div')
    lineThree = textbox.append('div')
  }

  exports.populateChart =
  function (missingChartType, questionID) {
    displayChartElements(true)

    const questionText = dax.data.getQuestionShortText(questionID)

    const chartText = dax.text('explorer.chart.notsupported.' + missingChartType)
    lineOne.html(dax.text('explorer.chart.notsupported.question', questionText))
    lineTwo.html(dax.text('explorer.chart.notsupported.cant_show_as'))
    lineThree.html(chartText)
  }

  // Set the size available for the chart.
  // Updates the chart so it fits in the new size.
  // As a side effect, enable horizontal scrolling if needed for the chart to fit the given room.
  exports.setSize =
  function (availableWidthInput, availableHeightInput) {
    availableWidth = Math.min(availableWidthInput, maxWidth)
    availableHeight = availableHeightInput
    resizeAndPositionElements()
  }

  // Hide all dichtimeline chart elements
  // Called whenever the entire chart should be hidden, so that another chart type can be dislpayed
  exports.hide =
  function () {
    displayChartElements(false)
  }

  /** INTERNAL FUNCTIONS **/

  // Hide or show all top level elements
  function displayChartElements (show) {
    chartContainer.style('display', show ? null : 'none')
  }

  // Update the size and position of all chart elements.
  // Called when the content or the size is updated.
  function resizeAndPositionElements () {
    chartContainer
      .style('width', availableWidth + 'px')
      .style('height', availableHeight + 'px')
  }
})(window.dax = window.dax || {})
