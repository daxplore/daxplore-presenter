(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.frequency = namespace.chart.frequency || {}
  const exports = namespace.chart.frequency

  /** CHART TYPE AND INSTANCE VARIABLES **/

  // CONSTANTS
  const yAxisWidth = 35
  const xAxisHeight = 24
  const margin = { top: 10, right: 13, bottom: xAxisHeight, left: yAxisWidth + 10 }
  const missingDataColor = d3.hsl(0, 0, 0.77) // TODO externalize to producer?
  let leftTimetickTransform, selectedTimetickTransform, rightTimetickTransform
  const saveImageCanvasWidth = 600

  const fullMultipointAnimations = false // TODO MUST BE EXTERNALIZED

  // SIZE VARIABLES
  let availableWidth = 600 // initial placeholder value
  let width = availableWidth
  let availableHeight = 300 // initial placeholder value
  let height = availableHeight

  // CHART RESOURCES
  // Use the same objects when updating the chart
  // Objects, data and values that are independant of the chart data
  // If no question has more than 1 timepoint display all frequency charts in single timepoint mode.
  // If at least one question has more than 1 timepoint show all charts with timepoints.
  let singleTimepointMode
  // TRANSITIONS
  let timepointTransition
  // HEADER
  let headerDiv, headerMain, headerSub, headerTooltip
  // SCALES AND AXISES
  let xScale, xAxis, xAxisElement
  let yScale, yAxisScale, yAxis //, yAxisElement
  let zScaleColor
  // CHART
  let chartContainer, chartBB, chart, chartG
  // LEGEND
  let legendDiv, legendQuestionHeader, legendQuestionOptionTable, legendMissingData, legendMissingTimepoint
  // BUTTONS
  let saveImageButton
  // PATTERNS
  let defs
  const patternURLs = new Set()

  // CURRENT FREQUENCY CHART
  let question, perspective, data
  let timepoints = []
  let selectedPerspectiveOptionIndices, selectedPerspectiveOptions, optionKeys
  let selectedTimepoint, highlightedQuestionOption, highlightedPerspectiveOption
  let hasMissingData, hasMissingTimepoint
  let tpWidths, tpWidthsAdditive

  /** EXPORTED FUNCTIONS **/

  // Constructor, used to initialize the chart type.
  // Run once when the page is loaded. Call populateChart in order to update the chart content.
  exports.initializeResources =
  function (primaryColors) {
    // CALCULATE RELEVANT DATA
    singleTimepointMode = dax.data.isAllSingleTimepoint()

    // TRANSITIONS
    timepointTransition = d3.transition()
      .duration(singleTimepointMode ? 0 : 300)
      .ease(d3.easeLinear)

    if (!singleTimepointMode) {
      margin.bottom += 40
    }

    // INITIALIZE HEADER
    headerDiv = d3.select('.header-section').append('div')
      .attr('class', 'header-section__freqs')
    headerMain = headerDiv.append('div')
      .attr('class', 'header-section__main')
    headerSub = headerDiv.append('div')
      .attr('class', 'header-section__sub')
    headerTooltip = headerDiv.append('div')
      .attr('class', 'header-section__freq-tooltip')
      .text('\xa0')

    // INITIALIZE CHART
    // base div element
    chartContainer = d3.select('.chart').append('div')
      .attr('class', 'explorer-freq')

    // base svg element
    chart = chartContainer.append('svg')
      .attr('class', 'explorer-freq')

    // patterns
    defs = chart.append('defs')

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
      .rangeRound([0, width])
      .paddingInner(0.1)
      .paddingOuter(0.07)

    xAxis = d3
      .axisBottom(xScale)
      .tickSize(singleTimepointMode ? 5 : 41)

    xAxisElement = chartG.append('g')
      .attr('class', 'axis frequency-x-axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)

    // y axis
    yScale = d3.scaleLinear()
      .rangeRound([height - 2, 0])
      .domain([0, 1])

    yAxisScale = d3.scaleLinear()
      .rangeRound([height, 0])
      .domain([0, 1])

    yAxis = d3.axisLeft(yAxisScale)
      .tickFormat(d3.format('.0%'))
      .tickSize(0)
      .tickSizeInner(width)

    chartG.append('g')
      .attr('class', 'axis frequency-y-axis')
      .attr('transform', 'translate(' + width + ',0)')
      .call(yAxis)

    // z axis, color coding
    zScaleColor = d3.scaleOrdinal().range(primaryColors)

    // INITIALIZE LEGEND
    // top level freqs legend container
    legendDiv = d3.select('.legend').append('div')
      .attr('class', 'freq__legend')

    // empty flex element, used to dynamically align the legend content vertically
    legendDiv.append('div')
      .style('flex', '2.5')

    // legend for the question and selected options
    legendQuestionHeader = legendDiv.append('h4')
      .attr('class', 'legend__header')
    legendQuestionOptionTable = legendDiv.append('div')

    const legendMissingWrapper = legendDiv.append('div')
      .style('margin-top', '15px')
    legendMissingData = legendMissingWrapper.append('div')
      .attr('class', 'legend__row')
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
    legendMissingTimepoint = legendMissingWrapper.append('div')
      .attr('class', 'legend__row')
    legendMissingTimepoint.append('div')
        .attr('class', 'legend__color-square')
        .style('background',
          'linear-gradient(-45deg, {A} 30%, {B} 30%, {B} 50%, {A} 50%, {A} 80%, {B} 80%, {B} 100%)'
              .replaceAll('{A}', missingDataColor)
              .replaceAll('{B}', missingDataColor.darker(0.6))
        )
        .style('background-size', '7.07px 7.07px')
    legendMissingTimepoint.append('div')
        .attr('class', 'legend__row-text')
        .text(dax.text('explorer.chart.frequency_bar.legend.missing_timepoint'))
        .attr('title', dax.text('explorer.chart.frequency_bar.legend.missing_timepoint'))
        .on('mouseover', function () {
          setHorizontalHighlight('MISSING_TIMEPOINT')
          legendOptionMouseOver('MISSING_TIMEPOINT')
        })
        .on('mouseout', function () {
          legendOptionMouseOut()
          unsetHorizontalHighlight()
        })

    // empty flex element, used to dynamically align the legend content vertically
    legendDiv.append('div')
      .style('flex', '3')

    // INITIALIZE SVG TRANSFORMATIONS
    // Generate matrix transformations for svg elements, to make them work in IE11
    // See: https://stackoverflow.com/a/28726517
    const styleHelperDiv = chartContainer.append('div')

    styleHelperDiv.style('transform',
      fullMultipointAnimations
        ? 'translate(-14px, 19px) rotate(-45deg)'
        : 'translate(-8px, 19px) rotate(-45deg)'
    )
    leftTimetickTransform = getComputedStyle(styleHelperDiv.node()).getPropertyValue('transform')

    styleHelperDiv.style('transform',
      fullMultipointAnimations
        ? 'translate(-13px, 4px) rotate(0deg)'
        : 'translate(-8px, 16px) rotate(-45deg)'
    )
    selectedTimetickTransform = getComputedStyle(styleHelperDiv.node()).getPropertyValue('transform')

    styleHelperDiv.style('transform',
      fullMultipointAnimations
        ? 'translate(-8px, 0px) rotate(45deg)'
        : 'translate(-8px, 19px) rotate(-45deg)'
    )
    rightTimetickTransform = getComputedStyle(styleHelperDiv.node()).getPropertyValue('transform')

    styleHelperDiv.remove()

    // SAVE IMAGE BUTTON
    // TODO create general save button manager
    saveImageButton = d3.select('.save-button-wrapper').append('div')
      .classed('dashed-button', true)
      .classed('freq__save-image', true)
      .on('click', generateImage)
      .text(dax.text('common.button.save_chart_as_image'))
  }

  // Set new data to be displayed by the chart.
  // As a side effect, make this chart visible.
  exports.populateChart =
  function (questionID, perspectiveID, selectedPerspectiveOptionIndicesInput) {
    displayChartElements(true)
    perspective = perspectiveID
    question = questionID
    selectedPerspectiveOptionIndices = selectedPerspectiveOptionIndicesInput
    const questionTimepoints = dax.data.getTimepoints(question)
    let removedTimepoints = []
    if (dax.settings('explorer.chart.frequency.show_empty_timepoints')) {
      const newTimepoints = dax.settings('all_timepoints')
      removedTimepoints = timepoints.filter(function (tp) {
        return newTimepoints.indexOf(tp) === -1
      })
      timepoints = newTimepoints
    } else {
      removedTimepoints = timepoints.filter(function (tp) { return !dax.data.hasTimepoint(question, tp) })
      timepoints = questionTimepoints
    }

    // Reset mouseover effects when loading new chart
    selectedTimepoint = null
    headerTooltip.text('\xa0')

    hasMissingData = false
    hasMissingTimepoint = false

    optionKeys = dax.data.getOptionTexts(question)
    optionKeys.push('MISSING_DATA')
    optionKeys.push('MISSING_TIMEPOINT')

    selectedPerspectiveOptions = []
    selectedPerspectiveOptionIndices.forEach(function (i) {
      selectedPerspectiveOptions.push(dax.data.getQuestionOptionText(perspective, i))
    })

    // Generate data map for all timepoints
    data = {}
    for (let tpIndex = 0; tpIndex < timepoints.length; tpIndex++) {
      const tp = timepoints[tpIndex]
      const perspectiveOptions = dax.data.getOptionTexts(perspective)
      const tpData = []

      selectedPerspectiveOptionIndices.forEach(function (i) {
        let stat
        const stackData = {
          __option: perspectiveOptions[i],
          __total: 0,
          __timepoint: timepoints[tpIndex],
        }
        if (questionTimepoints.indexOf(tp) !== -1) {
          // If question has data for timepoint
          stat = dax.data.getFrequency(questionID, perspectiveID, i, tp)
          const total = stat.length > 0 ? stat.reduce(function (a, b) { return a + b }) : 0
          stackData.__total = total
          if (total === 0) {
            // If data is empty, due to export cutoff
            hasMissingData = true
            stackData.MISSING_DATA = 1
          } else {
            // Extract frequency data
            for (let j = 0; j < optionKeys.length; j++) {
              stackData[optionKeys[j]] = total !== 0 ? stat[j] / total : 0
            }
          }
        } else {
          // If timepoint is missing for this question
          hasMissingTimepoint = true
          stackData.MISSING_TIMEPOINT = 1
        }

        tpData.push(stackData)
      })
      data[tp] = tpData
    }

    // initialize TP width values
    calculateTPWidths()

    // UPDATE HEADER
    const shortText = dax.data.getQuestionShortText(question)
    const longText = dax.data.getQuestionFullText(question)
    headerMain.text(shortText)
    headerSub
      .text(longText)
      .style('display', longText === '' || shortText === longText ? 'none' : null)

    // UPDATE X
    xScale.domain(selectedPerspectiveOptions)
    xAxisElement.call(xAxis)
    xAxisElement.selectAll('.tick line')
      .style('display', 'none')

    // UPDATE Z
    zScaleColor.domain(optionKeys)

    // ADD/REMOVE/UPDATE BARS FOR EACH TIMEPOINT
    // Remove elements from removed timepoints
    removedTimepoints.forEach(function (tp) {
      chartG.selectAll('.freq-optionrow-tp' + tp).remove()
      chartG.selectAll('.freq-bar-timetick-wrapper-' + tp).remove()
    })

    // Add and update elements for current timepoints
    for (let tpIndex = timepoints.length - 1; tpIndex >= 0; tpIndex--) {
      const tp = timepoints[tpIndex]
      const tpData = data[tp]

      // removing everything instead of updating is a hack
      // TODO: figure out how to make enter/exit code work with this chart structure
      chartG.selectAll('.freq-optionrow-tp' + tp).remove()
      chartG.selectAll('.freq-bar-timetick-wrapper-' + tp).remove()

      const rowData = d3.stack().keys(optionKeys)(tpData)
      const questionOptionRows = chartG.selectAll('.freq-optionrow-tp' + tp)
       .data(
         rowData, // data
         //  function (option) { return option.key + ';' + option.index } // key function, mapping a specific DOM element to a specific option index
       )

      // add new rows
      questionOptionRows.enter().append('g')
        .classed('freq-optionrow-tp' + tp, true)
        .attr('transform', 'translate(0, 1.5)')

      // remove old bars
      // questionOptionRows.exit().remove()

      const sections = chartG.selectAll('.freq-optionrow-tp' + tp).selectAll('.freq-optionrow-section-tp' + tp)
        .data(
          function (d) {
            return d.map(function (v) {
              return {
                start: v[0],
                end: (isNaN(v[1]) ? v[0] : v[1]),
                key: d.key,
                option: v.data.__option,
                timepoint: tp,
              }
            })
          }, // data
          function (option) { return option.option + ';tp-' + option.timepoint } // key function, mapping a specific DOM element to a specific option index
        )

      sections.enter().append('rect')
        .classed('freq-optionrow-section-tp' + tp, true)
        .attr('x', function (d) { return xScale(d.option) })
        .attr('y', function (d) { return yScale(d.end) })
        .attr('height', function (d) { return yScale(d.start) - yScale(d.end) })
        .attr('width', tpWidthsAdditive[tpIndex] * xScale.bandwidth())
        .attr('stroke-width', 1)
        .on('mouseover', function (d) {
          // Set selected options
          highlightedQuestionOption = d.key
          highlightedPerspectiveOption = d.option
          // Update legend highlight
          legendOptionMouseOver(highlightedQuestionOption)
          // Set selected timepoint and trigger visual updates
          setSelectedTimepoint(d.timepoint)
          // Create html for contextual header tooltip
          let timepointText
          if (!singleTimepointMode) {
            timepointText = dax.text('timepoint' + d.timepoint) // TODO change key from timepointX to new textID format
          }
          const perspectiveOptionText = d.option
          let html
          if (d.key === 'MISSING_DATA') {
            const cutoff = dax.settings('export.statistics.group_cutoff')
            if (singleTimepointMode) {
              html = dax.text('explorer.chart.frequency_bar.tooltip.multiple_timepoints_missing', cutoff, perspectiveOptionText)
            } else {
              html = dax.text('explorer.chart.frequency_bar.tooltip.multiple_timepoints_missing', cutoff, perspectiveOptionText, timepointText)
            }
          } else if (d.key === 'MISSING_TIMEPOINT') {
            html = dax.text('explorer.chart.frequency_bar.tooltip.timepoint_missing', dax.text('timepoint' + d.timepoint))
          } else {
            const percentageText = dax.common.percentageFormat(d.end - d.start)
            const questionOptionText = d.key
            const color = barStrokeColor(d.key, tpIndex).darker(0.7)
            if (singleTimepointMode) {
              html = dax.text('explorer.chart.frequency_bar.tooltip.single_timepoint', percentageText, perspectiveOptionText, questionOptionText, color)
            } else {
              html = dax.text('explorer.chart.frequency_bar.tooltip.multiple_timepoints', percentageText, perspectiveOptionText, questionOptionText, color, timepointText)
            }
          }
          // Set new header tooltip
          headerTooltip.html(html)
        })
        .on('mouseout', function (d) {
          // Deselect any legend options
          legendOptionMouseOut()
          setSelectedTimepoint(null)
          headerTooltip.text('\xa0')
        })

      // remove old sections
      sections.exit().remove()

      if (!singleTimepointMode) {
        // add/remove/update bar timepoint tick texts
        const timeticks = chartG.selectAll('.frequency-bar-timetick-wrapper-' + tp)
          .data(selectedPerspectiveOptions)

        timeticks.exit().remove()

        timeticks
          .enter().append('g')
            .classed('freq-bar-timetick-wrapper-' + tp, true)
            .append('text')
              .classed('freq-bar-timetick-' + tp, true)
              .text(dax.text('timepoint' + tp)) // TODO change key from timepointX to new textID format
      }
    }

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
    legendMissingTimepoint.style('display', hasMissingTimepoint ? null : 'none')

    // UPDATE TIMEPOINT SPECIFIC POSITIONS
    // Set timepoint to current timepoint to update timepoint related positions
    setSelectedTimepoint(selectedTimepoint, true)

    // UPDATE STYLES
    updateStyles()
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
    const yAxisWidth = 31 // could be calculated?
    const outsideMargin = 24 // could be calculated?
    const innerMarginBars = 25 // could be calculated?
    const innerMarginTexts = 15
    const selectedTimepointCount = timepoints.length
    const minWidthPerTimepoint = 32
    const selectedPerspectiveOptionCount = selectedPerspectiveOptions.length

    let longestPerspectiveOptionTextLength = 0
    xAxisElement.selectAll('text')
      .each(function () {
        if (this.getBBox().width > longestPerspectiveOptionTextLength) {
          longestPerspectiveOptionTextLength = this.getBBox().width
        }
      })

    const minWidthBasedOnBars = yAxisWidth + outsideMargin * 2 + innerMarginBars * (selectedPerspectiveOptionCount - 1) +
                            (selectedTimepointCount * minWidthPerTimepoint) * selectedPerspectiveOptionCount
    const minWidthBasedOnTickTexts = yAxisWidth + outsideMargin * 2 + innerMarginTexts * (selectedPerspectiveOptionCount - 1) +
                            longestPerspectiveOptionTextLength * selectedPerspectiveOptionCount
    const chartNeededWidth = Math.max(minWidthBasedOnBars, minWidthBasedOnTickTexts)

    // Check if vertical scroll is needed
    const scrollNeeded = availableWidth < chartNeededWidth

    // Enable or disable scroll on the div containing the frequency cchart
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
      left: wrapperClientBB.left + scrollX,
      top: wrapperClientBB.top + scrollY,
      width: wrapperClientBB.width,
    }

    // UPDATE X-AXIS
    // Update the space available for the x axis
    xScale.rangeRound([0, width])
    // Move and update the x axis with the new range
    xAxisElement
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)

    // UPDATE Y AXIS
    yScale.rangeRound([height - 2, 0])
    yAxisScale.rangeRound([height, 0])
    yAxis.tickSizeInner(width)
    d3.select('.frequency-y-axis')
      .attr('transform', 'translate(' + width + ',0)')
      .call(yAxis)

    // UPDATE BARS FOR EACH TIMEPOINT
    // Update TP width values
    calculateTPWidths()
    // Update size and position for each bar element
    for (let tpIndex = timepoints.length - 1; tpIndex >= 0; tpIndex--) {
      const tp = timepoints[tpIndex]
      const sections = d3.selectAll('.freq-optionrow-section-tp' + tp)
      sections
        .attr('x', function (d) { return xScale(d.option) })
        .attr('y', function (d) { return yScale(d.end) })
        .attr('height', function (d) { return yScale(d.start) - yScale(d.end) })
        .attr('width', tpWidthsAdditive[tpIndex] * xScale.bandwidth())
    }

    // LEGEND
    // Set the vertical position and height of the legend area
    // The position of the legend div is then adjusted via flex parameters relative the defined area
    legendDiv
      .style('height', chartBB.height + 'px')

    // UPDATE TIMEPOINT SPECIFIC POSITIONS
    // Set timepoint to current timepoint to update timepoint related positions
    setSelectedTimepoint(selectedTimepoint, true)
  }

  function getPatternUrl (backgroundColor, stripeColor) {
    const key = 'pattern-stripes-' + backgroundColor.hex().replace('#', '') + '-' + stripeColor.hex().replace('#', '')
    // generate pattern
    if (!patternURLs.has(key)) {
      // generate stripes: https://svg-stripe-generator.web.app/
      const pattern = defs.append('pattern')
        .attr('id', key)
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', '7.5')
        .attr('height', '7.5')
        .attr('patternTransform', 'rotate(45)')
      // background
      pattern.append('rect')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('fill', backgroundColor)
      // stripe lines
      pattern.append('line')
        .attr('x1', '0')
        .attr('y1', '0')
        .attr('x2', '0')
        .attr('y2', '7.5')
        .attr('stroke', stripeColor)
        .attr('stroke-width', 5)
    }
    patternURLs.add(key)
    return 'url(#' + key + ')'
  }

  function setSelectedTimepoint (selectedTimepointInput, instantAnimation) {
    instantAnimation = typeof instantAnimation === 'undefined' ? false : instantAnimation
    selectedTimepoint = selectedTimepointInput
    calculateTPWidths()

    // Iterate over all timepoints, with special treatment for the selected timepoint
    for (let tpIndex = 0; tpIndex < timepoints.length; tpIndex++) {
      const tp = timepoints[tpIndex]
      // Animate the bar rows for the current timepoint
      let rows = d3.selectAll('.freq-optionrow-section-tp' + tp)
      // Stop all current bar row animations
      rows.interrupt().selectAll('*').interrupt()
      // Update row colors
      rows
        .attr('fill', function (d) {
          let darken = 0
          if (highlightedQuestionOption === d.key &&
              selectedTimepoint === tp &&
              highlightedPerspectiveOption === d.option) {
            darken = 0.3
          }
          const barColor = barFillColor(d.key, tpIndex).darker(darken)
          if (d.key === 'MISSING_TIMEPOINT') {
            return getPatternUrl(barColor, barColor.darker(0.3))
          }
          return barColor
        })
        .attr('stroke', function (d) { return barStrokeColor(d.key, tpIndex) })
      // Select rows with or without transition
      rows = instantAnimation ? rows : rows.transition(timepointTransition)
      rows.attr('width', tpWidthsAdditive[tpIndex] * xScale.bandwidth())

      // Timepoint tick wrappers
      let wrappers = d3.selectAll('.freq-bar-timetick-wrapper-' + tp)
      // Stop all wrapper animations
      wrappers.interrupt().selectAll('*').interrupt()
      // Select timepoint wrappers with or without transition
      wrappers = instantAnimation ? wrappers : wrappers.transition(timepointTransition)
      // Update timepoint wrapper positions
      wrappers
        .attr('transform', function (d) {
          const xPos = xScale(d) + (tpWidthsAdditive[tpIndex] - tpWidths[tpIndex] / 2) * xScale.bandwidth()
          const yPos = height + 15
          return 'translate(' + xPos + ',' + yPos + ')'
        })

      // Timepoint ticks
      let ticks = d3.selectAll('.freq-bar-timetick-' + tp)
      // Stop all tick animations
      ticks.interrupt().selectAll('*').interrupt()
      // Select timepoint ticks with or without transition
      ticks = instantAnimation ? ticks : ticks.transition(timepointTransition)
      // Update timepoint tick positions, rotations and color
      ticks
        .attr('transform', function () {
          if (selectedTimepoint === null) {
            return leftTimetickTransform
          } else if (tp < selectedTimepoint) {
            return leftTimetickTransform
          } else if (tp > selectedTimepoint) {
            return rightTimetickTransform
          } else {
            return selectedTimetickTransform
          }
        })
        .style('fill', selectedTimepoint === tp || selectedTimepoint === null ? 'black' : '#555')
    }
  }

  function setHorizontalHighlight (option) {
    for (let tpIndex = 0; tpIndex < timepoints.length; tpIndex++) {
      const tp = timepoints[tpIndex]
      const rows = d3.selectAll('.freq-optionrow-section-tp' + tp)
      rows
        .style('filter', function (d) {
          if (option === 'MISSING_DATA' || option === 'MISSING_TIMEPOINT') {
            return d.key === option ? 'brightness(0.93)' : null
          }
          return d.key === option ? null : 'grayscale(1) brightness(1.2)'
        })
    }
  }

  function unsetHorizontalHighlight () {
    for (let tpIndex = 0; tpIndex < timepoints.length; tpIndex++) {
      const tp = timepoints[tpIndex]
      const rows = d3.selectAll('.freq-optionrow-section-tp' + tp)
      rows.style('filter', null)
    }
  }

  function barFillColor (key, tpIndex) {
    if (singleTimepointMode || selectedTimepoint === null || tpIndex === null) {
      return key === 'MISSING_DATA' || key === 'MISSING_TIMEPOINT' ? missingDataColor : d3.hsl(zScaleColor(key))
    }

    const selectedTPIndex = timepoints.indexOf(selectedTimepoint)
    const indexDistance = Math.abs(selectedTPIndex - tpIndex)

    if (key === 'MISSING_DATA' || key === 'MISSING_TIMEPOINT') {
      const color = d3.hsl(0, 0, 0.63)
      const asymptoticLightnessTarget = 0.85
      const lightnessDropoffRate = 1.3

      const lightness = color.l
      const targetDiff = asymptoticLightnessTarget - lightness
      color.l = lightness + targetDiff - targetDiff / Math.pow(lightnessDropoffRate, indexDistance)
      return color
    } else {
      const asymptoticLightnessTarget = 0.8
      const lightnessDropoffRate = 1.3
      const color = d3.hsl(zScaleColor(key)).darker(0.3)

      const lightness = color.l
      let targetDiff = asymptoticLightnessTarget - lightness
      color.l = lightness + targetDiff - targetDiff / Math.pow(lightnessDropoffRate, indexDistance)

      const asymptoticSaturationTarget = 0.25
      const saturationDropoffRate = 1.5
      const saturation = color.s
      targetDiff = saturation - asymptoticSaturationTarget
      color.s = saturation - targetDiff + targetDiff / Math.pow(saturationDropoffRate, indexDistance)

      return color
    }
  }

  function barStrokeColor (key, tpIndex) {
    return barFillColor(key, tpIndex).darker(0.8)
  }

  // Recaulculate timepoint widths and populate tpWidths as a side effect
  function calculateTPWidths () {
    tpWidths = []
    const selectedTPIndex = timepoints.indexOf(selectedTimepoint)
    if (fullMultipointAnimations) {
      const unselectedSize = 0.4
      for (let tpIndex = 0; tpIndex < timepoints.length; tpIndex++) {
        tpWidths.push(selectedTPIndex - tpIndex === 0 ? 1 : unselectedSize)
      }
    } else {
      for (let tpIndex = 0; tpIndex < timepoints.length; tpIndex++) {
        tpWidths.push(1)
      }
    }
    // Adjust the widths so they sum up to 1
    const totalWidth = tpWidths.reduce(function (a, b) { return a + b })
    tpWidthsAdditive = []
    let widthSum = 0
    for (let tpIndex = 0; tpIndex < timepoints.length; tpIndex++) {
      tpWidths[tpIndex] /= totalWidth
      widthSum += tpWidths[tpIndex]
      tpWidthsAdditive[tpIndex] = widthSum
    }
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

    xAxisElement.selectAll('.tick text')
      .style('fill', 'black')
  }

  function legendOptionMouseOver (hoveredOption) {
    const rows = d3.selectAll('.freq__legend .legend__row')
    // Stop all current legend row animations
    rows.interrupt().selectAll('*').interrupt()
    // Fade non-selected options
    rows
      .style('opacity', function (option) { return hoveredOption === option ? 1 : 0.4 })

    legendMissingData
      .style('opacity', function (option) {
        return (hoveredOption === 'MISSING_DATA') ? 1 : 0.4
      })
    legendMissingTimepoint
      .style('opacity', function (option) {
        return (hoveredOption === 'MISSING_TIMEPOINT') ? 1 : 0.4
      })
  }

  function legendOptionMouseOut () {
    // Set all legend rows to visible again
    const rows = d3.selectAll('.freq__legend .legend__row')
    rows.style('opacity', 1)
  }

  // SAVE CHART AS IMAGE
  const imageScaling = 2 // TODO externalize
  function generateImage () {
    // The structure of these nested functions follow the same pattern
    // 1. Define image element
    // 2. Define the onload function
    // 3. Call other function to populate the image element with the actual image
    // 4. The onload function is called, doing the next image in sequence

    // Load header image
    const headerImg = new Image()
    headerImg.onload = function () {
      // Header image is loaded!
      // Load legend image:
      const legendImg = new Image()
      legendImg.onload = function () {
        // Legend image is loaded!
        // Load chart image
        const chartImg = new Image()
        chartImg.onload = function () {
          // Chart image is loaded!
          // Build and save the complete image
          composeAndSaveImage(headerImg, legendImg, chartImg)
        }
        generateChartImage(chartImg)
      }
      generateLegendImage(legendImg)
    }
    generateHeaderImage(headerImg)
  }

  // Takes an empty image element and loads an image of the header into it
  function generateHeaderImage (img) {
    // Add the temporary copy of the legend to the DOM
    const hiddenDiv = d3.select('body').append('div')
      .classed('hidden', true)
      .style('justify-content', 'center')
      .style('text-align', 'center')
      .style('white-space', 'nowrap')

    const headerClone = hiddenDiv
      .append(function () { return headerDiv.node().cloneNode(true) })
      .style('padding-left', '1000px')
      .style('padding-right', '1000px')
      .style('width', '1000px')

    headerClone.select('.header-section__freq-tooltip')
      .remove()

    const oldWidth = headerClone.node().offsetWidth
    const oldHeight = headerClone.node().offsetHeight
    const newWidth = oldWidth * imageScaling
    const newHeight = oldHeight * imageScaling

    // Adjust legend appearance
    const translateX = (newWidth - oldWidth) / 2
    const translateY = (newHeight - oldHeight) / 2
    headerClone
      .style('transform', 'translate(' + translateX + 'px,' + translateY + 'px) scale(' + imageScaling + ')')

    domtoimage.toPng(headerClone.node(), { bgcolor: 'white', width: newWidth, height: newHeight })
      .then(function (dataUrl) {
        img.src = dataUrl
      })['catch'](function (error) { // eslint-disable-line dot-notation
        if (error) { // TODO standard-js forces if(error) (see handle-callback-error)
          // TODO error handling: console.error('Failed to generate image', error)
          console.log(error)
        }
      })['finally'](function () { // eslint-disable-line dot-notation
        // Remove generated temporary elements
        hiddenDiv.remove()
      })
  }

  // Takes an empty image element and loads an image of the legend into it
  function generateLegendImage (img) {
    legendOptionMouseOut()

    // Add the temporary copy of the legend to the DOM
    const hiddenDiv = d3.select('body').append('div')
      .classed('hidden', true)

    const legendClone = hiddenDiv.append('div')
      .style('padding-top', (15 * imageScaling) + 'px')
      .style('padding-left', (5 * imageScaling) + 'px')

    // Reconstruct copy of legend from the DOM element, only keeping the relevant parts
    const questionHeaderCopy = legendQuestionHeader.node().cloneNode(true)
    d3.select(questionHeaderCopy).style('margin-top', '10px')
    legendClone.append(function () { return questionHeaderCopy })
    legendClone.append(function () { return legendQuestionOptionTable.node().cloneNode(true) })
    legendClone.selectAll('.legend__row-text')
      .style('max-width', 'inherit')
      .style('text-overflow', 'inherit')
      .style('padding-right', (15 * imageScaling) + 'px')

    const oldWidth = legendClone.node().offsetWidth
    const oldHeight = legendClone.node().offsetHeight
    const newWidth = oldWidth * imageScaling
    const newHeight = oldHeight * imageScaling

    // Adjust legend appearance
    const translateX = (newWidth - oldWidth) / 2
    const translateY = (newHeight - oldHeight) / 2
    legendClone
      .style('transform', 'translate(' + translateX + 'px,' + translateY + 'px) scale(' + imageScaling + ')')

    domtoimage.toPng(legendClone.node(), { bgcolor: 'white', width: newWidth, height: newHeight })
      .then(function (dataUrl) {
        img.src = dataUrl
      })['catch'](function (error) { // eslint-disable-line dot-notation
        if (error) { // TODO standard-js forces if(error) (see handle-callback-error)
          // TODO error handling: console.error('Failed to generate image', error)
          console.log(error)
        }
      })['finally'](function () { // eslint-disable-line dot-notation
        // Remove generated temporary elements
        hiddenDiv.remove()
      })
  }

  // Takes an empty image element and loads an image of the chart into it
  function generateChartImage (img) {
    const savedActiveTimepoint = selectedTimepoint
    setSelectedTimepoint(null, true)
    unsetHorizontalHighlight()

    const leftAdjust = 10
    const widthAdjust = 10
    const initialAvailablelWidth = availableWidth
    // Set width of actual chart before making a copy
    exports.setSize(saveImageCanvasWidth, availableHeight)
    // Make copy of chart element
    const chartCopy = d3.select(chart.node().cloneNode(true))

    // Apply local font version
    chartCopy
      .append('defs')
      .append('style')
      .text(dax.fonts.getVartaBase64Definition())

    chartCopy.selectAll('text')
      .style('font-family', '"VartaBase64", "Varta", sans-serif')

    // Restore size of actual chart
    exports.setSize(initialAvailablelWidth, availableHeight)

    chartCopy.select('g').attr('transform', 'translate(' + (margin.left + leftAdjust) + ',' + margin.top + ')')

    const widthBefore = chartCopy.attr('width')
    chartCopy.attr('width', imageScaling * (Number(widthBefore) + widthAdjust))
    const heightBefore = chartCopy.attr('height')
    chartCopy.attr('height', imageScaling * Number(heightBefore))
    chartCopy.style('transform', 'scale(' + imageScaling + ')' +
      'translate(' + ((Number(widthBefore) + widthAdjust) / 2) + 'px,' + (Number(heightBefore) / 2) + 'px)')

    const doctype = '<?xml version="1.0" standalone="no"?>' +
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'

    const source = (new XMLSerializer()).serializeToString(chartCopy.node())
    const blob = new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' })
    img.src = window.URL.createObjectURL(blob)
    setSelectedTimepoint(savedActiveTimepoint, true)
  }

  function composeAndSaveImage (headerImg, legendImg, chartImg) {
    const canvasChartSelection = d3.select('body').append('canvas')
      .classed('hidden', true)
      .attr('width', chartImg.width)
      .attr('height', chartImg.height)

    const imgMargin = { top: 20 * imageScaling, right: 5 * imageScaling, bottom: 20 * imageScaling, left: 0 * imageScaling }

    const completeWidth = imgMargin.left + chartImg.width + imgMargin.right + legendImg.width
    const completeHeight = imgMargin.top + headerImg.height + Math.max(chartImg.height, legendImg.height) + imgMargin.bottom
    const canvasCompleteSelection = d3.select('body').append('canvas')
      .attr('width', completeWidth + 'px')
      .attr('height', completeHeight + 'px')
      .style('visibility', 'hidden')

    const canvasComplete = canvasCompleteSelection.node()

    const ctx = canvasCompleteSelection.node().getContext('2d')

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, completeWidth, completeHeight)
    ctx.fillStyle = 'black'

    const lineSectionStart = margin.left + imgMargin.left + yAxisWidth * imageScaling
    const lineSectionEnd = chartImg.width - margin.right - imgMargin.right
    const lineSectionWidth = lineSectionEnd - lineSectionStart
    const headerHorizontalShift = lineSectionStart + lineSectionWidth / 2 - headerImg.width / 2

    // Draw header img to canvas
    ctx.drawImage(headerImg, headerHorizontalShift, imgMargin.top)

    // Draw chart img to canvas
    ctx.drawImage(chartImg, imgMargin.left, imgMargin.top + headerImg.height)

    // Draw legend img to canvas
    ctx.drawImage(legendImg, chartImg.width, imgMargin.top + headerImg.height)

    let watermarkText = dax.text('explorer.image.watermark')
    const date = new Date()
    watermarkText = watermarkText.replace(
      '{date}',
      date.getFullYear() + '-' +
      ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
      ('0' + date.getDate()).slice(-2))

    const fileName = dax.text('explorer.chart.frequency_bar.image.filename')
      .replaceAll('{question}', dax.data.getQuestionShortText(question))
      .replaceAll('{perspective}', dax.data.getQuestionShortText(perspective))
      .replaceAll('{date}',
        date.getFullYear() + '-' +
        ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
        ('0' + date.getDate()).slice(-2))

    const sourceFontHeight = 11 * imageScaling
    ctx.font = sourceFontHeight + 'px "Varta"'
    ctx.fillStyle = '#555'
    ctx.fillText(watermarkText, 5 * imageScaling, completeHeight - 5 * imageScaling)

    canvasComplete.toBlob(function (blob) {
      saveAs(blob, fileName + '.png')
    })

    canvasChartSelection.remove()
    canvasCompleteSelection.remove()
  }
})(window.dax = window.dax || {})
