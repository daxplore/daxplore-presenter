(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.frequencyVertical = namespace.chart.frequencyVertical || {}
  const exports = namespace.chart.frequencyVertical

  /** CHART TYPE AND INSTANCE VARIABLES **/

  // CONSTANTS
  const bandWidth = 27
  const paddingInner = 0.2
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

  // CHART RESOURCES
  // HEADER
  let headerDiv, headerMain, headerSub, headerTooltip
  // SCALES AND AXISES
  // let xScale, xAxis, xAxisElement
  let xScale, xAxisScale
  let xAxisBottom, xAxisBottomElement, xAxisTop, xAxisTopElement
  let yScale, yAxis, yAxisElement, yAxisReferenceElement
  let zScaleColor
  // CHART
  let chartContainer, chartBB, chart, chartG
  // LEGEND
  let legendDiv, legendQuestionHeader, legendQuestionOptionTable, legendMissingData
  // BUTTONS
  let saveImageButton

  // STATE TRACKING
  let animateNextUpdate = false
  let populateCount = 0

  // CURRENT FREQUENCY CHART
  let question, perspectives, data
  let selectedPerspectiveOptions, optionKeys
  let highlightedQuestionOption
  let hasMissingData

  /** EXPORTED FUNCTIONS **/

  // Constructor, used to initialize the chart type.
  // Run once when the page is loaded. Call populateChart in order to update the chart content.
  exports.initializeResources =
  function (primaryColors) {
    // INITIALIZE HEADER
    headerDiv = d3.select('.header-section').append('div')
      .attr('class', 'header-section__freq-vertical')
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
      .attr('class', 'explorer-freq-vertical')

    // base svg element
    chart = chartContainer.append('svg')
      .attr('class', 'explorer-freq-vertical')

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

    xAxisBottomElement = chartG.append('g')
      .attr('class', 'axis freq-vertical--x-axis')
      .call(xAxisBottom)

    xAxisTop = d3.axisTop(xAxisScale)
      .tickFormat(d3.format('.0%'))
      .tickSize(0)
      .tickSizeInner(0)

    xAxisTopElement = chartG.append('g')
      .attr('class', 'axis freq-vertical-x-axis')
      .call(xAxisTop)

    // y axis
    yScale = d3.scaleBand()
      .paddingInner(paddingInner)
      .paddingOuter(paddingOuter)

    yAxis = d3.axisLeft(yScale)
      .tickSize(3)
      .tickFormat(function (opt) {
        const optSplit = opt.split('|')
        switch (optSplit[0]) {
        case 'HEADER': return dax.data.getPerspectivesOptionTexts(perspectives.slice(0, 1), Number(optSplit[1]))
        case 'DATA': return dax.data.getPerspectivesOptionTexts(perspectives, optSplit[1]).slice(-1)
        }
      })

    yAxisReferenceElement = chartG.append('g')
      .attr('class', 'axis freq-vertical-y-axis')
      .style('opacity', 0)

    yAxisElement = chartG.append('g')
      .attr('class', 'axis freq-vertical-y-axis')

    // z axis, color coding
    zScaleColor = d3.scaleOrdinal().range(primaryColors)

    // INITIALIZE LEGEND
    // top level freqs legend container
    legendDiv = d3.select('.legend').append('div')
      .attr('class', 'freq-vertical__legend')

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
  function (questionID, perspectivesInput, selectedPerspectiveOptionsInput) {
    displayChartElements(true)

    // ARGUMENT
    question = questionID
    perspectives = perspectivesInput
    selectedPerspectiveOptions = selectedPerspectiveOptionsInput

    // ANIMATIONS
    populateCount++
    animateNextUpdate = populateCount > 1

    // TOOLTIP
    // Reset mouseover effects when loading new chart
    headerTooltip.text('\xa0')

    // DATA
    hasMissingData = false
    optionKeys = dax.data.getOptionTexts(question)
    optionKeys.push('MISSING_DATA')

    // Restructure the input data
    data = []
    let secondarySection = -1
    selectedPerspectiveOptions.forEach(function (option) {
      if (perspectives.length === 2) {
        const newSecondarySection = Math.floor(option / dax.data.getQuestionOptionCount(perspectives[1]))
        if (secondarySection !== newSecondarySection) {
          secondarySection = newSecondarySection
          data.push({
            index: secondarySection,
            nodata: true,
            type: 'HEADER',
            rowKey: 'HEADER|' + secondarySection,
          })
        }
      }
      const stat = dax.data.getFrequency(questionID, perspectives, option)
      const total = stat.length > 0 ? stat.reduce(function (a, b) { return a + b }) : 0
      const stackData = {
        index: option,
        total: total,
        type: 'DATA',
        rowKey: 'DATA|' + option,
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

    const rowKeys = data.map(function (opt) { return opt.rowKey })

    // UPDATE HEADER
    const shortText = dax.data.getQuestionShortText(question)
    const longText = dax.data.getQuestionFullText(question)
    headerMain.text(shortText)
    headerSub
      .text(longText)
      .style('display', longText === '' || shortText === longText ? 'none' : null)

    // UPDATE Y
    yScale.domain(rowKeys)
    yAxis.scale(yScale)

    // UPDATE Z
    zScaleColor.domain(optionKeys)

    // UPDATE OPTION COLUMN
    const rowData = d3.stack().keys(optionKeys)(data)
    const questionOptioncols = chartG.selectAll('.freq-vertical-optioncol')
      .data(
        rowData, // data
        function (option) { // key function, mapping a specific DOM element to a specific option index
          return option.key + ';' + option.index
        }
      )

    // Remove old rows
    questionOptioncols.exit().remove()

    // add new rows
    questionOptioncols.enter().append('g')
      .classed('freq-vertical-optioncol', true)
      .attr('transform', 'translate(1.5, 0)')

    const sections = chartG.selectAll('.freq-vertical-optioncol').selectAll('.freq-vertical-optioncol-section')
      .data(
        function (d) {
          return d.map(function (v) {
            return {
              start: v[0],
              end: (isNaN(v[1]) ? v[0] : v[1]),
              key: d.key,
              index: v.data.index,
              rowKey: v.data.rowKey,
            }
          })
        }, // data
        function (option) {
          return option.rowKey + '|' + option.index
        } // key function, mapping a specific DOM element to a specific option index
      )

    sections.enter().append('rect')
      .classed('freq-vertical-optioncol-section', true)
      .attr('x', function (d) { return xScale(d.start) })
      .attr('y', function (d) { return yScale(d.rowKey) })
      .attr('height', yScale.bandwidth())
      .attr('width', function (d) { return xScale(d.end) - xScale(d.start) })
      .attr('fill', function (d) { return barFillColor(d.key, 0) })
      .attr('stroke', function (d) { return barStrokeColor(d.key, 0) })
      .attr('stroke-width', 1)
      .on('mouseover', function (d) {
        // Set selected options
        highlightedQuestionOption = d.key
        // highlightedPerspectiveOption = d.index
        // Update legend highlight
        legendOptionMouseOver(highlightedQuestionOption)

        // Update mouseover color filter
        d3.select(this)
          .style('filter', 'brightness(0.93)')

        // Hover effect on tick texts
        yAxisElement.selectAll('.tick')
          .classed('freq-vertical__y-tick--hover', function (opt) {
            const optSplit = opt.split('|')
            return optSplit[0] === 'DATA' && parseInt(optSplit[1]) === d.index
          })

        // Create html for contextual header tooltip
        const perspectiveOptionText = d.index
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
        // Reset color filter
        d3.select(this)
          .style('filter', null)
        // Deselect any legend options
        legendOptionMouseOut()
        headerTooltip.text('\xa0')
        yAxisElement.selectAll('.tick')
          .classed('freq-vertical__y-tick--hover', false)
      })

    // remove old sections
    sections.exit().remove()

    // UPDATE LEGEND
    // Update legend title
    legendQuestionHeader
      .text(dax.data.getQuestionShortText(question))

    // Set new data for the legend
    const optioncols = legendQuestionOptionTable.selectAll('.legend__row')
      .data([].concat(dax.data.getOptionTexts(question)).reverse())

    // Remove old rows
    optioncols.exit().remove()

    // Add new rows
    const optionEnter = optioncols.enter()
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
  }

  // Set the size available for the chart.
  // Updates the chart so it fits in the new size.
  // As a side effect, enable horizontal scrolling if needed for the chart to fit the given room.
  exports.setSize =
  function (availableWidthInput) {
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
    // CALCULATE HEIGHT
    // rearranged equation from d3's source file band.js, ignoring the floor call
    // https://github.com/d3/d3-scale/blob/fd07dd8ceeaeaec612f675050ac134243b406f64/src/band.js#L26
    const barSectionHeight = Math.max(1, data.length - paddingInner + paddingOuter * 2) * bandWidth / (1 - paddingInner)
    const yStop = barSectionHeight + xAxisTopHeight

    let longestPerspectiveOptionTextLength = 0
    yAxisElement.selectAll('text')
      .each(function () {
        if (this.getBBox().width > longestPerspectiveOptionTextLength) {
          longestPerspectiveOptionTextLength = this.getBBox().width
        }
      })

    // UPDATE Y-AXIS
    yAxisElement.interrupt().selectAll('*').interrupt()

    yAxisReferenceElement.call(yAxis)

    yAxisReferenceElement.selectAll('.tick')
      .classed('freq-vertical__y-tick', true)
      .classed('freq-vertical__y-tick-header', function (d, i) {
        return d.split('|')[0] === 'HEADER'
      })

    yAxisWidth = Math.max(50, yAxisReferenceElement.node().getBBox().width)

    yScale
      .range([xAxisTopHeight, yStop])
      .align(perspectives.length === 2 ? 0 : 0.5)

    // Update the space available for the y axis
    conditionalApplyTransition(yAxisElement, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + yAxisWidth + ', 0)')
      .call(yAxis)

    yAxisElement.selectAll('.tick')
      .classed('freq-vertical__y-tick', true)
      .classed('freq-vertical__y-tick-header', function (d, i) {
        return d.split('|')[0] === 'HEADER'
      })

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
    chart
      .attr('width', width + margin.left + margin.right)

    chart.attr('height', yStop + margin.top + margin.bottom)

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
    // xAxisBottomElement
    xAxisBottomElement.interrupt().selectAll('*').interrupt()
    conditionalApplyTransition(xAxisBottomElement, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + 0 + ',' + yStop + ')')
      .call(xAxisBottom)

    // xAxisTopElement
    xAxisTopElement.interrupt().selectAll('*').interrupt()
    conditionalApplyTransition(xAxisTopElement, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + 0 + ',' + xAxisTopHeight + ')')
      .call(xAxisTop)

    // UPDATE BARS
    // Update size and position for each bar element
    const sections = chart.selectAll('.freq-vertical-optioncol-section')
    sections
      .attr('height', yScale.bandwidth())
    sections.interrupt().selectAll('*').interrupt()
    conditionalApplyTransition(sections, elementTransition, animateNextUpdate)
      .attr('x', function (d) { return xScale(d.start) })
      .attr('y', function (d) { return yScale(d.rowKey) })
      .attr('width', function (d) { return xScale(d.end) - xScale(d.start) })

    // LEGEND
    // Set the vertical position and height of the legend area
    // The position of the legend div is then adjusted via flex parameters relative the defined area
    legendDiv
      .style('margin-top', (chartBB.top + 20) + 'px')

    // UPDATE STYLES
    updateStyles()
  }

  function setHorizontalHighlight (option) {
    const rows = chart.selectAll('.freq-vertical-optioncol-section')
    rows
      .style('filter', function (d) {
        if (option === 'MISSING_DATA') {
          return d.key === option ? 'brightness(0.93)' : null
        }
        return d.key === option ? null : 'grayscale(1) brightness(1.2)'
      })
  }

  function unsetHorizontalHighlight () {
    const rows = chart.selectAll('.freq-vertical-optioncol-section')
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

    chart.selectAll('.y path, .y line')
      .style('visibility', 'hidden')
  }

  function legendOptionMouseOver (hoveredOption) {
    const rows = d3.selectAll('.freq-vertical__legend .legend__row')
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
    const rows = d3.selectAll('.freq-vertical__legend .legend__row')
    rows.style('opacity', 1)
  }

  // Helper
  function conditionalApplyTransition (selection, transition, useTransition) {
    return useTransition ? selection.transition(transition) : selection
  }
})(window.dax = window.dax || {})
