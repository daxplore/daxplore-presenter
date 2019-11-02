(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.meanprofile = namespace.chart.meanprofile || {}
  const exports = namespace.chart.meanprofile

  // CONSTANTS
  // TODO move to setting in producer
  // if chart width is smaller than this, embed it it a scrollpanel
  var chartWidthScrollBreakpoint = 300

  var elementTransition = d3.transition()
      .duration(300)
      .ease(d3.easeLinear)

  // CHART VARIABLES
  var xAxisTopHeight, xAxisBottomHeight, margin, width, height
  var chart, chartG

  // INSTANCE SPECIFIC VARIABLES
  var firstUpdate = true
  var selectedOptions, perspective, question
  var questionReferenceValue, questionGoodDirection
  var selectedOptionsData
  var yAxisElement, yAxisReferenceElement

  // INITIALIZE STATIC RESOURCES
  // TODO initialize once or keep injecting?
  var usertexts
  var questionMap
  // TODO unused: var percentageFormat = d3.format('.0%')

  // INTERNAL FUNCTIONS

  function computeDimensions (widthTotal, heightTotal) {
    xAxisTopHeight = 30
    xAxisBottomHeight = 24
    margin = { top: 10, right: 25, bottom: 10, left: 10 }
    width = widthTotal - margin.left - margin.right
    height = heightTotal - margin.top - margin.bottom
  }

  function generateChartElements () {
    // CHART
    chart = d3.select('.chart').append('svg')
      .classed('mean-chart', true)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    // MARGIN ADJUSTED CHART ELEMENT
    chartG = chart.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    // WHITE BACKGROUND
    chartG.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'white')

    // Y AXIS
    yAxisElement = chartG.append('g')
      .classed('y', true)
      .classed('axis', true)

    // X AXIS TOP
    chartG.append('g')
      .attr('class', 'x axis top')
    .append('text')
      .classed('x-top-description', true)
      .text(usertexts.listXAxisDescription)

    // X AXIS BOTTOM
    chartG.append('g')
      .attr('class', 'x axis bottom')
    .append('text')
      .attr('class', 'x-bottom-description')
      .attr('text-anchor', 'middle')
      .style('text-anchor', 'middle')
      .text(usertexts.listXAxisDescription)

    // Y Axis Reference Element
    yAxisReferenceElement = chartG.append('g')
      .classed('y', true)
      .classed('axis', true)
      .style('opacity', 0)
  }

  // EXPORTED FUNCTIONS

  exports.generateChart = function (usertextsInput, questionMapInput, selectedOptionsInput, stat) {
    usertexts = usertextsInput // TODO inject once?
    questionMap = questionMapInput // TODO inject once?
    computeDimensions(chartWidthScrollBreakpoint, 300)
    generateChartElements()

    selectedOptions = selectedOptionsInput
    perspective = stat.p
    question = stat.q

    questionReferenceValue = questionMap[question].mean_reference
    questionGoodDirection = questionMap[question].gooddirection

    selectedOptionsData = []
    selectedOptions.forEach(function (option, i) {
      selectedOptionsData.push({
        index: option,
        mean: stat.mean['0'].mean[option],
        count: stat.mean['0'].count[option],
      })
    })
  }

  function updateChartElements () {
    if (firstUpdate) {
      var elTrans = d3.transition().duration(0)
    } else {
      elTrans = elementTransition
    }

    var paddingInner = 0.3
    var paddingOuter = 0.4
    // TODO unused: var maxBandwidth = 50

    // TODO use to calculate minHeight for chart
    // rearranged equation from d3's source file band.js, ignoring the floor call
    // https://github.com/d3/d3-scale/blob/fd07dd8ceeaeaec612f675050ac134243b406f64/src/band.js#L26
    // var yHeightWithMaxBand = Math.max(1, selectedOptions.length - paddingInner + paddingOuter * 2) * maxBandwidth / (1 - paddingInner);
    //
    // var yStop = Math.min(height - xAxisBottomHeight, yHeightWithMaxBand + xAxisTopHeight);

    var yStop = height - xAxisBottomHeight

    // CALCULATE Y SCALE
    var yScale = d3.scaleBand()
      .range([xAxisTopHeight, yStop])
      .paddingInner(paddingInner)
      .paddingOuter(paddingOuter)
      .domain(selectedOptions)

    // UPDATE Y AXIS
    var yAxisScale = yScale.copy()
    yAxisScale.domain(selectedOptionsData.map(function (option) { return questionMap[perspective].options[option.index] }))
    var yAxis = d3.axisLeft()
      .tickSize(3)
      .scale(yAxisScale)

    var oldYAxisWidth = Math.max(50, yAxisReferenceElement.node().getBBox().width)
    yAxisReferenceElement.call(yAxis)
    updateStyles() // update yAxisReferenceElement styling to get correct width
    var yAxisWidth = Math.max(50, yAxisReferenceElement.node().getBBox().width)

    if (firstUpdate) {
      oldYAxisWidth = yAxisWidth
    }

    yAxisElement.interrupt().selectAll('*').interrupt()

    yAxisElement
      .transition(elTrans)
        .attr('transform', 'translate(' + yAxisWidth + ', 0)')
        .call(yAxis)

    // yAxisElement.selectAll(".y.axis text")
    //   .on("mouseover",
    //     function(d, i) {
    //       tooltipOver(i);
    //       setToHoverColor(i);
    //   })
    //   .on("mouseout",
    //     function(d, i) {
    //       tooltipOut();
    //       setToNormalColor(i);
    //     });

    // CALCULATE X SCALE
    var xScale = d3.scaleLinear()
      .domain([0, 100]) // TODO define range in producer
      .range([0, width - yAxisWidth])

    // UPDATE X AXIS TOP
    var xAxisTop = d3.axisTop()
      .scale(xScale)
      .ticks(20, 'd')
      .tickSizeInner(0)

    var xAxisTopElement = d3.selectAll('g.x.axis.top')

    xAxisTopElement.interrupt().selectAll('*').interrupt()

    xAxisTopElement.transition(elTrans)
      .attr('transform', 'translate(' + yAxisWidth + ',' + xAxisTopHeight + ')')
      .call(xAxisTop)

    d3.selectAll('.x-top-description')
      .transition(elTrans)
        .attr('transform', 'translate(' + (width - yAxisWidth) / 2 + ', -20)')

    // UPDATE X AXIS BOTTOM
    var xAxisBottom = d3.axisBottom()
      .scale(xScale)
      .ticks(20, 'd')
      .tickSizeInner(-(yStop - xAxisTopHeight))

    var xAxisBottomElement = d3.selectAll('g.x.axis.bottom')

    xAxisBottomElement.interrupt().selectAll('*').interrupt()

    xAxisBottomElement.transition(elTrans)
      .attr('transform', 'translate(' + yAxisWidth + ',' + (yStop) + ')')
      .call(xAxisBottom)

    d3.selectAll('.x-bottom-description')
      .transition(elTrans)
      .attr('transform', 'translate(' + (width - yAxisWidth) / 2 + ', 28)')

    // BARS
    var bars = chartG.selectAll('.bar')
      .data(selectedOptionsData)

    // remove old bars
    bars.exit().remove()

    // add new bars
    bars.enter().append('g')
      .classed('bar', true)
      .attr('transform', function (option, i) { return 'translate(' + (oldYAxisWidth + 1) + ',' + yScale(option.index) + ')' })
      .append('rect')
        .classed('barrect', true)
        .attr('height', yScale.bandwidth())
        .style('fill', function (option) {
          return dax.profile.colorForValue(option.mean, questionReferenceValue, questionGoodDirection)
        })
        .attr('width', function (option) { return firstUpdate ? xScale(option.mean) + 1 : 0 })
        // .on("mouseover",
        //   function(option) {
        //     var i = selected_q_ids.indexOf(d);
        //     tooltipOver(i);
        //     setToHoverColor(i);
        //   })
        // .on("mouseout",
        //   function(d) {
        //     var i = selected_q_ids.indexOf(d);
        //     tooltipOut();
        //     setToNormalColor(i);
        //   });

    // animate all bars into position
    bars = d3.selectAll('.bar')

    bars.interrupt().selectAll('*').interrupt()

    bars
      .transition(elTrans)
      .attr('transform', function (option) {
        return 'translate(' + (yAxisWidth + 1) + ',' + yScale(option.index) + ')'
      })

    bars.select('.barrect')
      .transition(elTrans)
        .style('fill', function (option) { return dax.profile.colorForValue(option.mean, questionReferenceValue, questionGoodDirection) })
        .attr('height', yScale.bandwidth())
        .attr('width', function (option) { return xScale(option.mean) + 1 })

    // REFERENCE LINES
    var referenceWidth = 3
    chartG.selectAll('.reference-line').remove()
    // var referenceLine = chartG.append('g')
    //   .classed("reference-line", true)
    //   .append("rect")
    //     .attr("transform", "translate(" + (margin.left + yAxisWidth + xScale(questionReferenceValue)) + "," + (margin.top + xAxisTopHeight) + ")")
    //     .style("fill", "black")
    //     .attr("height", height - xAxisTopHeight - xAxisBottomHeight)
    //     .attr("width", referenceWidth);

    // Reference line
    // TODO unused: var referenceLine =
    chartG.append('g')
      .classed('reference-line', true)
      .append('line')
        .style('stroke', '#666')
        .style('stroke-dasharray', '5')
        .style('stroke-width', referenceWidth)
        .attr('x1', yAxisWidth + xScale(questionReferenceValue))
        .attr('y1', xAxisTopHeight)
        .attr('x2', yAxisWidth + xScale(questionReferenceValue))
        .attr('y2', height - xAxisBottomHeight)

    // REFERENCE LINES
    // var referenceWidth = 2;
    // var referenceExtraHeight = 4;
    // var referenceHeight = y_scale.bandwidth() + referenceExtraHeight;
    //
    // var references = chartG.selectAll(".reference")
    //   .data(selectedOptionsData);
    //
    // // remove old reference lines
    // references.exit().remove();
    //
    // // add new reference lines
    // references.enter().append("g")
    //   .classed('reference', true)
    //   .on("mouseover",
    //     function(d) {
    //       var i = selected_q_ids.indexOf(d);
    //       tooltipOver(i);
    //       setToHoverColor(i);
    //     })
    //   .on("mouseout",
    //     function(d) {
    //       var i = selected_q_ids.indexOf(d);
    //       tooltipOut();
    //       setToNormalColor(i);
    //     })
    //   .attr("transform", function(d, i) { return "translate(" + (yAxisWidth + xScale(mean_references[getQid(i)]) - referenceWidth/2) + "," + (y_scale(d) - referenceExtraHeight/2) + ")"; })
    //   .style("shape-rendering", "crispEdges")
    //   .append("rect")
    //     .classed('reference-line', true)
    //     .attr("width", referenceWidth)
    //     .attr("height", referenceHeight)
    //   .append("rect") // invisible rect for mouseover
    //     .classed('reference-line-box', true)
    //     .attr("transform", "translate(-1, -1)")
    //     .attr("width", referenceWidth + 2)
    //     .attr("height", referenceHeight + 2)
    //     .attr("opacity", "0");
    //
    // // update all reference lines
    //
    // references = d3.selectAll('.reference');
    //
    // references.interrupt().selectAll('*').interrupt();
    //
    // references
    //   .transition(elTrans)
    //     .attr("transform", function(d, i) { return "translate(" + (yAxisWidth + xScale(mean_references[d]) - referenceWidth/2) + "," + (y_scale(d) - referenceExtraHeight/2) + ")"; });
    //
    // references.select('.reference-line')
    //   .transition(elTrans)
    //     .attr("width", referenceWidth)
    //     .attr("height", referenceHeight);
    //
    // references.selectAll('.reference-line-box')
    //   .transition(elTrans)
    //   .attr("width", referenceWidth + 2)
    //   .attr("height", referenceHeight + 2)
    //
    // // repopulate the description box and reset the tooltip
    // if (selected_q_ids.length > 0) {
    //   tooltipOver(Math.min(lastHoveredBar, selected_q_ids.length -1));
    // } else {
    //   d3.selectAll('#chart-description')
    //     .style('opacity', '0');
    // }
    // tooltipOut();

    // HEADER SELECT
    // var header_select_div = d3.select(".header-select-div");
    // var header_select = d3.select(".header-select");
    //
    // var options = header_select.selectAll('option')
    //     .data(perspective_options, function(d) { return d; });
    //
    // options.exit().remove();
    //
    // options.enter()
    //   .append('option')
    //     .text(function(d) { return d; })
    //     .attr("value", function(d, i) { return i });
    //
    // var bar_area_width = (width - yAxisWidth);
    // var select_width = header_select.node().getBoundingClientRect().width;
    //
    // header_select_div.interrupt();
    //
    // header_select_div
    //   .transition(elTrans)
    //     .style("margin-left", yAxisWidth + bar_area_width/2 - select_width/2 + "px");
    //
    // header_select.node().selectedIndex = selected_option;

    // FINISH
    updateStyles()
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
      .style('font', '13px sans-serif')
      .style('cursor', 'default')

    d3.selectAll('.y path, .y line')
      .style('visibility', 'hidden')

    d3.selectAll('.reference rect, .reference path')
      .style('fill', '#444')
  }

  exports.generateLegend = function () {
    // GENERATE LEGEND
    var legend = d3.select('.external-legend')
      .style('margin-top', '0px')
      .style('margin-left', '0px')

    legend.html('')
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

    var headerBlockWidth = d3.select('.external-header').node().offsetWidth
    var bottomBlockWidth = d3.select('.perspective-panel').node().offsetWidth
    var description = d3.select('.description-panel').node()
    if (description != null && description.offsetWidth > 0) {
      bottomBlockWidth += 250 // TODO hard coded
    }
    var topBotNeededWidth = Math.max(headerBlockWidth, bottomBlockWidth)

    var widthForChart = Math.max(availableWidth, topBotNeededWidth)

    // TODO heuristically calculate width needed to display chart without internal overlap
    var chartNeededWidth = 770 // TODO hard coded, shouldn't be

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
