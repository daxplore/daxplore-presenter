(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.dichtimeline = namespace.chart.dichtimeline || {}
  const exports = namespace.chart.dichtimeline

  /** CHART TYPE AND INSTANCE VARIABLES**/

  // CONSTANTS
  const yAxisWidth = 35
  const xAxisHeight = 24
  const margin = { top: 25, right: 13, bottom: xAxisHeight, left: yAxisWidth + 10 }
  const pointSize = 40
  const pointFocusSize = 550
  const pointTextSize = 11

  // CHART SIZE VARIABLES
  let availableWidth = 600 // initial placeholder value
  let availableHeight = 300 // initial placeholder value
  let width = availableWidth
  let height = availableHeight

  // HEADER
  let headerDiv, headerMain, headerSub, headerDich
  // SCALES AND AXISES
  let xScale, xAxis, xAxisElement
  let yScale, yAxis, yAxisElement
  let zScaleColor
  // CHART
  let chart, chartContainer, chartG, chartBB
  let mainLineGroup, mouseoverLineGroup
  // LEGEND
  let legendDiv
  let legendPerspectiveHeader, legendPerspectiveOptionTable
  let legendQuestionHeader, legendQuestionOptionTable
  // BUTTONS
  let zoomYButton

  // INITIALIZE STATIC RESOURCES
  const percentageFormat = d3.format('.0%')

  const pointSymbol = d3.symbol().type(d3.symbolCircle)

  const fadeTransition = d3.transition()
    .duration(300)
    .ease(d3.easeLinear)

  const elementTransition = d3.transition().duration(300).ease(d3.easeLinear)

  // LINE TEMPLATE
  const line = d3.line()
    .curve(d3.curveLinear)
    .x(function (d) { return xScale(d.timepoint) + xScale.bandwidth() / 2 })
    .y(function (d) { return yScale(d.percentage) })

  // STATE TRACKING
  let animateNextUpdate = false
  let zoomY = false
  let zoomYDomain = 1.0

  // INSTANCE SPECIFIC VARIABLES
  let questionID, perspectiveID
  let currentOptions

  /** EXPORTED FUNCTIONS **/

  exports.initializeResources =
  function (primaryColors) {
    // INITIALIZE HEADER
    headerDiv = d3.select('.header-section').append('div')
        .attr('class', 'header-section__meanbars')
    headerMain = headerDiv.append('div')
        .attr('class', 'header-section__main')
    headerSub = headerDiv.append('div')
        .attr('class', 'header-section__sub')
    headerDich = headerDiv.append('div')
      .attr('class', 'header-section__dich-selected')

    // INITIALIZE CHART
    // base div element
    chartContainer = d3.select('.chart').append('div')
      .attr('class', 'explorer-dichtimeline')

    // CHART
    chart = chartContainer.append('svg')
    chart
      .classed('dich-line-chart', true)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    // WHITE BACKGROUND
    chart.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'white')

    // MARGIN ADJUSTED CHART ELEMENT
    chartG = chart.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    // Y AXIS
    yScale = d3.scaleLinear()

    yAxis = d3.axisLeft(yScale)
      .tickFormat(d3.format('.0%'))
      .tickSize(0)

    yAxisElement = chartG.append('g')
      .attr('class', 'axis dichtime-y-axis')

    // X AXIS
    xScale = d3.scaleBand()
      .paddingInner(0.3)
      .paddingOuter(0)

    xAxis = d3.axisBottom(xScale)

    xAxis
      .tickFormat(function (d) {
        return dax.text('timepoint' + d)
      })

    xAxisElement = chartG.append('g')
      .attr('class', 'axis dichtime-x-axis')

    // Z AXIS (color coding)
    zScaleColor = d3.scaleOrdinal(primaryColors)

    // GROUPS FOR LINES/POINTS
    // The mouseover highlight elements should always be drawn on top, so are placed in
    // a later group in the SVG structure.
    mainLineGroup = chartG.append('g')
    mouseoverLineGroup = chartG.append('g')

    // INITIALIZE LEGEND
    // top level meanbars legend container
    legendDiv = d3.select('.legend').append('div')
      .attr('class', 'dichtimeline__legend')

    // empty flex element, used to dynamically align the legend content vertically
    legendDiv.append('div')
      .style('flex', '1')

    // legend for the perspective and selected options
    const legendPerspective = legendDiv.append('div')
    legendPerspectiveHeader = legendPerspective.append('h4')
      .attr('class', 'legend__header')
    legendPerspectiveOptionTable = legendPerspective.append('div')

    // legend for the question and dichotomized options
    const legendQuestion = legendDiv.append('div')
      .style('margin-top', '25px')
    legendQuestionHeader = legendQuestion.append('h4')
      .attr('class', 'legend__header')
    legendQuestionOptionTable = legendQuestion.append('div')

    // empty flex element, used to dynamically align the legend content vertically
    legendDiv.append('div')
      .style('flex', '3')

    // Zoom Y axis button
    zoomYButton = chartContainer.append('div')
      .attr('class', 'explorer-dichtimeline__zoom-y')
      .attr('title', 'Zoom') // TODO externalize
      .on('click', () => {
        zoomY = !zoomY
        animateNextUpdate = true
        resizeAndPositionElements()
      })
  }

  exports.populateChart =
  function (questionIDInput, perspectiveIDInput, selectedPerspectiveOptions) {
    displayChartElements(true)
    animateNextUpdate = false

    // Arguments
    questionID = questionIDInput
    perspectiveID = perspectiveIDInput

    // TODO check actually delivered time points in statJson data?
    // TODO generate timepoint texts in daxplore export file to experiment with that as an array here
    // DATA
    const optionTexts = dax.data.getOptionTexts(perspectiveID)
    currentOptions = []
    const pointData = []
    zoomYDomain = -1
    // dax.data.perspectiveOp
    const optionCount = dax.data.getQuestionOptionCount(perspectiveID)
    for (let option = 0; option < optionCount; option++) {
      const isSelected = selectedPerspectiveOptions.indexOf(option) !== -1
      const values = []
      dax.data.getTimepoints(perspectiveID).forEach(function (timepoint) {
        if (dax.data.hasTimepoint(questionID, timepoint)) {
          const freq = dax.data.getFrequency(questionID, perspectiveID, option, timepoint)
          const selected = dax.data.getDichSelected(questionID)
          let selectedCount = 0
          let totalCount = 0
          for (let i = 0; i < freq.length; i++) {
            if (freq[i] > 0) {
              totalCount += freq[i]
              for (let j = 0; j < selected.length; j++) {
                if (i === selected[j]) {
                  selectedCount += freq[i]
                }
              }
            }
          }
          if (totalCount > 0) {
            const percentage = selectedCount / totalCount
            zoomYDomain = Math.max(zoomYDomain, percentage)
            if (isSelected) {
              values.push({
                timepoint: timepoint,
                percentage: percentage,
                count: totalCount,
              })
              pointData.push({
                index: option,
                timepoint: timepoint,
                percentage: percentage,
              })
            }
          }
        }
      })
      if (isSelected) {
        currentOptions.push({
          index: option,
          id: optionTexts[option],
          values: values,
        })
      }
    }
    zoomYDomain = Math.min(1.0, Math.ceil((zoomYDomain) * 10) / 10)

    // UPDATE HEADER
    const shortText = dax.data.getQuestionShortText(questionID)
    const longText = dax.data.getQuestionFullText(questionID)
    headerMain.text(shortText)
    headerSub
      .text(longText)
      .style('display', longText === '' || shortText === longText ? 'none' : null)
    headerDich.text(getDichotomizedSubtitleText())

    // X SCALE
    xScale.domain(dax.data.getTimepoints(perspectiveID))

    // Z SCALE (color)
    const allIndicesArray = dax.data.getPerspectiveOptionIndicesColumnOrder(perspectiveID)
    zScaleColor.domain(allIndicesArray)

    // CHART LINES
    const lines = mainLineGroup.selectAll('.dichtimeline__line')
      .data(
        currentOptions, // data
        function (option) { return option.index } // key function
      )

    // Mouseover elements added to cover underlying elements when highlighted
    const mouseoverLines = mouseoverLineGroup.selectAll('.dichtimeline__line-hover')
      .data(
        currentOptions, // data
        function (option) { return option.index } // key function
      )

    // remove old lines
    lines.exit().remove()
    mouseoverLines.exit().remove()

    // add new lines
    lines.enter().append('path')
    .attr('class', function (d) { return 'dichtimeline__line dataset-' + d.index })
      .attr('fill', 'none')
      .attr('stroke', function (d) { return zScaleColor(d.index) })
      .attr('stroke-width', '3')
      .on('mouseover', function (d) { addMouseoverHighlights(d.index) })
      .on('mouseout', removeMouseoverHighlights)

    mouseoverLines.enter().append('path')
      .attr('class', function (d) { return 'dichtimeline__line-hover dataset-' + d.index })
      .attr('fill', 'none')
      .attr('stroke', function (d) { return zScaleColor(d.index) })
      .attr('stroke-width', '3')
      .attr('opacity', '0')
      .attr('pointer-events', 'none')

    // CHART POINTS
    const points = mainLineGroup.selectAll('.dichtimeline__point')
      .data(
        pointData, // data
        function (option) { return option.index + '@' + option.timepoint } // key function
      )

    // Mouseover elements added to cover underlying elements when highlighted
    const mouseoverPoints = mouseoverLineGroup.selectAll('.dichtimeline__point-hover')
      .data(
        pointData, // data
        function (option) { return option.index + '@' + option.timepoint } // key function
      )

    const mouseoverPercentages = mouseoverLineGroup.selectAll('.dichtimeline__percentage')
      .data(
        pointData, // data
        function (option) { return option.index + '@' + option.timepoint } // key function
      )

    // remove old points
    points.exit().remove()
    mouseoverPoints.exit().remove()
    mouseoverPercentages.exit().remove()

    // add new points
    points.enter().append('path')
      .attr('class', function (d) { return 'dichtimeline__point dataset-' + d.index })
      .attr('fill', function (d) { return zScaleColor(d.index) })
      .attr('stroke', function (d) { return zScaleColor(d.index) })
      .attr('d', pointSymbol.size(pointSize))
      .on('mouseover', function (d) { addMouseoverHighlights(d.index) })
      .on('mouseout', removeMouseoverHighlights)

    mouseoverPoints.enter().append('path')
      .attr('class', function (d) { return 'dichtimeline__point-hover dataset-' + d.index })
      .attr('fill', function (d) { return zScaleColor(d.index) })
      .attr('stroke', function (d) { return zScaleColor(d.index) })
      .attr('d', pointSymbol.size(pointFocusSize))
      .attr('opacity', '0')
      .on('mouseover', function (d) { addMouseoverHighlights(d.index) })
      .on('mouseout', removeMouseoverHighlights)

    mouseoverPercentages.enter().append('text')
      .attr('class', function (d) { return 'dichtimeline__percentage dataset-' + d.index })
      .style('font-size', pointTextSize + 'px')
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .style('cursor', 'default')
      .style('display', 'none')
      .on('mouseover', function (d) { addMouseoverHighlights(d.index) })
      .on('mouseout', removeMouseoverHighlights)

    // Update points
    mouseoverLineGroup.selectAll('.dichtimeline__percentage')
      .text(function (d) { return percentageFormat(d.percentage) })

    // UPDATE LEGEND
    // Update legend titles
    legendPerspectiveHeader
      .text(dax.data.getQuestionShortText(perspectiveID))
    legendQuestionHeader
      .text(dax.data.getQuestionShortText(questionID))

    // Set new data for the legends
    const perspectiveOptionRows = legendPerspectiveOptionTable.selectAll('.legend__row')
      .data(
        currentOptions, // data
        function (option) { return option.index } // key function, mapping a specific DOM element to a specific option index
      )

    const questionOptionData = dax.data.getOptionTexts(questionID).map(function (t, i) {
      return { index: i, text: t }
    })
    const questionOptionRows = legendQuestionOptionTable.selectAll('.legend__row')
      .data(
        questionOptionData, // data
        function (option) { return option.index } // key function, mapping a specific DOM element to a specific option index
      )

    // Remove old rows
    perspectiveOptionRows.exit().remove()
    questionOptionRows.exit().remove()

    // Add new rows
    const perspectiveOptionEnter = perspectiveOptionRows.enter()
    .append('div')
      .classed('legend__row', true)
      .on('mouseover', function (d) { addMouseoverHighlights(d.index) })
      .on('mouseout', removeMouseoverHighlights)

    perspectiveOptionEnter.append('div')
      .attr('class', 'legend__color-square')
    perspectiveOptionEnter.append('div')
      .attr('class', 'legend__row-text')

    const questionOptionEnter = questionOptionRows.enter()
      .append('div')
        .classed('legend__row', true)

    questionOptionEnter.append('div')
      .attr('class', 'legend__row-text')

    // reselect rows and use single-select to propagate data join to contained items
    const perspectiveRows = legendPerspectiveOptionTable.selectAll('.legend__row')
      .attr('class', function (d) {
        const depth = dax.data.getPerspectiveOptionTreeDepth(perspectiveID, d.index)
        let indentDepth = 0
        if (depth >= 1) {
          const parent = dax.data.getPerspectiveOptionParent(perspectiveID, d.index)
          if (selectedPerspectiveOptions.indexOf(parent) !== -1) {
            indentDepth += 1
          }
          if (depth >= 2) {
            const parentParent = dax.data.getPerspectiveOptionParent(perspectiveID, parent)
            if (selectedPerspectiveOptions.indexOf(parentParent) !== -1) {
              indentDepth += 1
            }
          }
        }
        return 'legend__row legend__row--indent-' + indentDepth
      })
      .attr('title', function (option) {
        let text = dax.data.getQuestionOptionText(perspectiveID, option.index)
        if (option.nodata) {
          text += ' ' + dax.text('explorer.chart.dichtimeline.legend.missing_data')
        }
        return text
      })

    const dichSelected = dax.data.getDichSelected(questionID)
    const questionRows = legendQuestionOptionTable.selectAll('.legend__row')
      .attr('class', 'legend__row')
      .attr('title', function (option) { return option.text })
      .style('opacity', function (option) { return dichSelected.indexOf(option.index) !== -1 ? 1 : 0.6 })

    // update color and text for each row
    perspectiveRows.select('.legend__color-square')
      .style('background-color', colorPrimary)
    perspectiveRows.select('.legend__row-text')
      .text(function (option) {
        let text = dax.data.getQuestionOptionText(perspectiveID, option.index)
        if (option.nodata) {
          text += ' ' + dax.text('explorer.chart.dichtimeline.legend.missing_data')
        }
        return text
      })
      .style('font-style', function (option) { return option.nodata ? 'italic' : null })

    questionRows.select('.legend__row-text')
      .text(function (option) { return (dichSelected.indexOf(option.index) === -1 ? '✖ ' : '✔ ') + option.text })
      .style('margin-left', '0')

    updateAxisStyles()
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

  // Hide all dichtimeline chart elements
  // Called whenever the entire chart should be hidden, so that another chart type can be dislpayed
  exports.hide =
  function () {
    displayChartElements(false)
  }

  /** INTERNAL FUNCTIONS **/

  // Hide or show all top level elements
  function displayChartElements (show) {
    headerDiv.style('display', show ? null : 'none')
    chartContainer.style('display', show ? null : 'none')
    legendDiv.style('display', show ? null : 'none')
    // saveImageButton.style('display', show ? null : 'none')
  }

  // Update the size and position of all chart elements.
  // Called when the content or the size is updated.
  function resizeAndPositionElements () {
    // CHART SIZE
    // Estimate the minimum width needed for the chart with the current content
    const chartNeededWidth = margin.left + margin.right + // margins
      30 + // y axis width // TODO calculate
      10 * 2 + // space outside of line segments // TODO calculate
      50 * dax.data.getTimepoints(perspectiveID).length // min width each time point

    // Check if vertical scroll is needed
    const scrollNeeded = availableWidth < chartNeededWidth

    // Enable or disable scroll on the div containing the meanbars chart
    // TODO function call or event to chartpanel?
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
      left: wrapperClientBB.left + window.scrollX,
      top: wrapperClientBB.top + window.scrollY,
      width: wrapperClientBB.width,
    }

    // X AXIS
    // Update the space available for the x axis
    xScale.range([0, width])
    // Move and update the x axis
    xAxisElement
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)

    // Y AXIS
    // Update the space available for the y axis, its domain and ticks
    yScale
      .range([height, 0])
      .domain([0, zoomY ? zoomYDomain : 1])

    // Update the width of the y axis lines
    let tickCount = zoomY ? (zoomYDomain * 10) : 10
    tickCount *= tickCount <= 3 ? 2 : 1

    yAxis
      .tickSizeInner(width)
      .ticks(tickCount)

    // Update the y axis
    yAxisElement.interrupt().selectAll('*').interrupt()
    conditionalApplyTransition(yAxisElement, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + width + ',0)')
      .call(yAxis)

    // update path data for all lines
    const lines = chartG.selectAll('.dichtimeline__line, .dichtimeline__line-hover')
    lines.interrupt().selectAll('*').interrupt()
    conditionalApplyTransition(lines, elementTransition, animateNextUpdate)
      .attr('d', function (d) { return line(d.values) })

    // position all points
    const xBandwidth = xScale.bandwidth()
    const points = chartG.selectAll('.dichtimeline__point, .dichtimeline__point-hover')
    points.interrupt().selectAll('*').interrupt()
    conditionalApplyTransition(points, elementTransition, animateNextUpdate)
      .attr('transform', function (d) {
        return 'translate(' + (xScale(d.timepoint) + xBandwidth / 2) + ',' + yScale(d.percentage) + ')'
      })

    chartG.selectAll('.dichtimeline__percentage')
      .attr('transform', function (d) {
        return 'translate(' +
        (xScale(d.timepoint) + xBandwidth / 2) + ',' +
        (yScale(d.percentage) + 4) + ')'
      })

    // LEGEND
    // Set the vertical position and height of the legend area
    // The position of the legend div is then adjusted via flex parameters relative the defined area
    legendDiv
      .style('margin-top', chartBB.top + 'px')
      .style('height', chartBB.height + 'px')

    // Update Y axis zoom button
    zoomYButton.classed('explorer-dichtimeline__zoom-y--unzoom', zoomY)

    updateAxisStyles()
  }

  function addMouseoverHighlights (focusedIndex) {
    removeMouseoverHighlights()
    for (let i = 0; i < currentOptions.length; i++) {
      const optionIndex = currentOptions[i].index

      const row = d3.select('.legend__row-' + optionIndex)
      row.interrupt().selectAll('*').interrupt()

      const lineMain = chartG.selectAll('.dichtimeline__line.dataset-' + optionIndex)
      lineMain.interrupt().selectAll('*').interrupt()

      const pointMain = chartG.selectAll('.dichtimeline__point.dataset-' + optionIndex)
      pointMain.interrupt().selectAll('*').interrupt()

      if (optionIndex !== focusedIndex) {
        row.transition(fadeTransition)
            .style('opacity', 0.6)

        lineMain.transition(fadeTransition)
            .attr('opacity', 0.3)

        pointMain.transition(fadeTransition)
            .attr('opacity', 0.3)
      } else {
        row.style('opacity', 1)
        lineMain.attr('opacity', 1)
        pointMain.attr('opacity', 1)
      }
    }

    // Highlight chart line elements
    chartG.selectAll('.dichtimeline__percentage.dataset-' + focusedIndex)
      .style('display', 'block')

    chartG.selectAll('.dichtimeline__line-hover.dataset-' + focusedIndex)
      .attr('opacity', '1')

    chartG.selectAll('.dichtimeline__point-hover.dataset-' + focusedIndex)
      .attr('opacity', '1')

    // Fade other legend options
    const rows = legendPerspectiveOptionTable.selectAll('.dichtimeline__legend .legend__row')
    // Stop all current legend row animations
    rows.interrupt().selectAll('*').interrupt()
    // Fade non-selected options
    rows
      .style('opacity', function (d) { return d.index === focusedIndex ? 1 : 0.4 })
  }

  function removeMouseoverHighlights () {
    for (let i = 0; i < currentOptions.length; i++) {
      const optionIndex = currentOptions[i].index
      const row = d3.select('.legend__row-' + optionIndex)
      row.interrupt().selectAll('*').interrupt()
      row
        .transition(fadeTransition)
        .style('opacity', 1)
    }
    const lineMain = chartG.selectAll('.dichtimeline__line')
    lineMain.interrupt().selectAll('*').interrupt()
    lineMain
      .transition(fadeTransition)
      .attr('opacity', 1)

    const pointMain = chartG.selectAll('.dichtimeline__point')
    pointMain.interrupt().selectAll('*').interrupt()
    pointMain
      .transition(fadeTransition)
      .attr('opacity', 1)

    // Hide highlight chart elements
    chartG.selectAll('.dichtimeline__percentage')
      .style('display', 'none')

    chartG.selectAll('.dichtimeline__line-hover')
      .attr('opacity', '0')

    chartG.selectAll('.dichtimeline__point-hover')
      .attr('opacity', '0')

    // Unfade legend
    const rows = legendPerspectiveOptionTable.selectAll('.dichtimeline__legend .legend__row')
    // Stop all current legend row animations
    rows.interrupt().selectAll('*').interrupt()
    // Set all legend rows to visible again
    rows.transition(fadeTransition)
      .style('opacity', 1)
  }

  function updateAxisStyles () {
    chartG.selectAll('.axis .domain')
      .style('visibility', 'hidden')

    chartG.selectAll('.axis path, .axis line')
      .style('fill', 'none')
      .style('stroke', '#bbb')
      .style('shape-rendering', 'geometricPrecision')
  }

  // Generate specially formatted subtitle for selected options
  function getDichotomizedSubtitleText () {
    const optionTexts = dax.data.getOptionTexts(questionID)
    const usedDichTexts = []
    dax.data.getDichSelected(questionID).forEach(function (i) {
      usedDichTexts.push(optionTexts[i])
    })

    const optCount = usedDichTexts.length
    if (optCount === 0) { return '' }

    const subStart = dax.text('explorer.chart.dichotomized_line.subtitle_start')
    const subEnd = dax.text('explorer.chart.dichotomized_line.subtitle_end')

    if (usedDichTexts.length === 1) {
      return subStart + usedDichTexts[0] + subEnd
    }

    const subSeparator = dax.text('explorer.chart.dichotomized_line.subtitle_separator')
    const subOr = dax.text('explorer.chart.dichotomized_line.subtitle_or')

    let sub = subStart
    sub += usedDichTexts.slice(0, optCount - 1).join(subSeparator)
    sub += subOr + usedDichTexts[optCount - 1] + subEnd

    return sub
  }

  // Helper function for bar and legend colors.
  // The option argument is an option data object used in the d3 data join for the bars and legend rows.
  function colorPrimary (option) { return option.nodata ? '#999' : zScaleColor(option.index) } // TODO externalize no data color
  // function colorHover (option) { return option.nodata ? '#888' : zScaleColorHover(option.index) } // TODO externalize no data color

  // Helper
  function conditionalApplyTransition (selection, transition, useTransition) {
    return useTransition ? selection.transition(transition) : selection
  }
})(window.dax = window.dax || {})
