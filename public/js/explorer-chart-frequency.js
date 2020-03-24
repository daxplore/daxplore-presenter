(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.frequency = namespace.chart.frequency || {}
  const exports = namespace.chart.frequency

  /** ** CHART TYPE AND INSTANCE VARIABLES ** **/

  // CONSTANTS
  var yAxisWidth = 35
  var xAxisHeight = 24
  var margin = { top: 20, right: 13, bottom: xAxisHeight, left: yAxisWidth + 10 }
  var missingDataColor = d3.hsl('#BBB') // TODO externalize to producer?
  var leftTimetickTransform, selectedTimetickTransform, rightTimetickTransform
  var timepointTransition = d3.transition()
    .duration(300)
    .ease(d3.easeLinear)
  var fadeTransition = d3.transition()
    .duration(100)
    .ease(d3.easeLinear)

  // SIZE VARIABLES
  var availableWidth = 600 // initial placeholder value
  var width = availableWidth
  var availableHeight = 300 // initial placeholder value
  var height = availableHeight

  // CHART RESOURCES
  // Use the same objects when updating the chart
  // Objects, data and values that are independant of the chart data
  // If no question has more than 1 timepoint display all frequency charts in single timepoint mode.
  // If at least one question has more than 1 timepoint show all charts with timepoints.
  var singleTimepointMode
  // HEADER
  var headerDiv, headerMain, headerSub, headerTooltip
  // SCALES AND AXISES
  var xScale, xAxis, xAxisElement
  var yScale, yAxisScale, yAxis //, yAxisElement
  var zScaleColor
  // CHART
  var chartContainer, chartBB, chart, chartG
  // STATE TRACKING
  // LEGEND
  var legendDiv, legendQuestionHeader, legendQuestionOptionTable, legendMissingData

  // CURRENT FREQUENCY CHART
  var question, perspective, data
  var timepoints = []
  var selectedPerspectiveOptionIndices, selectedPerspectiveOptions, optionKeys
  var selectedTimepoint, highlightedQuestionOption, highlightedPerspectiveOption
  var hasMissingData
  var tpWidths, tpWidthsAdditive

  /** ** EXPORTED FUNCTIONS ** **/

  // Constructor, used to initialize the chart type.
  // Run once when the page is loaded. Call populateChart in order to update the chart content.
  exports.initializeResources = function (primaryColors) {
    // CALCULATE RELEVANT DATA
    singleTimepointMode = dax.data.isAllSingleTimepoint()

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
      .text(dax.text('explorer.freq.legend.missing_data'))

    // empty flex element, used to dynamically align the legend content vertically
    legendDiv.append('div')
      .style('flex', '3')

    // INITIALIZE SVG TRANSFORMATIONS
    // Generate matrix transformations for svg elements, to make them work in IE11
    // See: https://stackoverflow.com/a/28726517
    var styleHelperDiv = chartContainer.append('div')

    styleHelperDiv.style('transform', 'translate(-14px, 19px) rotate(-45deg)')
    leftTimetickTransform = getComputedStyle(styleHelperDiv.node()).getPropertyValue('transform')

    styleHelperDiv.style('transform', 'translate(-8px, 0px) rotate(45deg)')
    rightTimetickTransform = getComputedStyle(styleHelperDiv.node()).getPropertyValue('transform')

    styleHelperDiv.style('transform', 'translate(-13px, 4px) rotate(0deg)')
    selectedTimetickTransform = getComputedStyle(styleHelperDiv.node()).getPropertyValue('transform')

    styleHelperDiv.remove()
  }

  // Set new data to be displayed by the chart.
  // As a side effect, make this chart visible.
  exports.populateChart = function (questionID, perspectiveID, selectedPerspectiveOptionIndicesInput) {
    displayChartElements(true)
    perspective = perspectiveID
    question = questionID
    selectedPerspectiveOptionIndices = selectedPerspectiveOptionIndicesInput
    var removedTimepoints = timepoints.filter(function (tp) { return !dax.data.hasTimepoint(question, tp) })
    timepoints = dax.data.getTimepoints(question)
    selectedTimepoint = timepoints[Math.floor((2 / 3) * timepoints.length)]

    hasMissingData = false

    optionKeys = dax.data.getOptionTexts(question)
    optionKeys.push('MISSING_DATA')

    selectedPerspectiveOptions = []
    selectedPerspectiveOptionIndices.forEach(function (i) {
      selectedPerspectiveOptions.push(dax.data.getQuestionOptionText(perspective, i))
    })

    // Generate data map for all timepoints
    data = {}
    for (var tpIndex = 0; tpIndex < timepoints.length; tpIndex++) {
      var tp = timepoints[tpIndex]
      var perspectiveOptions = dax.data.getOptionTexts(perspective)
      var tpData = []

      selectedPerspectiveOptionIndices.forEach(function (i) {
        const stat = dax.data.getFrequency(questionID, perspectiveID, i, tp)
        var total = stat.length > 0 ? stat.reduce(function (a, b) { return a + b }) : 0
        var stackData = {
          __option: perspectiveOptions[i],
          __total: total,
          __timepoint: timepoints[tpIndex],
        }
        if (total === 0) {
          hasMissingData = true
          stackData.MISSING_DATA = 1
        } else {
          for (var j = 0; j < optionKeys.length; j++) {
            stackData[optionKeys[j]] = total !== 0 ? stat[j] / total : 0
          }
        }
        tpData.push(stackData)
      })
      data[tp] = tpData
    }

    // initialize TP width values
    calculateTPWidths()

    // UPDATE HEADER
    var shortText = dax.data.getQuestionShortText(question)
    var longText = dax.data.getQuestionFullText(question)
    headerMain.text(shortText)
    headerSub
      .text(longText)
      .style('display', longText === '' || shortText === longText ? 'none' : null)

    // UPDATE X
    xScale.domain(selectedPerspectiveOptions)
    xAxisElement.call(xAxis)

    // UPDATE Z
    zScaleColor.domain(optionKeys)

    // ADD/REMOVE/UPDATE BARS FOR EACH TIMEPOINT
    // Remove elements from removed timepoints
    removedTimepoints.forEach(function (tp) {
      chartG.selectAll('.freq-optionrow-tp' + tp).remove()
      chartG.selectAll('.freq-bar-timetick-wrapper-' + tp).remove()
    })

    // Add and update elements for current timepoints
    for (tpIndex = timepoints.length - 1; tpIndex >= 0; tpIndex--) {
      tp = timepoints[tpIndex]
      tpData = data[tp]

      var questionOptionRows = chartG
       .selectAll('.freq-optionrow-tp' + tp)
       .data(
         d3.stack().keys(optionKeys)(tpData), // data
         function (option) { return option.key + ';' + option.index } // key function, mapping a specific DOM element to a specific option index
       )

      questionOptionRows.enter().append('g')
        .classed('freq-optionrow-tp' + tp, true)
        .attr('transform', function (d, i) {
          return 'translate(0,' + 1.5 + ')'
        })

      // remove old bars
      questionOptionRows.exit().remove()

      var sections = chartG.selectAll('.freq-optionrow-tp' + tp).selectAll('.freq-optionrow-section-tp' + tp)
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
        .attr('fill', function (d) { return barFillColor(d.key, tpIndex) })
        .attr('stroke', function (d) { return barStrokeColor(d.key, tpIndex) })
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
          if (!singleTimepointMode) {
            var timepointText = dax.text('timepoint' + d.timepoint) // TODO change key from timepointX to new textID format
          }
          var perspectiveOptionText = d.option
          if (d.key === 'MISSING_DATA') {
            if (singleTimepointMode) {
              var html = dax.text('explorer.freq.tooltip.timepoints_missing_data', 10, perspectiveOptionText) // TODO externalize cutoff
            } else {
              html = dax.text('explorer.freq.tooltip.timepoints_missing_data', 10, perspectiveOptionText, timepointText) // TODO externalize cutoff
            }
          } else {
            var percentageText = dax.common.percentageFormat(d.end - d.start)
            var questionOptionText = d.key
            var color = barStrokeColor(d.key, tpIndex).darker(0.7)
            if (singleTimepointMode) {
              html = dax.text('explorer.freq.tooltip.single', percentageText, perspectiveOptionText, questionOptionText, color)
            } else {
              html = dax.text('explorer.freq.tooltip.timepoints', percentageText, perspectiveOptionText, questionOptionText, color, timepointText)
            }
          }
          // Set new header tooltip
          headerTooltip.html(html)
        })
        .on('mouseout', function (d) {
          // Deselect any legend options
          legendOptionMouseOut()
        })

      // remove old sections
      sections.exit().remove()

      if (!singleTimepointMode) {
        // add/remove/update bar timepoint tick texts
        var timeticks = chartG.selectAll('.freq-bar-timetick-wrapper-' + tp)
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
    var optionRows = legendQuestionOptionTable.selectAll('.legend__row')
      .data([].concat(dax.data.getOptionTexts(question)).reverse())

    // Remove old rows
    optionRows.exit().remove()

    // Add new rows
    var optionEnter = optionRows.enter()
      .append('div')
        .attr('class', 'legend__row')
        .on('mouseover', function (option) { legendOptionMouseOver(option) })
        .on('mouseout', legendOptionMouseOut)
    optionEnter.append('div')
      .attr('class', 'legend__color-square')
    optionEnter.append('div')
      .attr('class', 'legend__row-text')

    // Reselect rows and use single-select to propagate data join to contained items
    // update color and text for each row
    var rows = legendQuestionOptionTable.selectAll('.legend__row')
    rows.select('.legend__color-square')
      .style('background-color', zScaleColor)
    rows.select('.legend__row-text')
      .text(function (option) { return option })
      .style('font-style', function (option) { return option.nodata ? 'italic' : null })
      .attr('title', function (option) { return option })

    // Missing data option, show or hide
    legendMissingData.style('display', hasMissingData ? null : 'none')

    // UPDATE TIMEPOINT SPECIFIC POSITIONS
    // Set timepoint to current timepoint to update timepoint related positions
    setSelectedTimepoint(selectedTimepoint, true)

    // UPDATE STYLES
    updateStyles()
  }

  // Set the size available for the chart.
  // Updates the chart so it fits in the new size.
  // As a side effect, enable horizontal scrolling if needed for the chart to fit the given room.
  exports.setSize = function (availableWidthInput, availableHeightInput) {
    availableWidth = availableWidthInput
    availableHeight = availableHeightInput
    resizeAndPositionElements()
  }

  // Hide all frequency chart elements
  // Called whenever the entire chart should be hidden, so that another chart type can be dislpayed
  exports.hide = function () {
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
    // Estimate width needed to display chart without internal overlap
    var yAxisWidth = 31 // could be calculated?
    var outsideMargin = 24 // could be calculated?
    var innerMarginBars = 25 // could be calculated?
    var innerMarginTexts = 15
    var selectedTimepointCount = timepoints.length
    var minWidthPerTimepoint = 32
    var selectedPerspectiveOptionCount = selectedPerspectiveOptions.length

    var longestPerspectiveOptionTextLength = 0
    xAxisElement.selectAll('text')
      .each(function () {
        if (this.getBBox().width > longestPerspectiveOptionTextLength) {
          longestPerspectiveOptionTextLength = this.getBBox().width
        }
      })

    var minWidthBasedOnBars = yAxisWidth + outsideMargin * 2 + innerMarginBars * (selectedPerspectiveOptionCount - 1) +
                            (selectedTimepointCount * minWidthPerTimepoint) * selectedPerspectiveOptionCount
    var minWidthBasedOnTickTexts = yAxisWidth + outsideMargin * 2 + innerMarginTexts * (selectedPerspectiveOptionCount - 1) +
                            longestPerspectiveOptionTextLength * selectedPerspectiveOptionCount
    var chartNeededWidth = Math.max(minWidthBasedOnBars, minWidthBasedOnTickTexts)

    // Check if vertical scroll is needed
    var scrollNeeded = availableWidth < chartNeededWidth

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
    var wrapperClientBB = d3.select('.chart').node().getBoundingClientRect()
    chartBB = {
      height: wrapperClientBB.height,
      left: wrapperClientBB.left + pageXOffset,
      top: wrapperClientBB.top + pageYOffset,
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
    for (var tpIndex = timepoints.length - 1; tpIndex >= 0; tpIndex--) {
      var tp = timepoints[tpIndex]
      var sections = d3.selectAll('.freq-optionrow-section-tp' + tp)
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
      .style('margin-top', (chartBB.top + 0) + 'px')
      .style('height', chartBB.height + 'px')

    // UPDATE TIMEPOINT SPECIFIC POSITIONS
    // Set timepoint to current timepoint to update timepoint related positions
    setSelectedTimepoint(selectedTimepoint, true)
  }

  function setSelectedTimepoint (selectedTimepointInput, instantAnimation) {
    instantAnimation = typeof instantAnimation === 'undefined' ? false : instantAnimation
    selectedTimepoint = selectedTimepointInput
    calculateTPWidths(selectedTimepoint)

    // Iterate over all timepoints, with special treatment for the selected timepoint
    for (var tpIndex = 0; tpIndex < timepoints.length; tpIndex++) {
      var tp = timepoints[tpIndex]
      // Animate the bar rows for the current timepoint
      var rows = d3.selectAll('.freq-optionrow-section-tp' + tp)
      // Stop all current bar row animations
      rows.interrupt().selectAll('*').interrupt()
      // Update row colors
      rows
        .attr('fill', function (d) {
          var darken = 0
          if (highlightedQuestionOption === d.key &&
              selectedTimepoint === tp &&
              highlightedPerspectiveOption === d.option) {
            darken = 0.3
          }
          return barFillColor(d.key, tpIndex).darker(darken)
        })
        .attr('stroke', function (d) { return barStrokeColor(d.key, tpIndex) })
      // Select rows with or without transition
      rows = instantAnimation ? rows : rows.transition(timepointTransition)
      rows.attr('width', tpWidthsAdditive[tpIndex] * xScale.bandwidth())

      // Timepoint tick wrappers
      var wrappers = d3.selectAll('.freq-bar-timetick-wrapper-' + tp)
      // Stop all wrapper animations
      wrappers.interrupt().selectAll('*').interrupt()
      // Select timepoint wrappers with or without transition
      wrappers = instantAnimation ? wrappers : wrappers.transition(timepointTransition)
      // Update timepoint wrapper positions
      wrappers
        .attr('transform', function (d) {
          var xPos = xScale(d) + (tpWidthsAdditive[tpIndex] - tpWidths[tpIndex] / 2) * xScale.bandwidth()
          var yPos = height + 15
          return 'translate(' + xPos + ',' + yPos + ')'
        })

      // Timepoint ticks
      var ticks = d3.selectAll('.freq-bar-timetick-' + tp)
      // Stop all tick animations
      ticks.interrupt().selectAll('*').interrupt()
      // Select timepoint ticks with or without transition
      ticks = instantAnimation ? ticks : ticks.transition(timepointTransition)
      // Update timepoint tick positions, rotations and color
      ticks
        .attr('transform', function () {
          if (tp < selectedTimepoint) {
            return leftTimetickTransform
          } else if (tp > selectedTimepoint) {
            return rightTimetickTransform
          }
          return selectedTimetickTransform
        })
        .style('fill', tp === selectedTimepoint ? 'black' : '#555')
    }
  }

  function barFillColor (key, tpIndex) {
    if (singleTimepointMode) {
      return d3.hsl(zScaleColor(key))
    }
    var asymptoticLightnessTarget = 0.8
    var lightnessDropoffRate = 1.3
    var selectedTPIndex = timepoints.indexOf(selectedTimepoint)
    if (key === 'MISSING_DATA') {
      var color = missingDataColor
    } else {
      color = d3.hsl(zScaleColor(key)).darker(0.3)
    }
    var lightness = color.l
    var targetDiff = asymptoticLightnessTarget - lightness
    color.l = lightness + targetDiff - (targetDiff) / Math.pow(lightnessDropoffRate, Math.abs(selectedTPIndex - tpIndex))

    var asymptoticSaturationTarget = 0.25
    var saturationDropoffRate = 1.5
    var saturation = color.s
    targetDiff = saturation - asymptoticSaturationTarget
    color.s = saturation - targetDiff + (targetDiff) / Math.pow(saturationDropoffRate, Math.abs(selectedTPIndex - tpIndex))

    return color
  }

  function barStrokeColor (key, tpIndex) {
    return barFillColor(key, tpIndex).darker(0.8)
  }

  function calculateTPWidths () {
    tpWidths = []
    var selectedTPIndex = timepoints.indexOf(selectedTimepoint)
    // if (selectedTPIndex === -1) {
    //   console.log('Invalid selected tp.', 'question:', question, '/ perspective:', perspective, '/ selectedTimepoint:', selectedTimepoint)
    // }
    var unselectedSize = 0.4
    for (var tpIndex = 0; tpIndex < timepoints.length; tpIndex++) {
      tpWidths.push(selectedTPIndex - tpIndex === 0 ? 1 : unselectedSize)
    }
    // Adjust the widths so they sum up to 1
    var totalWidth = tpWidths.reduce(function (a, b) { return a + b })
    tpWidthsAdditive = []
    var widthSum = 0
    for (tpIndex = 0; tpIndex < timepoints.length; tpIndex++) {
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
      .style('font', '12px sans-serif')
      .style('cursor', 'default')
  }

  function legendOptionMouseOver (hoveredOption) {
    var rows = d3.selectAll('.freqs__legend .legend__row')
    // Stop all current legend row animations
    rows.interrupt().selectAll('*').interrupt()
    // Fade non-selected options
    rows
      .style('opacity', function (option) { return option === hoveredOption ? 1 : 0.4 })
  }

  function legendOptionMouseOut () {
    var rows = d3.selectAll('.freqs__legend .legend__row')
    // Stop all current legend row animations
    rows.interrupt().selectAll('*').interrupt()
    // Set all legend rows to visible again
    rows.transition(fadeTransition)
      .style('opacity', 1)
  }
})(window.dax = window.dax || {})
