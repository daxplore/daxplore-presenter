(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.meanbars = namespace.chart.meanbars || {}
  const exports = namespace.chart.meanbars

  /** ** CHART TYPE AND INSTANCE VARIABLES ** **/

  // CONSTANTS
  const margin = { top: 20, right: 10, bottom: 15, left: 35 }
  const barTransition = d3.transition()
    .duration(300)
    .ease(d3.easeLinear)
  const fadeTransition = d3.transition()
    .duration(100)
    .ease(d3.easeLinear)

  // SIZE VARIABLES
  let availableWidth = 600 // initial placeholder value
  let width = availableWidth
  let availableHeight = 300 // initial placeholder value
  let height = availableHeight

  // CHART RESOURCES
  // Use the same objects when updating the chart
  // Objects, data and values that are independant of the chart data
  // DATA
  let questionMap
  // HEADER
  let headerDiv, headerMain, headerSub, headerDescriptionButton, headerDecriptionPanel
  // SCALES AND AXISES
  let xScale, xAxis, xAxisElement
  let yScale, yAxis, yAxisElement
  let zScaleColor, zScaleColorHover, zScaleColorTooltip
  // CHART
  let chartContainer, chartBB, chart, chartG
  let referenceLine, referenceLineMouseArea
  let tooltipDiv, referenceTooltipDiv
  // STATE TRACKING
  let animateNextUpdate = false
  // LEGEND
  let legendDiv, legendPerspectiveHeader, legendPerspectiveOptionTable, legendReferenceLine

  // CURRENT MEAN BAR CHART
  // Data specific for the current chart
  let perspective, question, selectedOptionCount
  let questionReferenceValue
  let selectedOptionsData, selectedOptionsDataMap

  /** ** EXPORTED FUNCTIONS ** **/

  // Constructor, used to initialize the chart type.
  // Run once when the page is loaded. Call populateChart in order to update the chart content.
  exports.initializeResources =
  function (questionMapInput, primaryColors, hoverColors, tooltipColors) {
    questionMap = questionMapInput

    // INITIALIZE HEADER
    headerDiv = d3.select('.header-section').append('div')
      .attr('class', 'header-section__meanbars')
    headerMain = headerDiv.append('div')
      .attr('class', 'header-section__main')
    headerSub = headerDiv.append('div')
      .attr('class', 'header-section__sub')

    // TODO move to centralized description handling, or remove completely
    if (dax.settings('perspectiveDescriptionPosition') === 'TOP') {
      headerDescriptionButton = d3.select('.chart-panel').append('div')
        .attr('class', 'header-section__description-button')
      headerDecriptionPanel = headerDescriptionButton.append('div')
        .attr('class', 'header-section__description-panel')
    }

    // INITIALIZE CHART
    // base div element
    chartContainer = d3.select('.chart').append('div')
      .attr('class', 'explorer-meanbars')

    // base svg element
    chart = chartContainer.append('svg')
      .attr('class', 'explorer-meanbars')

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
      .tickSize(0)
      .tickFormat('')

    xAxisElement = chartG.append('g')
      .attr('class', 'x axis bottom')
      .call(xAxis)

    // y axis
    // TODO define domain in Daxplore Producer
    yScale = d3.scaleLinear()
      .domain([0, 100])

    // TODO define ticks in Daxplore Producer
    yAxis = d3.axisLeft(yScale)
      .ticks(20)
      .tickSize(0)
      .tickSizeInner(-width)
      .tickFormat(function (d, i) {
        return d % 10 === 0 ? d + '\xa0' : '' // \xa0 is the unicode character for hard space
      })

    yAxisElement = chartG.append('g')
      .attr('class', 'y axis left')
      .call(yAxis)

    // style y and x axises
    d3.selectAll('.axis .domain')
      .style('visibility', 'hidden')

    d3.selectAll('.axis path, .axis line')
      .style('fill', 'none')
      .style('stroke', '#bbb')
      .style('shape-rendering', 'geometricPrecision')

    d3.selectAll('text')
      .style('fill', '#555')
      .style('font-size', '13px')
      .style('font-family', '"Varta", sans-serif')
      .style('cursor', 'default')

    // z axis, color coding
    zScaleColor = d3.scaleOrdinal(primaryColors)
    zScaleColorHover = d3.scaleOrdinal(hoverColors)
    zScaleColorTooltip = d3.scaleOrdinal(tooltipColors)

    // reference line
    referenceLine = chartG.append('line')
      .attr('class', 'reference-line')
      .style('stroke', '#666')
      .style('stroke-width', '3.2px')
      .style('stroke-linecap', 'square')
      .style('stroke-dasharray', '4,8')
      .style('shape-rendering', 'crispedges')

    // reference line mouse over area
    referenceLineMouseArea = chartG.append('rect')
      .style('opacity', 0)
      .on('mouseover', function () { referenceTooltipDiv.classed('hidden', false) })
      .on('mouseout', function () { referenceTooltipDiv.classed('hidden', true) })

    // INITIALIZE LEGEND
    // top level meanbars legend container
    legendDiv = d3.select('.legend').append('div')
      .attr('class', 'meanbars__legend')

    // empty flex element, used to dynamically align the legend content vertically
    legendDiv.append('div')
      .style('flex', '1')

    // legend for the perspective and selected options
    const legendPerspective = legendDiv.append('div')
    legendPerspectiveHeader = legendPerspective.append('h4')
      .attr('class', 'legend__header')
    legendPerspectiveOptionTable = legendPerspective.append('div')

    // legend for the question's reference value
    legendReferenceLine = legendDiv.append('div')
      .attr('class', 'legend__reference-line')

    // empty flex element, used to dynamically align the legend content vertically
    legendDiv.append('div').style('flex', '3')

    // INITIALIZE TOOLTIP BOXES
    // mouseover tooltip div for chart bar and legend option
    tooltipDiv = chartContainer.append('div')
      .attr('class', 'meanbars__tooltip hidden')
    // mouseover tooltip div for reference line
    referenceTooltipDiv = chartContainer.append('div')
      .attr('class', 'meanbars__reference-tooltip hidden')
  }

  // Set new data to be displayed by the chart.
  // As a side effect, make this chart visible.
  exports.populateChart =
  function (questionID, perspectiveID, selectedPerspectiveOptions) {
    displayChartElements(true)
    // Animate the update unless the perspective has changed.
    // As long as the perspective is the same, each bar represents a specific perspective option
    // which gives continuity for the user. But of the perspective change, the contextual meaning
    // of the bars and color changes.
    animateNextUpdate = perspective === perspectiveID
    perspective = perspectiveID
    question = questionID
    selectedOptionCount = selectedPerspectiveOptions.length
    questionReferenceValue = questionMap[question].mean_reference

    // DATA
    // Restructure the input data that can be used in a d3 join
    selectedOptionsData = []
    selectedOptionsDataMap = {}
    selectedPerspectiveOptions.forEach(function (option, i) {
      const stat = dax.data.getMean(question, perspective, option)
      const mean = stat.mean
      const count = stat.count
      const optionData = {
        index: option,
        mean: mean,
        nodata: mean === -1 && count === 0,
        count: count,
      }
      selectedOptionsData.push(optionData)
      selectedOptionsDataMap[option] = optionData
    })

    // UPDATE HEADER
    const shortText = questionMap[question].short.trim()
    const longText = questionMap[question].text.trim()
    headerMain.text(shortText)
    headerSub
      .text(longText)
      .style('display', longText === '' || shortText === longText ? 'none' : null)

    // UPDATE X
    xScale.domain(selectedPerspectiveOptions)

    // UPDATE Z
    const allIndicesArray = dax.data.getPerspectiveOptionIndicesColumnOrder(perspectiveID) // questionMap[perspective].options.map(function (o, i) { return i })
    zScaleColor.domain(allIndicesArray)
    zScaleColorHover.domain(allIndicesArray)
    zScaleColorTooltip.domain(allIndicesArray)

    // UPDATE BARS
    const bars = chartG.selectAll('.meanbars__bar')
      .data(
        selectedOptionsData, // data
        function (option) { return option.index } // key function, mapping a specific DOM element to a specific option index
      )

    // remove old bars
    bars.exit().remove()

    // add new bars
    bars.enter().append('g')
      .classed('meanbars__bar', true)
      .append('rect')
        .classed('meanbars__bar-rect', true)
        .attr('x', function (option) { return xScale(option.index) })
        .attr('width', xScale.bandwidth())
        .attr('y', height)
        .attr('height', 0) // Set new bars to height 0, so they are animated into existence
        .on('mouseover', function (option) { optionMouseOver(option, true) })
        .on('mouseout', optionMouseOut)

    // update color and opacity for both new and old bars
    chartG.selectAll('.meanbars__bar')
      .select('rect')
      .style('fill', colorPrimary)
      .style('opacity', function (option) { return option.nodata ? 0.7 : 1 })

    // UPDATE LEGEND
    // Update legend title
    legendPerspectiveHeader
      .text(questionMap[perspective].short)

    // Set new data for the legend
    const optionRows = legendPerspectiveOptionTable.selectAll('.legend__row')
      .data(
        selectedOptionsData, // data
        function (option) { return option.index }) // key function, mapping a specific DOM element to a specific option index

    // Remove old rows
    optionRows.exit().remove()

    // Add new rows
    const optionEnter = optionRows.enter()
      .append('div')
        .classed('legend__row', true)
        .on('mouseover', function (option) { optionMouseOver(option, false) })
        .on('mouseout', optionMouseOut)
    optionEnter.append('div')
      .attr('class', 'legend__color-square')
    optionEnter.append('div')
      .attr('class', 'legend__row-text')

    // reselect rows and use single-select to propagate data join to contained items
    // update color and text for each row
    const rows = legendPerspectiveOptionTable.selectAll('.legend__row')
      .attr('class', function (d) {
        const depth = dax.data.getPerspectiveOptionTreeDepth(perspective, d.index)
        let indentDepth = 0
        if (depth >= 1) {
          const parent = dax.data.getPerspectiveOptionParent(perspective, d.index)
          if (selectedPerspectiveOptions.indexOf(parent) !== -1) {
            indentDepth += 1
          }
          if (depth >= 2) {
            const parentParent = dax.data.getPerspectiveOptionParent(perspective, parent)
            if (selectedPerspectiveOptions.indexOf(parentParent) !== -1) {
              indentDepth += 1
            }
          }
        }
        return 'legend__row legend__row--indent-' + indentDepth
      })
      .attr('title', function (option) {
        let text = dax.data.getQuestionOptionText(perspective, option.index)
        if (option.nodata) {
          text += ' ' + dax.text('explorer.chart.mean_bar_horizontal.legend.missing_data')
        }
        return text
      })

    rows.select('.legend__color-square')
      .style('background-color', colorPrimary)
    rows.select('.legend__row-text')
      .text(function (option) {
        let text = dax.data.getQuestionOptionText(perspective, option.index)
        if (option.nodata) {
          text += ' ' + dax.text('explorer.chart.mean_bar_horizontal.legend.missing_data')
        }
        return text
      })
      .style('font-style', function (option) { return option.nodata ? 'italic' : null })

    // update the reference line text
    legendReferenceLine
      .text(dax.text('explorer.chart.mean_bar_horizontal.legend.reference_value', dax.common.integerFormat(questionReferenceValue)))

    // UPDATE REFERENCE TOOLTIP
    referenceTooltipDiv.selectAll('span').remove()
    referenceTooltipDiv.append('span')
      .attr('class', 'meanbars__reference-tooltip-header')
      .text(dax.text('explorer.chart.mean_bar_horizontal.tooltip.reference_value'))
    referenceTooltipDiv.append('span')
      .text(dax.common.integerFormat(questionReferenceValue))
  }

  // TODO move to core or description handler, or remove completely
  exports.setHeaderDescriptionHTML =
  function (html) {
    if (headerDescriptionButton && headerDecriptionPanel) {
      headerDescriptionButton
        .classed('hidden', html.length === 0)
      headerDecriptionPanel
        .classed('hidden', html.length === 0)
        .html(html)
    }
  }

  // Set the size available for the chart.
  // Updates the chart so it fits in the new size.
  // As a side effect, enable horizontal scrolling if needed for the chart to fit the given room.
  exports.setSize =
  function (availableWidthInput, availableHeightInput) {
    availableWidth = availableWidthInput
    availableHeight = availableHeightInput
    resizeAndPositionElements()
  }

  // Hide all meanbars chart elements
  // Called whenever the entire chart should be hidden, so that another chart type can be dislpayed
  exports.hide =
  function () {
    displayChartElements(false)
  }

  /** ** INTERNAL FUNCTIONS ** **/

  // Hide or show all top level elements: header, chart and legend
  function displayChartElements (show) {
    headerDiv.style('display', show ? null : 'none')
    chartContainer.style('display', show ? null : 'none')
    legendDiv.style('display', show ? null : 'none')
  }

  // Update the size and position of all chart elements.
  // Called when the content or the size is updated.
  function resizeAndPositionElements () {
    // CHART SIZE
    // Estimate the minimum width needed for the chart with the current content
    const chartNeededWidth = margin.left + margin.right + // margins
      30 + // y axis width // TODO calculate
      10 * 2 + // space outside of bars // TODO calculate
      5 * (selectedOptionCount - 1) + // space between bars // TODO calculate
      15 * selectedOptionCount // min width for bars // TODO set better value

    // Check if vertical scroll is needed
    const scrollNeeded = availableWidth < chartNeededWidth

    // Enable or disable scroll on the div containing the meanbars chart
    d3.select('.chart')
      .classed('chart-scroll', scrollNeeded)
      .style('width', function () { return scrollNeeded ? availableWidth + 'px' : null })

    // Update width of the chart, which may be bigger than the available space if scrolling is enabled
    width = scrollNeeded ? chartNeededWidth : availableWidth
    width = width - margin.left - margin.right
    height = availableHeight - margin.top - margin.bottom
    chart
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    // Update bounding box definition for the chart
    const wrapperClientBB = d3.select('.chart').node().getBoundingClientRect()
    chartBB = {
      height: wrapperClientBB.height,
      left: wrapperClientBB.left + pageXOffset,
      top: wrapperClientBB.top + pageYOffset,
      width: wrapperClientBB.width,
    }

    // X AXIS
    // Update the space available for the x axis
    xScale.rangeRound([0, width])
    // Move and update the x axis
    xAxisElement
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)
    // Reapply styling to x axis
    xAxisElement.selectAll('path, line')
      .style('stroke', '#bbb') // TODO externalize axis color?
      .style('shape-rendering', 'geometricPrecision')

    // Y AXIS
    // Update the space available for the x axis
    yScale.rangeRound([height, 0])
    // Update the width of the y axis lines
    yAxis.tickSizeInner(-width)
    // Update the y axis
    yAxisElement.call(yAxis)
    // Reapply styling to y axis
    yAxisElement.selectAll('path, line')
      .style('stroke', '#bbb') // TODO externalize axis color?
      .style('shape-rendering', 'geometricPrecision')

    // BARS
    // Use single child select to propagate data from parent selection
    let bars = d3.selectAll('.meanbars__bar').select('.meanbars__bar-rect')
    // Stop all current bar animations
    bars.interrupt().selectAll('*').interrupt()
    // Select the bars with or without transition animations
    bars = animateNextUpdate ? bars.transition(barTransition) : bars
    // Resize and reposition the bars
    bars
      .attr('x', function (option) { return xScale(option.index) })
      .attr('width', xScale.bandwidth())
      .attr('y', function (option) { return option.nodata ? 1 : yScale(option.mean) })
      .attr('height', function (option) { return option.nodata ? height - 1 : height - yScale(option.mean) })

    // REFERENCE LINE
    // Number of pixels to indent the reference line from the left and right sides
    const lineOuterPadding = 5
    // Vertical position of the reference line
    const yPos = yScale(questionReferenceValue)
    // Stop all current reference line animations
    referenceLine.interrupt().selectAll('*').interrupt()
    // Select the reference line  with or without transition animations
    const rle = animateNextUpdate ? referenceLine.transition(barTransition) : referenceLine
    // Update the line y position, possibly with animation
    rle
      .attr('y1', yPos)
      .attr('y2', yPos)
    // Update the line width, never with animation
    referenceLine
      .attr('x1', lineOuterPadding)
      .attr('x2', width - lineOuterPadding)
    // Move the reference line in front of all the bars
    referenceLine.raise()

    // Create a band for the reference line that registers mouseovers of the reference line
    // Width of the mouseover area
    const mouseHoverWidth = 10
    // Update position of the reference line and move it to the very front
    referenceLineMouseArea
      .attr('x', 0)
      .attr('y', yPos - mouseHoverWidth / 2)
      .attr('width', width)
      .attr('height', mouseHoverWidth)
      .raise()

    // Get bounding boxes for the reference tooltip and the top level chart container
    const referenceTooltipBB = referenceTooltipDiv.node().getBoundingClientRect()
    const chartContainerBB = chartContainer.node().getBoundingClientRect()
    // Horizontally center on the available chart area, which may look slightly off-center since
    // it doesn't consider the margins or the y-axis. Could be more accurate by calculating chart
    // content center, by cancelling scrollLeft and margin/y-axis. Looks good enough as is, for now.
    referenceTooltipDiv
      .style('left', (chartContainerBB.width / 2 + d3.select('.chart').node().scrollLeft -
      referenceTooltipBB.width / 2) + 'px')
      .style('top', (chartBB.top + margin.top + yPos - referenceTooltipBB.height - 10) + 'px')

    // LEGEND
    // Set the vertical position and height of the legend area
    // The position of the legend div is then adjusted via flex parameters relative the defined area
    legendDiv
      .style('margin-top', (chartBB.top + 0) + 'px')
      .style('height', chartBB.height + 'px')

    // COMPLETE UPDATE
    // If this update was animated, mark the animation  as completed
    animateNextUpdate = false
  }

  // Called when the mouse over event is triggered for a bar in the chart or row in the legend
  function optionMouseOver (hoveredOption, showTooltip) {
    const optIndex = hoveredOption.index
    // BARS
    // Update bar mouseover highlight
    d3.selectAll('.meanbars__bar-rect')
      .style('fill', function (option) { return option.index === optIndex ? colorHover(option) : colorPrimary(option) })

    // LEGEND
    const rows = d3.selectAll('.meanbars__legend .legend__row')
    // Stop all current legend row animations
    rows.interrupt().selectAll('*').interrupt()
    // Fade non-selected options
    rows
      .style('opacity', function (option) { return option.index === optIndex ? 1 : 0.4 })

    // TOOLTIP
    // Set tooltip box text
    const optionName = dax.data.getQuestionOptionText(perspective, optIndex)
    const data = selectedOptionsDataMap[optIndex]
    let tooltipText = '<b>' + optionName + '</b><br>'
    if (data.nodata) {
      tooltipText += dax.text('explorer.chart.mean_bar_horizontal.tooltip.few_respondents', 10) + '<br>' // TODO hardcoded 10, should be read from settings generated by Daxplore Producer
      tooltipText += '<b>' + dax.text('explorer.chart.mean_bar_horizontal.tooltip.missing_data') + '</b>'
    } else {
      tooltipText += dax.text('explorer.chart.mean_bar_horizontal.tooltip.mean', dax.common.integerFormat(data.mean)) + '<br>' +
      dax.text('explorer.chart.mean_bar_horizontal.tooltip.respondents', data.count)
    }
    // Update tooltip position, color and visibility
    tooltipDiv
      .html(tooltipText) // TODO construct elements via d3 instead of string->html
      .classed('hidden', !showTooltip)
      .style('background-color', data.nodata ? '#DDD' : zScaleColorTooltip(optIndex)) // TODO externalize no data color
      .style('left', (margin.left + xScale(optIndex) +
        xScale.bandwidth() / 2 - tooltipDiv.node().getBoundingClientRect().width / 2 -
        d3.select('.chart').node().scrollLeft) + 'px')
      .style('top', (chartBB.top + margin.top + height + 10) + 'px')
  }

  // Call whenever a mouseout event is triggered for a chart bar or a legend row
  function optionMouseOut () {
    // BARS
    // Return to default bar colors
    d3.selectAll('.meanbars__bar-rect').style('fill', colorPrimary)
    // LEGEND ROWS
    const rows = d3.selectAll('.meanbars__legend .legend__row')
    // Stop all current legend row animations
    rows.interrupt().selectAll('*').interrupt()
    // Set all legend rows to visible again
    rows.transition(fadeTransition)
      .style('opacity', 1)
    // TOOLTIP
    // Hide tooltip
    tooltipDiv.classed('hidden', true)
  }

  // Helper function for bar and legend colors.
  // The option argument is an option data object used in the d3 data join for the bars and legend rows.
  function colorPrimary (option) { return option.nodata ? '#999' : zScaleColor(option.index) } // TODO externalize no data color
  function colorHover (option) { return option.nodata ? '#888' : zScaleColorHover(option.index) } // TODO externalize no data color
})(window.dax = window.dax || {})
