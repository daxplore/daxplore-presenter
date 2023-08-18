(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.dichtimeline = namespace.chart.dichtimeline || {}
  const exports = namespace.chart.dichtimeline

  /** ** CHART TYPE AND INSTANCE VARIABLES ** **/

  // CONSTANTS
  const yAxisWidth = 35
  const xAxisHeight = 24
  const margin = { top: 25, right: 13, bottom: xAxisHeight, left: yAxisWidth + 10 }
  const pointSize = 40
  const pointFocusSize = 550
  // if chart width is smaller than this, embed it it a scrollpanel
  const chartWidthScrollBreakpoint = 600 // TODO shouldn't be hard coded, move to setting in producer
  const chartHeight = 300 // TODO shouldn't be hard coded, move to setting in producer

  // CHART SIZE VARIABLES
  let availableWidth = 600 // initial placeholder value
  let width = availableWidth
  let height = chartHeight

  // HEADER
  let headerDiv, headerMain, headerSub, headerDich
  // SCALES AND AXISES
  let xScale, xAxis, xAxisElement
  let yScale, yAxis, yAxisElement
  let zScaleColor
  // CHART
  let chart, chartContainer, chartG
  let mainLineGroup, mouseoverLineGroup
  // LEGEND
  let legendDiv, legendPerspectiveHeader, legendPerspectiveOptionTable

  // INITIALIZE STATIC RESOURCES
  const percentageFormat = d3.format('.0%')

  const pointSymbol = d3.symbol().type(d3.symbolCircle)

  const fadeTransition = d3.transition()
    .duration(300)
    .ease(d3.easeLinear)

  // LINE TEMPLATE
  const line = d3.line()
    .curve(d3.curveLinear)
    .x(function (d) { return xScale(d.timepoint) + xScale.bandwidth() / 2 })
    .y(function (d) { return yScale(d.percentage) })

  // INSTANCE SPECIFIC VARIABLES
  let questionID, perspectiveID
  let currentOptions

  /** ** EXPORTED FUNCTIONS ** **/

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

    // empty flex element, used to dynamically align the legend content vertically
    legendDiv.append('div')
      .style('flex', '3')

    // Calculate initial dimensions
    computeDimensions(chartWidthScrollBreakpoint, chartHeight)
  }

  exports.populateChart =
  function (questionIDInput, perspectiveIDInput, selectedPerspectiveOptions) {
    displayChartElements(true)

    // Arguments
    questionID = questionIDInput
    perspectiveID = perspectiveIDInput

    // TODO check actually delivered time points in statJson data?
    // TODO generate timepoint texts in daxplore export file to experiment with that as an array here
    // DATA
    const optionTexts = dax.data.getOptionTexts(perspectiveID)
    currentOptions = []
    const pointData = []
    selectedPerspectiveOptions.forEach(function (option, i) {
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
            values.push({
              timepoint: timepoint,
              percentage: (selectedCount / totalCount),
              count: totalCount,
            })
            pointData.push({
              index: option,
              timepoint: timepoint,
              percentage: (selectedCount / totalCount),
            })
          }
        }
      })
      currentOptions.push({
        index: option,
        id: optionTexts[option],
        values: values,
      })
    })

    // UPDATE HEADER
    const shortText = dax.data.getQuestionShortText(questionID)
    const longText = dax.data.getQuestionFullText(questionID)
    headerMain.text(shortText)
    headerSub
      .text(longText)
      .style('display', longText === '' || shortText === longText ? 'none' : null)
    headerDich.text(getDichotomizedSubtitleText())

    // X SCALE
    xScale
      .range([0, width])
      .domain(dax.data.getTimepoints(perspectiveID))

    const xBandwidth = xScale.bandwidth()

    // Y SCALE
    yScale
      .range([height, 0])
      .domain([0, 1])

    // Z SCALE (color)
    const allIndicesArray = dax.data.getPerspectiveOptionIndicesColumnOrder(perspectiveID)
    zScaleColor.domain(allIndicesArray)

    // UPDATE X AXIS
    xAxis
      .tickFormat(function (d) {
        return dax.text('timepoint' + d)
      })

    xAxisElement
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)

    // UPDATE Y AXIS
    yAxis.tickSizeInner(width)

    yAxisElement.interrupt().selectAll('*').interrupt()

    yAxisElement
      .attr('transform', 'translate(' + width + ',0)')
      .call(yAxis)

    // CHART LINES
    const lines = mainLineGroup.selectAll('.dichtimeline__line')
      .data(
        currentOptions, // data
        function (option) { return option.index } // key function
      )

    // Mouseover elements added to cover underlying elements when highlighted
    const mouseoverLines = mouseoverLineGroup.selectAll('.dichtimeline__line')
      .data(
        currentOptions, // data
        function (option) { return option.index } // key function
      )

    // remove old lines
    lines.exit().remove()
    mouseoverLines.exit().remove()

    // add new lines
    lines.enter().append('path')
      .classed('dichtimeline__line', true)
      .attr('fill', 'none')
      .attr('stroke', function (d) { return zScaleColor(d.index) })
      .attr('stroke-width', '3')
      .on('mouseover',
        function (d) {
          tooltipOver(d.index)
          fadeOthers(d.index)
        })
      .on('mouseout',
        function (d) {
          tooltipOut()
          unfadeAll()
        })

    mouseoverLines.enter().append('path')
      .attr('class', function (d) { return 'dichtimeline__line dich-line-cover dataset-' + d.index })
      .attr('fill', 'none')
      .attr('stroke', function (d) { return zScaleColor(d.index) })
      .attr('stroke-width', '3')
      .attr('opacity', '0')
      .attr('pointer-events', 'none')

    // update path data for all lines
    chartG.selectAll('.dichtimeline__line')
      .attr('d', function (d) { return line(d.values) })

    // CHART POINTS
    const points = mainLineGroup.selectAll('.dichtimeline__point')
      .data(
        pointData, // data
        function (option) { return option.index + '@' + option.timepoint } // key function
      )

    // Mouseover elements added to cover underlying elements when highlighted
    const mouseoverPoints = mouseoverLineGroup.selectAll('.dichtimeline__point')
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
      .classed('dichtimeline__point', true)
      .attr('fill', function (d) { return zScaleColor(d.index) })
      .attr('stroke', function (d) { return zScaleColor(d.index) })
      .attr('d', pointSymbol.size(pointSize))
      .on('mouseover',
        function (d) {
          tooltipOver(d.index)
          fadeOthers(d.index)
        })
      .on('mouseout',
        function (d) {
          tooltipOut()
          unfadeAll()
        })

    mouseoverPoints.enter().append('path')
      .attr('class', function (d) { return 'dichtimeline__point dich-point-cover dataset-' + d.index })
      .attr('fill', function (d) { return zScaleColor(d.index) })
      .attr('stroke', function (d) { return zScaleColor(d.index) })
      .attr('d', pointSymbol.size(pointFocusSize))
      .attr('opacity', '0')
      .on('mouseover',
        function (d) {
          tooltipOver(d.index)
          fadeOthers(d.index)
        })
      .on('mouseout',
        function (d) {
          tooltipOut()
          unfadeAll()
        })

    mouseoverPercentages.enter().append('text')
      .attr('class', function (d) { return 'dichtimeline__percentage dichtimeline__percentage-' + d.index })
      .text(function (d) { return percentageFormat(d.percentage) })
      .style('font-size', '10px')
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .on('mouseover',
        function (d) {
          tooltipOver(d.index)
          fadeOthers(d.index)
        })
      .on('mouseout',
        function (d) {
          tooltipOut()
          unfadeAll()
        })

    // position all points
    chartG.selectAll('.dichtimeline__point')
      .attr('transform', function (d) {
        return 'translate(' + (xScale(d.timepoint) + xBandwidth / 2) + ',' + yScale(d.percentage) + ')'
      })

    chartG.selectAll('.dichtimeline__percentage')
      .attr('transform', function (d) {
        return 'translate(' +
        (xScale(d.timepoint) + xBandwidth / 2) + ',' +
        (yScale(d.percentage) + 4) + ')'
      })
      .style('display', 'none')

    // UPDATE LEGEND
    // Update legend title
    legendPerspectiveHeader
      .text(dax.data.getQuestionShortText(perspectiveID))

    // Set new data for the legend
    const optionRows = legendPerspectiveOptionTable.selectAll('.legend__row')
      .data(
        currentOptions, // data
        function (option) { return option.index } // key function, mapping a specific DOM element to a specific option index
      )

    // Remove old rows
    optionRows.exit().remove()

    // Add new rows
    const optionEnter = optionRows.enter()
    .append('div')
      .classed('legend__row', true)
      .on('mouseover',
        function (d) {
          tooltipOver(d.index)
          fadeOthers(d.index)
        })
      .on('mouseout',
        function (d) {
          tooltipOut()
          unfadeAll()
        })
    optionEnter.append('div')
      .attr('class', 'legend__color-square')
    optionEnter.append('div')
      .attr('class', 'legend__row-text')

    // reselect rows and use single-select to propagate data join to contained items
    // update color and text for each row
    const rows = legendPerspectiveOptionTable.selectAll('.legend__row')
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

    rows.select('.legend__color-square')
      .style('background-color', colorPrimary)
    rows.select('.legend__row-text')
      .text(function (option) {
        let text = dax.data.getQuestionOptionText(perspectiveID, option.index)
        if (option.nodata) {
          text += ' ' + dax.text('explorer.chart.dichtimeline.legend.missing_data')
        }
        return text
      })
    .style('font-style', function (option) { return option.nodata ? 'italic' : null })

    updateStyles()
  }

  // Set the size available for the chart.
  // Updates the chart so it fits in the new size.
  exports.setSize =
  function (availableWidthInput) {
    availableWidth = availableWidthInput
    resizeAndPositionElements()
  }

  // Hide all dichtimeline chart elements
  // Called whenever the entire chart should be hidden, so that another chart type can be dislpayed
  exports.hide =
  function () {
    displayChartElements(false)
  }

  // TODO pretty hacky quick fixed solution
  exports.updateSize =
  function (heightTotal) {
    // 2. width for chart to use is max of:
    // a. room remaining of window width after QP, SA, margins, (scroll bar?)
    // b. max of
    // b.1 room required by header block
    // b.2 room required by bottom block
    // 3. calculate min width needed to draw chart
    // 4. if allocated space in 2. < need in 3.
    // then: set scroll area width to 2., chart to 3., wrap and scroll
    // else: set chart to 2, no scroll

    const availableWidth = document.documentElement.clientWidth - // window width
              d3.select('.question-panel').node().offsetWidth - // tree sidebar
              5 - // tree margin (if changed here, needs to be changed in css)
              d3.select('.sidebar-column').node().offsetWidth - // right sidebar
              2 - // border of 1px + 1px (if changed here, needs to be changed in css)
              1 // 1px fudge
    // TODO - scrollbar width?

    const headerBlockWidth = d3.select('.header-section').node().offsetWidth
    let bottomBlockWidth = d3.select('.perspective-panel').node().offsetWidth
    const description = d3.select('.description-panel').node()
    if (description != null && description.offsetWidth > 0) {
      bottomBlockWidth += 250 // TODO hard coded
    }
    const topBotNeededWidth = Math.max(headerBlockWidth, bottomBlockWidth)

    const widthForChart = Math.max(availableWidth, topBotNeededWidth)

    const chartNeededWidth = chartWidthScrollBreakpoint

    const lockWidth = widthForChart < chartNeededWidth
    let chartWidth = widthForChart
    if (lockWidth) {
      chartWidth = chartNeededWidth
    }
    d3.select('.chart')
      .classed('chart-scroll', lockWidth)
      .style('width', function () { return lockWidth ? widthForChart + 'px' : null })

    computeDimensions(chartWidth, heightTotal)

    chart
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
  }

  /** ** INTERNAL FUNCTIONS ** **/

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
    // LEGEND
    // Set the vertical position and height of the legend area
    // The position of the legend div is then adjusted via flex parameters relative the defined area
    legendDiv
      .style('margin-top', chartBB.top + 'px')
      .style('height', chartBB.height + 'px')
  }

  function fadeOthers (focusedIndex) {
    unfadeAll()
    for (let i = 0; i < currentOptions.length; i++) {
      const optionIndex = currentOptions[i].index

      const row = d3.select('.legend__row-' + optionIndex)
      row.interrupt().selectAll('*').interrupt()

      const lineMain = chartG.selectAll('.line.dataset-' + optionIndex)
      lineMain.interrupt().selectAll('*').interrupt()

      const pointMain = chartG.selectAll('.dich-point.dataset-' + optionIndex)
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
  }

  function unfadeAll () {
    for (let i = 0; i < currentOptions.length; i++) {
      const optionIndex = currentOptions[i].index
      const row = d3.select('.legend__row-' + optionIndex)
      row.interrupt().selectAll('*').interrupt()
      row
        .transition(fadeTransition)
        .style('opacity', 1)
    }
    const lineMain = chartG.selectAll('.line')
    lineMain.interrupt().selectAll('*').interrupt()
    lineMain
        .transition(fadeTransition)
        .attr('opacity', 1)

    const pointMain = chartG.selectAll('.dich-point')
    pointMain.interrupt().selectAll('*').interrupt()
    pointMain
        .transition(fadeTransition)
        .attr('opacity', 1)
  }

  function tooltipOver (focusedIndex) {
    tooltipOut()
    const tooltips = chartG.selectAll('.dichtimeline__percentage-' + focusedIndex)
    tooltips.interrupt().selectAll('*').interrupt()
    tooltips.style('display', 'block')
    //     tooltips.transition(fadeTransition)
    //       .style("opacity", 1);

    // let symbol = d3.symbol().type(d3.symbolCircle);
    // let points = d3.selectAll(".dich-point.dataset-" + focusedIndex);
    // //     points.interrupt().selectAll('*').interrupt();
    // //     points.attr("d", symbol.size(64));
    // //     console.log(points);
    //     points
    // //       .transition().duration(100)
    //       .attr("d", symbol.size(500));
    // //     path.attr("d", symbol.size(64));
    //
    // //     points.transition().duration(1000).attr("d", symbol.size(550));
    // //     points.transition(fadeTransition)
    // //       .attr("d", symbol.size(400));

    const lineCover = chartG.selectAll('.dich-line-cover.dataset-' + focusedIndex)
    lineCover
      .attr('opacity', '1')

    const pointMain = chartG.selectAll('.dich-point-cover.dataset-' + focusedIndex)
    pointMain
      .attr('opacity', '1')
  }

  function tooltipOut () {
    const tooltips = chartG.selectAll('.dichtimeline__percentage')
    tooltips.interrupt().selectAll('*').interrupt()
    tooltips.style('display', 'none')
    //     tooltips.transition(fadeTransition)
    //       .style("opacity", 0);

    // let symbol = d3.symbol().type(d3.symbolCircle);
    // let points = d3.selectAll(".dich-point");
    // //     points.interrupt().selectAll('*').interrupt();
    //     points.attr("d", symbol.size(pointSize));
    //
    // //let symbol = d3.symbol().size(40).type(d3.symbolCircle);
    // //let points = d3.selectAll(".dich-point");
    // //     points.interrupt().selectAll('*').interrupt();
    // //     points.transition(fadeTransition)
    // //       .attr("d", symbol.size(pointSize));

    const lineCover = chartG.selectAll('.dich-line-cover')
    lineCover
      .attr('opacity', '0')

    const pointMain = chartG.selectAll('.dich-point-cover')
    pointMain
      .attr('opacity', '0')
  }

  function computeDimensions (widthTotal, heightTotal) {
    width = widthTotal - margin.left - margin.right
    height = heightTotal - margin.top - margin.bottom
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
})(window.dax = window.dax || {})
