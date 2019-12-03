(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.dichtimeline = namespace.chart.dichtimeline || {}
  const exports = namespace.chart.dichtimeline

  // CONSTANTS
  // TODO move to setting in producer
  // if chart width is smaller than this, embed it it a scrollpanel
  var chartWidthScrollBreakpoint = 600

  // CHART VARIABLES
  var yAxisWidth, xAxisHeight, margin, width, height
  var chart, chartG

  // INITIALIZE STATIC RESOURCES
  // TODO actually initialize
  var dichselectedMap
  var optionsMap
  var timepointsMap
  var percentageFormat = d3.format('.0%')

  var pointSymbol = d3.symbol().type(d3.symbolCircle)
  var pointSize = 40
  var pointFocusSize = 550

  var fadeTransition = d3.transition()
      .duration(300)
      .ease(d3.easeLinear)

  // INSTANCE SPECIFIC VARIABLES

  var lineColors // TODO unused: , hoverColors
  var question, perspective
  var currentOptions
  var zScaleColor

  // FUNCTIONS

  function fadeOthers (focusedIndex) {
    unfadeAll()
    for (var i = 0; i < currentOptions.length; i++) {
      var optionIndex = currentOptions[i].index

      var row = d3.select('.legend-row-' + optionIndex)
      row.interrupt().selectAll('*').interrupt()

      var lineMain = d3.selectAll('.line.dataset-' + optionIndex)
      lineMain.interrupt().selectAll('*').interrupt()

      var pointMain = d3.selectAll('.dich-point.dataset-' + optionIndex)
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
    for (var i = 0; i < currentOptions.length; i++) {
      var optionIndex = currentOptions[i].index
      var row = d3.select('.legend-row-' + optionIndex)
      row.interrupt().selectAll('*').interrupt()
      row
        .transition(fadeTransition)
        .style('opacity', 1)
    }
    var lineMain = d3.selectAll('.line')
    lineMain.interrupt().selectAll('*').interrupt()
    lineMain
        .transition(fadeTransition)
        .attr('opacity', 1)

    var pointMain = d3.selectAll('.dich-point')
    pointMain.interrupt().selectAll('*').interrupt()
    pointMain
        .transition(fadeTransition)
        .attr('opacity', 1)
  }

  function tooltipOver (focusedIndex) {
    tooltipOut()
    var tooltips = d3.selectAll('.point-tooltip-' + focusedIndex)
    tooltips.interrupt().selectAll('*').interrupt()
    tooltips.style('display', 'block')
    //     tooltips.transition(fadeTransition)
    //       .style("opacity", 1);

    //     var symbol = d3.symbol().type(d3.symbolCircle);
    //     var points = d3.selectAll(".dich-point.dataset-" + focusedIndex);
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

    var lineCover = d3.selectAll('.line-cover.dataset-' + focusedIndex)
    lineCover
      .attr('opacity', '1')

    var pointMain = d3.selectAll('.dich-point-cover.dataset-' + focusedIndex)
    pointMain
      .attr('opacity', '1')
  }

  function tooltipOut () {
    var tooltips = d3.selectAll('.point-tooltip')
    tooltips.interrupt().selectAll('*').interrupt()
    tooltips.style('display', 'none')
    //     tooltips.transition(fadeTransition)
    //       .style("opacity", 0);

    //     var symbol = d3.symbol().type(d3.symbolCircle);
    //     var points = d3.selectAll(".dich-point");
    // //     points.interrupt().selectAll('*').interrupt();
    //     points.attr("d", symbol.size(pointSize));
    //
    // //     var symbol = d3.symbol().size(40).type(d3.symbolCircle);
    // //     var points = d3.selectAll(".dich-point");
    // //     points.interrupt().selectAll('*').interrupt();
    // //     points.transition(fadeTransition)
    // //       .attr("d", symbol.size(pointSize));

    var lineCover = d3.selectAll('.line-cover')
    lineCover
      .attr('opacity', '0')

    var pointMain = d3.selectAll('.dich-point-cover')
    pointMain
      .attr('opacity', '0')
  }

  function computeDimensions (widthTotal, heightTotal) {
    yAxisWidth = 35
    xAxisHeight = 24
    margin = { top: 25, right: 13, bottom: xAxisHeight, left: yAxisWidth + 10 }
    width = widthTotal - margin.left - margin.right
    height = heightTotal - margin.top - margin.bottom
  }

  function generateChartElements () {
    // CHART
    chart = d3.select('.chart').append('svg')
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
    chartG.append('g')
      .attr('class', 'axis dichtime-y-axis')

    // X AXIS
    chartG.append('g')
      .attr('class', 'axis dichtime-x-axis')
  }

  function updateStyles () {
    d3.selectAll('.axis .domain')
      .style('visibility', 'hidden')

    d3.selectAll('.axis path, .axis line')
      .style('fill', 'none')
      .style('stroke', '#bbb')
      .style('shape-rendering', 'geometricPrecision')

    d3.selectAll('text')
      .style('fill', '#555')
      .style('font', '12px sans-serif')
      .style('cursor', 'default')
  }

  function updateChartElements () {
    // X SCALE
    var xScale = d3.scaleBand()
      .range([0, width])
      .paddingInner(0.3)
      .paddingOuter(0)
      .domain(timepointsMap[perspective])

    var xBandwidth = xScale.bandwidth()

    // Y SCALE
    // TODO use a dynamic scale or min/max points set in producer
    var yScale = d3.scaleLinear()
      .range([height, 0])
      .domain([0, 1])

    // Z SCALE
    // mapping selected options to colors
    zScaleColor = d3.scaleOrdinal(lineColors)
      .domain(optionsMap[perspective])

    // TODO unused z scale hover color?
    // var zScaleHoverColor = d3.scaleOrdinal(hoverColors)
    //   .domain(optionsMap[perspective])

    // TODO unused z scale symbol?
    // var zScaleSymbol = d3
    //   .scaleOrdinal([d3.symbolCircle, d3.symbolDiamond, d3.symbolSquare, d3.symbolTriangle, d3.symbolStar, d3.symbolCross, d3.symbolWye])
    //   .domain(optionsMap[perspective])

    // LINE TEMPLATE
    var line = d3.line()
      .curve(d3.curveLinear)
      .x(function (d) { return xScale(d.timepoint) + xScale.bandwidth() / 2 })
      .y(function (d) {
        return yScale(d.percentage)
      })

    // UPDATE X AXIS
    var xAxis = d3.axisBottom(xScale)
      .tickFormat(function (d) {
        return dax.text('timepoint' + d) // TODO use new text format
      })

    var xAxisElement = d3.select('.dichtime-x-axis')

    //     xAxisElement.interrupt().selectAll('*').interrupt();

    xAxisElement
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)

    // UPDATE Y AXIS
    var yAxis = d3.axisLeft(yScale)
      .tickFormat(d3.format('.0%'))
      .tickSize(0)
      .tickSizeInner(width)

    var yAxisElement = d3.select('.dichtime-y-axis')

    yAxisElement.interrupt().selectAll('*').interrupt()

    yAxisElement
      .attr('transform', 'translate(' + width + ',0)')
      .call(yAxis)

    // UPDATE LINES
    //     var option = chartG.selectAll(".option")
    //       .data(options)
    //       .enter().append("g")
    //         .attr("class", "option");
    //
    //     option.append("path")
    //       .attr("class", "line")
    //       .attr("d", function(d) {
    //         return line(d.values);
    //       })
    //       .style("stroke", function(d) { return zScaleColor(d.id); });

    //     currentOptions.forEach(function(option) {
    //       var color = zScaleColor(option.id);
    //       var hover_color = zScaleHoverColor(option.id);
    //

    // Connect the points with lines
    //       chartG.append("path")
    //         .datum(option.values)
    //         .attr("class", "line dataset-" + option.index)
    //         .attr("fill", "none")
    //         .attr("stroke", color)
    //         .attr("stroke-width", "3")
    //         .attr("d", line)
    //         .on("mouseover",
    //           function(d) {
    //             tooltipOver(option.index);
    //             fadeOthers(option.index)
    //         })
    //         .on("mouseout",
    //           function(d) {
    //             tooltipOut();
    //             unfadeAll();
    //         });

    // Connect the points with lines
    currentOptions.forEach(function (option) {
      var color = zScaleColor(option.id)
      d3.select('.line.dataset-' + option.index).remove()
      chartG.append('path')
        .datum(option.values)
        .attr('class', 'line dataset-' + option.index)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', '3')
        .attr('d', line)
        .on('mouseover',
          function (d) {
            tooltipOver(option.index)
            fadeOthers(option.index)
          })
        .on('mouseout',
          function (d) {
            tooltipOut()
            unfadeAll()
          })
    })

    // Individual points
    currentOptions.forEach(function (option) {
      var color = zScaleColor(option.id)
      chartG.selectAll('.dich-point.dataset-' + option.index)
        .data(option.values)
      .enter().append('path')
        .attr('class', 'dich-point dataset-' + option.index)
        .attr('fill', color)
        .attr('stroke', color)
        .attr('d', pointSymbol.size(pointSize))
        .on('mouseover',
          function (d) {
            tooltipOver(option.index)
            fadeOthers(option.index)
          })
        .on('mouseout',
          function (d) {
            tooltipOut()
            unfadeAll()
          })

      chartG.selectAll('.dich-point.dataset-' + option.index)
        .attr('transform', function (d) {
          return 'translate(' + (xScale(d.timepoint) + xBandwidth / 2) + ',' + yScale(d.percentage) + ')'
        })
    })

    // Mouse over elements added later in order to cover underlying elements when highlighted
    currentOptions.forEach(function (option) {
      var color = zScaleColor(option.id)

      // Connect the points with lines
      d3.selectAll('.line-cover.dataset-' + option.index).remove()
      chartG.append('path')
        .datum(option.values)
        .attr('class', 'line-cover dataset-' + option.index)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', '3')
        .attr('opacity', '0')
        .attr('pointer-events', 'none')
        .attr('d', line)
    })

    currentOptions.forEach(function (option) {
      var color = zScaleColor(option.id)
      // Individual points
      d3.selectAll('.dich-point-cover.dataset-' + option.index).remove()
      chartG.selectAll('.dich-point-cover.dataset-' + option.index)
        .data(option.values)
      .enter().append('path')
        .attr('class', 'dich-point-cover dataset-' + option.index)
        .attr('fill', color)
        .attr('stroke', color)
        .attr('d', pointSymbol.size(pointFocusSize))
        .attr('opacity', '0')
        .attr('pointer-events', 'none')

      chartG.selectAll('.dich-point-cover.dataset-' + option.index)
        .attr('transform', function (d) {
          return 'translate(' + (xScale(d.timepoint) + xBandwidth / 2) + ',' + yScale(d.percentage) + ')'
        })
    })

    currentOptions.forEach(function (option) {
      // Add tooltip divs
      //       var dichWrapper = d3.select(".dich-line-chart").node().getBoundingClientRect();
      //         var xAxisStart = d3.select(".dichtime-x-axis").node().getBoundingClientRect().x;
      d3.selectAll('.point-tooltip-' + option.index).remove()
      chartG.selectAll('.point-tooltip-' + option.index)
        .data(option.values)
        .enter().append('text')
          .attr('class', 'point-tooltip point-tooltip-' + option.index)
          .text(function (d) { return percentageFormat(d.percentage) })
          .style('font-size', '10px')
          .on('mouseover',
            function (d) {
              tooltipOver(option.index)
              fadeOthers(option.index)
            })
          .on('mouseout',
            function (d) {
              tooltipOut()
              unfadeAll()
            })

      chartG.selectAll('.point-tooltip-' + option.index)
          .attr('transform', function (d) {
            return 'translate(' +
            (xScale(d.timepoint) + xBandwidth / 2 - this.getComputedTextLength() / 2) + ',' +
            (yScale(d.percentage) + 3.5) + ')'
          })
          .style('display', 'none')
    })
  }

  exports.generateChart = function (selectedOptions, stat, dichselectedMapInput, optionsMapInput, timepointsMapInput, lineColorsInput, hoverColorsInput) {
    dichselectedMap = dichselectedMapInput
    optionsMap = optionsMapInput
    timepointsMap = timepointsMapInput

    // TODO initialize once, not every time
    lineColors = lineColorsInput
    // TODO unused: hoverColors = hoverColorsInput
    computeDimensions(chartWidthScrollBreakpoint, 300)
    generateChartElements()

    perspective = stat.p
    question = stat.q

    // TODO check actually delivered time points in statJson data?
    // TODO generate timepoint texts in daxplore export file to experiment with that as an array here
    var options = []
    selectedOptions.forEach(function (option, i) {
      var values = []
      timepointsMap[perspective].forEach(function (timepoint) {
        if (typeof stat.freq[timepoint] !== 'undefined') {
          var freq = stat.freq[timepoint][option]
          var selected = dichselectedMap[question]
          var selectedCount = 0
          var totalCount = 0
          for (var i = 0; i < freq.length; i++) {
            if (freq[i] > 0) {
              totalCount += freq[i]
              for (var j = 0; j < selected.length; j++) {
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
          }
        }
      })
      options.push({
        index: option,
        id: optionsMap[perspective][option],
        values: values,
      })
    })

    currentOptions = options

    updateChartElements()
    updateStyles()
  }

  exports.generateLegend = function () {
    // GENERATE LEGEND
    var legend = d3.select('.legend')
      .style('margin-top', (d3.select('.header-section').node().offsetHeight + height / 2.5) + 'px')
      .style('margin-left', '4px')

    legend.html('')

    // Add legend options
    legend.selectAll('.legend-row')
      .data(currentOptions)
      .enter()
        .append('div')
        .attr('class', function (d) { return 'legend-row legend-row-' + d.index })
        .html(function (option) {
          return "<span class='legend-marker' style='background-color: " +
                  zScaleColor(option.id) + ";'>&nbsp;</span>" +
                  "<span class='legend-text'>" + option.id + '</span>'
        })
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

    updateStyles()
  }

  // TODO pretty hacky quick fixed solution
  exports.updateSize = function (heightTotal) {
    // 2. width for chart to use is max of:
    // a. room remaining of window width after QP, SA, margins, (scroll bar?)
    // b. max of
    // b.1 room required by header block
    // b.2 room required by bottom block
    // 3. calculate min width needed to draw chart
    // 4. if allocated space in 2. < need in 3.
    // then: set scroll area width to 2., chart to 3., wrap and scroll
    // else: set chart to 2, no scroll

    var availableWidth = document.documentElement.clientWidth - // window width
              d3.select('.question-panel').node().offsetWidth - // tree sidebar
              5 - // tree margin (if changed here, needs to be changed in css)
              d3.select('.sidebar-column').node().offsetWidth - // right sidebar
              2 - // border of 1px + 1px (if changed here, needs to be changed in css)
              1 // 1px fudge
    // TODO - scrollbar width?

    var headerBlockWidth = d3.select('.header-section').node().offsetWidth
    var bottomBlockWidth = d3.select('.perspective-panel').node().offsetWidth
    var description = d3.select('.description-panel').node()
    if (description != null && description.offsetWidth > 0) {
      bottomBlockWidth += 250 // TODO hard coded
    }
    var topBotNeededWidth = Math.max(headerBlockWidth, bottomBlockWidth)

    var widthForChart = Math.max(availableWidth, topBotNeededWidth)

    var chartNeededWidth = 600 // TODO hard coded, shouldn't be

    var lockWidth = widthForChart < chartNeededWidth
    var chartWidth
    if (lockWidth) {
      chartWidth = chartNeededWidth
    } else {
      chartWidth = widthForChart
    }
    d3.select('.chart')
      .classed('chart-scroll', lockWidth)
      .style('width', function () { return lockWidth ? widthForChart + 'px' : null })

    computeDimensions(chartWidth, heightTotal)

    chart
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    updateChartElements()
  }
})(window.dax = window.dax || {})
