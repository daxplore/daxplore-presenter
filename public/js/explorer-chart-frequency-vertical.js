(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.frequencyVertical = namespace.chart.frequencyVertical || {}
  const exports = namespace.chart.frequencyVertical

  /** CHART TYPE AND INSTANCE VARIABLES **/

  // CONSTANTS
  const paddingInner = 0.3
  const paddingOuter = 0.3
  let yAxisWidth = 0
  const xAxisTopHeight = 10
  const margin = { top: 10, right: 25, bottom: 20, left: 10 }
  const missingDataColor = d3.hsl('#BBB') // TODO externalize to producer?
  // const saveImageCanvasWidth = 600
  const elementTransition = d3.transition().duration(300).ease(d3.easeLinear)

  // SIZE VARIABLES
  let availableWidth = 600 // initial placeholder value
  let width = availableWidth
  // let availableHeight = 300
  // let height = 300 // initial placeholder value

  // CHART RESOURCES
  // HEADER
  let headerDiv, headerMain, headerSub, headerTooltip
  // SCALES AND AXISES
  // let xScale, xAxis, xAxisElement
  let xScale, xAxisScale
  let xAxisBottom, xAxisBottomElement, xAxisTop, xAxisTopElement
  let yScale, yAxis, yAxisElement
  let zScaleColor
  // CHART
  let chartContainer, chartBB, chart, chartG
  // LEGEND
  let legendDiv, legendQuestionHeader, legendQuestionOptionTable, legendMissingData
  // BUTTONS
  let saveImageButton

  // STATE TRACKING
  let animateNextUpdate = false

  // CURRENT FREQUENCY CHART
  let question, perspective, data
  let selectedPerspectiveOptionIndices, selectedPerspectiveOptions, optionKeys
  let highlightedQuestionOption //, highlightedPerspectiveOption
  let hasMissingData

  /** EXPORTED FUNCTIONS **/

  // Constructor, used to initialize the chart type.
  // Run once when the page is loaded. Call populateChart in order to update the chart content.
  exports.initializeResources =
  function (primaryColors) {
    // INITIALIZE HEADER
    headerDiv = d3.select('.header-section').append('div')
      .attr('class', 'header-section__freqs-vertical')
    headerMain = headerDiv.append('div')
      .attr('class', 'header-section__main')
    headerSub = headerDiv.append('div')
      .attr('class', 'header-section__sub')
    headerTooltip = headerDiv.append('div')
      .attr('class', 'header-section__freq-vertical-tooltip')
      .text('\xa0')

    // INITIALIZE CHART
    // base div element
    chartContainer = d3.select('.chart').append('div')
      .attr('class', 'explorer-freq')

    // base svg element
    chart = chartContainer.append('svg')
      .attr('class', 'explorer-freq')

    // white background
    chart.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'white')

    // margin adjusted chart element
    chartG = chart.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    // x axis bottom
    xScale = d3.scaleLinear()
      .rangeRound([0, width - 2])
      .domain([0, 1])

    xAxisScale = d3.scaleLinear()
      .rangeRound([0, width])
      .domain([0, 1])

    xAxisBottom = d3.axisBottom(xAxisScale)
      .tickFormat(d3.format('.0%'))
      .tickSize(0)
      // .tickSizeInner(height)

    xAxisBottomElement = chartG.append('g')
      .attr('class', 'axis frequency-x-axis')
      .call(xAxisBottom)

    xAxisTop = d3.axisTop(xAxisScale)
      .tickFormat(d3.format('.0%'))
      .tickSize(0)
      .tickSizeInner(0)

    xAxisTopElement = chartG.append('g')
      .attr('class', 'axis frequency-x-axis')
      .call(xAxisTop)

    // y axis
    yScale = d3.scaleBand()
      // .rangeRound([0, height])
      .paddingInner(paddingInner)
      .paddingOuter(paddingOuter)

    yAxis = d3.axisLeft(yScale)
      .tickSize(5)

    yAxisElement = chartG.append('g')
      .attr('class', 'axis frequency-y-axis')
      .call(yAxis)

    // z axis, color coding
    zScaleColor = d3.scaleOrdinal().range(primaryColors)

    // INITIALIZE LEGEND
    // top level freqs legend container
    legendDiv = d3.select('.legend').append('div')
      .attr('class', 'freqs__legend')

    // empty flex element, used to dynamically align the legend content vertically
    legendDiv.append('div')
      .style('flex', '1')

    // legend for the question and selected options
    legendQuestionHeader = legendDiv.append('h4')
      .attr('class', 'legend__header')
    legendQuestionOptionTable = legendDiv.append('div')
    legendMissingData = legendDiv.append('div')
      .attr('class', 'legend__row')
      .style('margin-top', '15px')
    legendMissingData.append('div')
      .attr('class', 'legend__color-square')
      .style('background-color', missingDataColor)
    legendMissingData.append('div')
      .attr('class', 'legend__row-text')
      .text(dax.text('explorer.chart.frequency_bar.legend.missing_data'))
      .attr('title', dax.text('explorer.chart.frequency_bar.legend.missing_data'))
      .on('mouseover', function () {
        setHorizontalHighlight('MISSING_DATA')
        legendOptionMouseOver('MISSING_DATA')
      })
      .on('mouseout', function () {
        legendOptionMouseOut()
        unsetHorizontalHighlight()
      })

    // empty flex element, used to dynamically align the legend content vertically
    legendDiv.append('div')
      .style('flex', '3')

    // SAVE IMAGE BUTTON
    // TODO create general save button manager
    saveImageButton = d3.select('.chart-panel').append('div')
      .classed('dashed-button', true)
      .classed('dichtimeline__save-image', true)
      // .on('click', generateImage)
      .text(dax.text('common.button.save_chart_as_image'))
  }

  // Set new data to be displayed by the chart.
  // As a side effect, make this chart visible.
  exports.populateChart =
  function (questionID, perspectiveID, selectedPerspectiveOptionIndicesInput) {
    displayChartElements(true)
    animateNextUpdate = true
    perspective = perspectiveID
    question = questionID
    selectedPerspectiveOptionIndices = selectedPerspectiveOptionIndicesInput

    // Reset mouseover effects when loading new chart
    headerTooltip.text('\xa0')

    hasMissingData = false

    optionKeys = dax.data.getOptionTexts(question)
    optionKeys.push('MISSING_DATA')

    selectedPerspectiveOptions = []
    selectedPerspectiveOptionIndices.forEach(function (i) {
      selectedPerspectiveOptions.push(dax.data.getQuestionOptionText(perspective, i))
    })

    // Generate data
    data = []
    const perspectiveOptions = dax.data.getOptionTexts(perspective)

    selectedPerspectiveOptionIndices.forEach(function (i) {
      const stat = dax.data.getFrequency(questionID, perspectiveID, i)
      const total = stat.length > 0 ? stat.reduce(function (a, b) { return a + b }) : 0
      const stackData = {
        __option: perspectiveOptions[i],
        __total: total,
      }
      if (total === 0) {
        hasMissingData = true
        stackData.MISSING_DATA = 1
      } else {
        for (let j = 0; j < optionKeys.length; j++) {
          stackData[optionKeys[j]] = total !== 0 ? stat[j] / total : 0
        }
      }
      data.push(stackData)
    })

    // UPDATE HEADER
    const shortText = dax.data.getQuestionShortText(question)
    const longText = dax.data.getQuestionFullText(question)
    headerMain.text(shortText)
    headerSub
      .text(longText)
      .style('display', longText === '' || shortText === longText ? 'none' : null)

    // UPDATE Y
    yScale.domain(selectedPerspectiveOptions)
    yAxisElement.call(yAxis)
    yAxisElement.selectAll('.tick line')
      .style('display', 'none')

    // UPDATE Z
    zScaleColor.domain(optionKeys)

    // Add and update elements

    // removing everything instead of updating is a hack
    // TODO: figure out how to make enter/exit code work with this chart structure
    chartG.selectAll('.freq-optionrow').remove()

    const rowData = d3.stack().keys(optionKeys)(data)
    const questionOptionRows = chartG.selectAll('.freq-optionrow')
      .data(
        rowData, // data
        //  function (option) { return option.key + ';' + option.index } // key function, mapping a specific DOM element to a specific option index
      )

    // add new rows
    questionOptionRows.enter().append('g')
      .classed('freq-optionrow', true)
      .attr('transform', 'translate(1.5, 0)')

    const sections = chartG.selectAll('.freq-optionrow').selectAll('.freq-optionrow-section')
      .data(
        function (d) {
          return d.map(function (v) {
            return {
              start: v[0],
              end: (isNaN(v[1]) ? v[0] : v[1]),
              key: d.key,
              option: v.data.__option,
            }
          })
        }, // data
        function (option) { return option.option } // key function, mapping a specific DOM element to a specific option index
      )

    sections.enter().append('rect')
      .classed('freq-optionrow-section', true)
      .attr('x', function (d) { return xScale(d.start) })
      .attr('y', function (d) { return yScale(d.option) })
      .attr('height', yScale.bandwidth())
      .attr('width', function (d) { return xScale(d.end) - xScale(d.start) })
      .attr('fill', function (d) { return barFillColor(d.key, 0) })
      .attr('stroke', function (d) { return barStrokeColor(d.key, 0) })
      .attr('stroke-width', 1)
      .on('mouseover', function (d) {
        // Set selected options
        highlightedQuestionOption = d.key
        // highlightedPerspectiveOption = d.option
        // Update legend highlight
        legendOptionMouseOver(highlightedQuestionOption)
        // Create html for contextual header tooltip
        const perspectiveOptionText = d.option
        let html
        if (d.key === 'MISSING_DATA') {
          const cutoff = dax.settings('export.statistics.group_cutoff')
          html = dax.text('explorer.chart.frequency_bar.tooltip.single_timepoint_missing', cutoff, perspectiveOptionText) // TODO externalize cutoff
        } else {
          const percentageText = dax.common.percentageFormat(d.end - d.start)
          const questionOptionText = d.key
          const color = barStrokeColor(d.key, 0).darker(0.7)
          html = dax.text('explorer.chart.frequency_bar.tooltip.single_timepoint', percentageText, perspectiveOptionText, questionOptionText, color)
        }
        // Set new header tooltip
        headerTooltip.html(html)
      })
      .on('mouseout', function (d) {
        // Deselect any legend options
        legendOptionMouseOut()
        headerTooltip.text('\xa0')
      })

    // remove old sections
    sections.exit().remove()

    // UPDATE LEGEND
    // Update legend title
    legendQuestionHeader
      .text(dax.data.getQuestionShortText(question))

    // Set new data for the legend
    const optionRows = legendQuestionOptionTable.selectAll('.legend__row')
      .data([].concat(dax.data.getOptionTexts(question)).reverse())

    // Remove old rows
    optionRows.exit().remove()

    // Add new rows
    const optionEnter = optionRows.enter()
      .append('div')
        .attr('class', 'legend__row')
        .on('mouseover', function (option) {
          setHorizontalHighlight(option)
          legendOptionMouseOver(option)
        })
        .on('mouseout', function () {
          unsetHorizontalHighlight()
          legendOptionMouseOut()
        })
    optionEnter.append('div')
      .attr('class', 'legend__color-square')
    optionEnter.append('div')
      .attr('class', 'legend__row-text')

    // Reselect rows and use single-select to propagate data join to contained items
    // update color and text for each row
    const rows = legendQuestionOptionTable.selectAll('.legend__row')
    rows.select('.legend__color-square')
      .style('background-color', zScaleColor)
    rows.select('.legend__row-text')
      .text(function (option) { return option })
      .style('font-style', function (option) { return option.nodata ? 'italic' : null })
      .attr('title', function (option) { return option })

    // Missing data option, show or hide
    legendMissingData.style('display', hasMissingData ? null : 'none')

    // UPDATE STYLES
    updateStyles()
  }

  // Set the size available for the chart.
  // Updates the chart so it fits in the new size.
  // As a side effect, enable horizontal scrolling if needed for the chart to fit the given room.
  exports.setSize =
  function (availableWidthInput) {
    animateNextUpdate = availableWidth === availableWidthInput
    availableWidth = availableWidthInput
    resizeAndPositionElements()
  }

  // Hide all frequency chart elements
  // Called whenever the entire chart should be hidden, so that another chart type can be dislpayed
  exports.hide =
  function () {
    displayChartElements(false)
  }

  /** INTERNAL FUNCTIONS **/

  // Hide or show all top level elements: header, chart and legend
  function displayChartElements (show) {
    headerDiv.style('display', show ? null : 'none')
    chartContainer.style('display', show ? null : 'none')
    legendDiv.style('display', show ? null : 'none')
    saveImageButton.style('display', show ? null : 'none')
  }

  // Update the size and position of all chart elements.
  // Called when the content or the size is updated.
  function resizeAndPositionElements () {
    // Estimate width needed to display chart without internal overlap
    // const xAxisWidth = 31 // could be calculated?
    // const outsideMargin = 24 // could be calculated?
    // const innerMarginBars = 25 // could be calculated?
    // const minWidthBar = 32
    // const selectedPerspectiveOptionCount = selectedPerspectiveOptions.length

    // CALCULATE HEIGHT
    const bandWidth = 20
    // rearranged equation from d3's source file band.js, ignoring the floor call
    // https://github.com/d3/d3-scale/blob/fd07dd8ceeaeaec612f675050ac134243b406f64/src/band.js#L26
    const barSectionHeight = Math.max(1, selectedPerspectiveOptions.length - paddingInner + paddingOuter * 2) * bandWidth / (1 - paddingInner)
    const yStop = barSectionHeight + xAxisTopHeight

    let longestPerspectiveOptionTextLength = 0
    yAxisElement.selectAll('text')
      .each(function () {
        if (this.getBBox().width > longestPerspectiveOptionTextLength) {
          longestPerspectiveOptionTextLength = this.getBBox().width
        }
      })

    // UPDATE Y-AXIS
    yScale.range([xAxisTopHeight, yStop]) // TODO switch

    // Update the space available for the y axis
    yAxisElement
      .call(yAxis)

    yAxisWidth = Math.max(50, yAxisElement.node().getBBox().width)

    yAxisElement.interrupt().selectAll('*').interrupt()
    conditionalApplyTransition(yAxisElement, elementTransition, animateNextUpdate)
      .style('transform', 'translate(' + yAxisWidth + 'px,0)')

    const chartNeededWidth = margin.left + margin.right + yAxisWidth + 300
    // Check if vertical scroll is needed
    const scrollNeeded = availableWidth < chartNeededWidth

    // Enable or disable scroll on the div containing the frequency cchart
    d3.select('.chart')
      .classed('chart-scroll', scrollNeeded)
      .style('width', scrollNeeded ? availableWidth + 'px' : null)

    // SET MAIN ELEMENT WIDTH AND HEIGHT
    // Update width of the chart, which may be bigger than the available space if scrolling is enabled
    width = scrollNeeded ? chartNeededWidth : availableWidth
    width = width - margin.left - margin.right
    // height = availableHeight - margin.top - margin.bottom
    chart
      .attr('width', width + margin.left + margin.right)

    // chart
    //   .attr('width', width)

    // Skip animation if it would result in an iframe resize
    const newHeight = yStop + margin.top + margin.bottom
    // const isSmaller = newHeight <= tallestChartSoFar
    // tallestChartSoFar = Math.max(newHeight, tallestChartSoFar)
    // conditionalApplyTransition(chart, elementTransition, animateNextUpdate && isSmaller)
    chart.attr('height', newHeight)
    // .attr('height', height + margin.top + margin.bottom)

    // Update bounding box definition for the chart
    const wrapperClientBB = d3.select('.chart').node().getBoundingClientRect()
    chartBB = {
      height: wrapperClientBB.height,
      left: wrapperClientBB.left + window.scrollX,
      top: wrapperClientBB.top + window.scrollY,
      width: wrapperClientBB.width,
    }

    // UPDATE X AXIS
    xScale.rangeRound([yAxisWidth, width - 2])
    xAxisScale.rangeRound([yAxisWidth, width])
    xAxisBottom.tickSizeInner(-(yStop - xAxisTopHeight))
    xAxisBottomElement
    // conditionalApplyTransition(xAxisBottomElement, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + 0 + ',' + yStop + ')')
      .call(xAxisBottom)

    xAxisTopElement
    // conditionalApplyTransition(xAxisBottomElement, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + 0 + ',' + xAxisTopHeight + ')')
      .call(xAxisTop)

    // UPDATE BARS
    // Update size and position for each bar element
    const sections = d3.selectAll('.freq-optionrow-section')
    sections
      .attr('x', function (d) { return xScale(d.start) })
      .attr('y', function (d) { return yScale(d.option) })
      .attr('height', yScale.bandwidth())
      .attr('width', function (d) { return xScale(d.end) - xScale(d.start) })

    // LEGEND
    // Set the vertical position and height of the legend area
    // The position of the legend div is then adjusted via flex parameters relative the defined area
    legendDiv
      .style('margin-top', (chartBB.top + 0) + 'px')
      .style('height', chartBB.height + 'px')
  }

  function setHorizontalHighlight (option) {
    const rows = d3.selectAll('.freq-optionrow-section')
    rows
      .style('filter', function (d) {
        if (option === 'MISSING_DATA') {
          return d.key === option ? 'brightness(0.93)' : null
        }
        return d.key === option ? null : 'grayscale(1) brightness(1.2)'
      })
  }

  function unsetHorizontalHighlight () {
    const rows = d3.selectAll('.freq-optionrow-section')
    rows.style('filter', null)
  }

  function barFillColor (key) {
    return key === 'MISSING_DATA' ? missingDataColor : d3.hsl(zScaleColor(key))
  }

  function barStrokeColor (key) {
    return barFillColor(key).darker(0.8)
  }

  function updateStyles () {
    chartG.selectAll('.axis .domain')
      .style('visibility', 'hidden')

    chartG.selectAll('.axis path, .axis line')
      .style('fill', 'none')
      .style('stroke', '#bbb')
      .style('shape-rendering', 'geometricPrecision')

    chartG.selectAll('text')
      .style('fill', '#555')
      .style('font-size', '13px')
      .style('font-family', '"Varta", sans-serif')
      .style('cursor', 'default')

    yAxisElement.selectAll('.tick text')
      .style('fill', 'black')
  }

  function legendOptionMouseOver (hoveredOption) {
    const rows = d3.selectAll('.freqs__legend .legend__row')
    // Stop all current legend row animations
    rows.interrupt().selectAll('*').interrupt()
    // Fade non-selected options
    rows
      .style('opacity', function (option) { return hoveredOption === option ? 1 : 0.4 })

    legendMissingData
      .style('opacity', function (option) { return hoveredOption === 'MISSING_DATA' ? 1 : 0.4 })
  }

  function legendOptionMouseOut () {
    // Set all legend rows to visible again
    const rows = d3.selectAll('.freqs__legend .legend__row')
    rows.style('opacity', 1)
  }

  // Helper
  function conditionalApplyTransition (selection, transition, useTransition) {
    return useTransition ? selection.transition(transition) : selection
  }
})(window.dax = window.dax || {})
