(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.meanbars = namespace.chart.meanbars || {}
  const exports = namespace.chart.meanbars

  // CONSTANTS
  var margin = { top: 20, right: 20, bottom: 30, left: 30 }
  var transition = d3.transition().duration(50)
  var transitionOff = d3.transition().duration(0)

  // MEAN BAR CHART RESOURCES
  // Use the same objects when updating the chart
  // Objects, data and values that are independant of the chart data
  var chartContainer
  var usertexts, questionMap
  var primaryColors, hoverColors
  var chart, chartG
  var xScale, xAxis, xAxisElement
  var yScale, yAxis, yAxisElement
  var zScaleColor
  var referenceLine
  var height = 300 // initial placeholder value
  var width = 600 // initial placeholder value

  // CURRENT MEAN BAR CHART
  // Data specific for the current chart
  var perspective, question, selectedPerspectiveOptions
  var questionReferenceValue, questionGoodDirection
  var selectedOptionsData

  // INTERNAL FUNCTIONS

  // Hide or show all top level elements
  function displayChartElements (show) {
    chartContainer
      .classed('hidden', !show)
  }

  // Update all sizing and positions
  // Call when content or size is updated
  function resizeAndPositionElements (animateUpdate) {
    // var trans = animateUpdate ? transition : transitionOff
    chart
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    xScale
      .rangeRound([0, width])

    xAxisElement.selectAll('*').interrupt()
    var xae = animateUpdate ? xAxisElement.transition() : xAxisElement
    xae.attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)
      .style('stroke', 'red')
    xAxisElement.selectAll('path, line')
      .style('stroke', '#bbb')
      .style('shape-rendering', 'geometricPrecision')

    yScale
      .rangeRound([height, 0])
    yAxis
      .tickSizeInner(-width)
    yAxisElement.selectAll('*').interrupt()
    var yae = animateUpdate ? yAxisElement.transition() : yAxisElement
    yae.call(yAxis)
    yAxisElement.selectAll('path, line')
      .style('stroke', '#bbb')
      .style('shape-rendering', 'geometricPrecision')

    var bars = d3
      .selectAll('.explorer__chart-meanbars__bar')
      .select('.explorer__chart-meanbars__bar__rect') // use single child select to propagate data from parent selection
    bars.selectAll('*').interrupt()
    bars = animateUpdate ? bars.transition() : bars
    bars
      .attr('x', function (option) { return xScale(option.index) })
      .attr('width', xScale.bandwidth())
      .attr('y', function (option) { return option.mean === -1 ? 1 : yScale(option.mean) })
      .attr('height', function (option) { return option.mean === -1 ? height - 1 : height - yScale(option.mean) })

    // reference line
    // chartG.insert(referenceLine) // move line to front
    referenceLine
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(50))
      .attr('y2', yScale(50))
      .raise()
  }

  // EXPORTED FUNCIONS
  // Hide all chart elements
  exports.hide = function () {
    displayChartElements(false)
  }

  exports.initializeChartResources = function (usertextsInput, questionMapInput, primaryColorsInput,
    hoverColorsInput) {
    usertexts = usertextsInput
    questionMap = questionMapInput
    primaryColors = primaryColorsInput
    hoverColors = hoverColorsInput

    // base div element
    chartContainer = d3.select('.chart').append('div')
      .attr('class', 'explorer-chart-meanbars')

    // base svg element
    chart = chartContainer.append('svg')
      .attr('class', 'explorer-chart-meanbars')

    // white background
    chart.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'white')

    // margin adjusted chart element
    chartG = chart.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    // x axis
    xScale = d3.scaleBand()
     .paddingInner(0.1)
     .paddingOuter(0.07)

    xAxis = d3.axisBottom(xScale)
      .tickValues([])
      .tickSize(0)

    xAxisElement = chartG.append('g')
      .attr('class', 'x axis bottom')
      .call(xAxis)

    // y axis
    yScale = d3.scaleLinear()
      .domain([0, 100])

    yAxis = d3.axisLeft(yScale)
      .ticks(20)
      .tickSize(3)
      .tickSizeInner(-width)
      .tickFormat(function (d, i) {
        return d % 10 === 0 ? d : ''
      })

    yAxisElement = chartG.append('g')
      .attr('class', 'y axis left')
      .call(yAxis)

    // z axis, color coding
    zScaleColor = d3.scaleOrdinal(primaryColors)

    // reference line
    referenceLine = chartG.append('line')
      .attr('class', 'reference-line')
      .style('stroke', '#666')
      .style('stroke-width', '3')
      .style('stroke-linecap', 'butt')
      .style('stroke-dasharray', '5,3')

    // LEGEND
    var d3.select('.legend').append('div')
  }

  // EXPORTED FUNCTIONS
  exports.populateChart = function (stat, selectedPerspectiveOptionsInput) {
    displayChartElements(true)
    // Check if the new chart uses the same question and perspective
    var animateUpdate = perspective === stat.p // && question === stat.q
    perspective = stat.p
    question = stat.q
    selectedPerspectiveOptions = selectedPerspectiveOptionsInput
    questionReferenceValue = questionMap[question].mean_reference
    questionGoodDirection = questionMap[question].gooddirection

    selectedOptionsData = []
    selectedPerspectiveOptions.forEach(function (option, i) {
      selectedOptionsData.push({
        index: option,
        mean: stat.mean['0'].mean[option],
        count: stat.mean['0'].count[option],
      })
    })

    // UPDATE X
    xScale
      .domain(selectedPerspectiveOptions)

    // UPDATE Y

    // UPDATE Z
    zScaleColor
      .domain(Array.from(Array(questionMap[perspective].options.length).keys()))

    // UPDATE BARS
    var bars = chartG.selectAll('.explorer__chart-meanbars__bar')
      .data(
        selectedOptionsData, // data
        function (option) { return option.index }) // key function, mapping a specific DOM element to a specific option index

    // remove old bars
    bars.exit().remove()

    // add new bars
    bars.enter().append('g')
      .classed('explorer__chart-meanbars__bar', true)
      .append('rect')
        .classed('explorer__chart-meanbars__bar__rect', true)
        .attr('x', function (option) { return xScale(option.index) })
        .attr('width', xScale.bandwidth())
        .attr('y', height)
        .attr('height', 0)
        .style('fill', function (option) {
          return option.mean === -1 ? '#bbb' : zScaleColor(option.index)
        })
        .style('opacity', function (option) { return option.mean === -1 ? 0.7 : 1 })

    resizeAndPositionElements(animateUpdate)
  }

  exports.setSize = function (availableWidth, availableHeight) {
    var chartNeededWidth = margin.left + margin.right + // margins
      30 + // y axis width // TODO calculate
      10 * 2 + // space outside of bars // TODO calculate
      10 * (selectedPerspectiveOptions.length - 1) + // space between bars // TODO calculate
      20 * selectedPerspectiveOptions.length // min width for bars // TODO set better value

    var lockWidth = availableWidth < chartNeededWidth
    // WIP WIP WIP
    d3.select('.chart')
      .classed('chart-scroll', lockWidth)
      .style('width', function () { return lockWidth ? availableWidth + 'px' : null })

    width = lockWidth ? chartNeededWidth : availableWidth
    width = width - margin.left - margin.right
    height = availableHeight - margin.top - margin.bottom

    resizeAndPositionElements(false)
  }
})(window.daxplore = window.daxplore || {})
