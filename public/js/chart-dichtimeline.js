(function (exports) {
  // CONSTANTS
  // TODO move to setting in producer
  // if chart width is smaller than this, embed it it a scrollpanel
  var chartWidthScrollBreakpoint = 600

  // CHART VARIABLES
  var yAxisWidth, xAxisHeight, margin, width, height
  var chart, chartG

  // INITIALIZE STATIC RESOURCES
  var dichselectedMap = {}
  var optionsMap = {}
  var timepointsMap = {}
  var percentageFormat = d3.format('.0%')

  // for (var i=0; i < questions.length; i ++) {
  //   var q = questions[i];
  //   dichselectedMap[q.column] = q.dichselected;
  //   optionsMap[q.column] = q.options;
  //   timepointsMap[q.column] = q.timepoints;
  // }

  var pointSymbol = d3.symbol().type(d3.symbolCircle)
  var pointSize = 40
  var pointFocusSize = 550

  var fadeTransition = d3.transition()
      .duration(300)
      .ease(d3.easeLinear)

  // INSTANCE SPECIFIC VARIABLES

  var lineColors, hoverColors
  var question, perspective
  var currentOptions
  var zScaleColor

  // FUNCTIONS

  function fadeOthers (focusedIndex) {
    unfadeAll()
    for (var i = 0; i < currentOptions.length; i++) {
      var option_index = currentOptions[i].index

      var row = d3.select('.dich-legend-row-' + option_index)
      row.interrupt().selectAll('*').interrupt()

      var lineMain = d3.selectAll('.line.dataset-' + option_index)
      lineMain.interrupt().selectAll('*').interrupt()

      var pointMain = d3.selectAll('.dich-point.dataset-' + option_index)
      pointMain.interrupt().selectAll('*').interrupt()

      if (option_index != focusedIndex) {
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
      var option_index = currentOptions[i].index
      var row = d3.select('.dich-legend-row-' + option_index)
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

  function computeDimensions (width_total, height_total) {
    yAxisWidth = 35
    xAxisHeight = 24
    margin = { top: 25, right: 13, bottom: xAxisHeight, left: yAxisWidth + 10 }
    width = width_total - margin.left - margin.right
    height = height_total - margin.top - margin.bottom
  }

  function generateChartElements () {
    // CHART
    chart = d3.select('.chart-panel').append('svg')
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
    yAxisElement = chartG.append('g')
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
    var x_scale = d3.scaleBand()
      .range([0, width])
      .paddingInner(0.3)
      .paddingOuter(0)
      .domain(timepointsMap[perspective])

    var x_bandwidth = x_scale.bandwidth()

    // Y SCALE
    // TODO use a dynamic scale or min/max points set in producer
    var y_scale = d3.scaleLinear()
      .range([height, 0])
      .domain([0, 1])

    // Z SCALE
    // mapping selected options to colors
    zScaleColor = d3.scaleOrdinal(lineColors)
      .domain(optionsMap[perspective])

    z_scale_hover_color = d3.scaleOrdinal(hoverColors)
      .domain(optionsMap[perspective])

    var z_scale_symbol = d3
      .scaleOrdinal([d3.symbolCircle, d3.symbolDiamond, d3.symbolSquare, d3.symbolTriangle, d3.symbolStar, d3.symbolCross, d3.symbolWye])
      .domain(optionsMap[perspective])

    // LINE TEMPLATE
    var line = d3.line()
      .curve(d3.curveLinear)
      .x(function (d) { return x_scale(d.timepoint) + x_scale.bandwidth() / 2 })
      .y(function (d) {
        return y_scale(d.percentage)
      })

    // UPDATE X AXIS
    var xAxis = d3.axisBottom(x_scale)
      .tickFormat(function (d) {
        return usertexts['timepoint' + d]
      })

    var xAxisElement = d3.select('.dichtime-x-axis')

    //     xAxisElement.interrupt().selectAll('*').interrupt();

    xAxisElement
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)

    // UPDATE Y AXIS
    var yAxis = d3.axisLeft(y_scale)
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
    //       var hover_color = z_scale_hover_color(option.id);
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
          return 'translate(' + (x_scale(d.timepoint) + x_bandwidth / 2) + ',' + y_scale(d.percentage) + ')'
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
          return 'translate(' + (x_scale(d.timepoint) + x_bandwidth / 2) + ',' + y_scale(d.percentage) + ')'
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
            (x_scale(d.timepoint) + x_bandwidth / 2 - this.getComputedTextLength() / 2) + ',' +
            (y_scale(d.percentage) + 3.5) + ')'
          })
          .style('display', 'none')
    })
  }

  exports.generateDichTimeLineChart = function (selectedOptions, stat, lineColors_input, hoverColors_input) {
    // TODO initizalize once, not every time
    lineColors = lineColors_input
    hoverColors = hoverColors_input
    computeDimensions(chartWidthScrollBreakpoint, 300)
    generateChartElements()

    perspective = stat.p
    question = stat.q

    // TODO check actually delivered time points in statJson data?
    // TODO generate timepoint texts in daxplore export file to experiment with that as an array here
    var options = []
    selectedOptions.forEach(function (option, i) {
      var values = []
      timepointsMap[perspective].forEach(function (t) {
        var timepoint = t
        if (typeof stat.freq[t] !== 'undefined') {
          var freq = stat.freq[t][option]
          var selected = dichselectedMap[question]
          var selected_count = 0
          var total_count = 0
          for (var i = 0; i < freq.length; i++) {
            if (freq[i] > 0) {
              total_count += freq[i]
              for (var j = 0; j < selected.length; j++) {
                if (i == selected[j]) {
                  selected_count += freq[i]
                }
              }
            }
          }
          if (total_count > 0) {
            values.push({
              timepoint: t,
              percentage: (selected_count / total_count),
              count: total_count,
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

  exports.generateDichTimeLineLegend = function () {
    // GENERATE LEGEND
    var legend = d3.select('.daxplore-ExternalLegend')
      .style('margin-top', (height / 2) + 'px')
      .style('margin-left', '4px')

    legend.html('')

    var option = legend.selectAll('.legend-row')
      .data(currentOptions)
      .enter()
        .append('div')
        .attr('class', function (d) { return 'legend-row legend-row-' + d.index })
        .html(function (option) {
          return "<span class='legend-marker' style='background-color: " +
                  zScaleColor(option.id) + ";'>&nbsp</span>" +
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

  exports.updateDichTimeLineChartSize = function (height_total) {
    var calcWidth = document.documentElement.clientWidth - // window width
              d3.select('.daxplore-QuestionPanel').node().offsetWidth - // tree sidebar
              5 - // tree margin (if changed here, needs to be changed in css)
              d3.select('.daxplore-SidebarArea').node().offsetWidth - // right sidebar
              2 - // border of 1px + 1px (if changed here, needs to be changed in css)
              1 // 1px fudge

    var headerBlockWidth = d3.select('.daxplore-ExternalHeader').node().offsetWidth
    var bottomBlockWidth = d3.select('.daxplore-PerspectivePanel').node().offsetWidth
    var description = d3.select('.daxplore-DescriptionPanelBottom').node()
    if (description != null) {
      bottomBlockWidth += description.offsetWidth
    }
    var horizontalMinWidth = Math.max(headerBlockWidth, bottomBlockWidth)

    var calcWidth = Math.max(calcWidth, horizontalMinWidth)

    var lockWidth = calcWidth < chartWidthScrollBreakpoint
    if (lockWidth) {
      calcWidth = chartWidthScrollBreakpoint
    }
    d3.select('.chart-panel')
      .classed('chart-scroll', lockWidth)
      .attr('width', function () { return lockWidth ? chartWidthScrollBreakpoint + 'px' : null })

    computeDimensions(calcWidth, height_total)

    chart
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    updateChartElements()
  }
})(window)
