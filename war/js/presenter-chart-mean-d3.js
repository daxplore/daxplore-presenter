(function(exports) {

  // CONSTANTS
  // TODO move to setting in producer
  // if chart width is smaller than this, embed it it a scrollpanel
  var chartWidthScrollBreakpoint = 300;

  var element_transition = d3.transition()
      .duration(300)
      .ease(d3.easeLinear);

  // CHART VARIABLES
  var xAxisTopHeight, xAxisBottomHeight, margin, width, height;
  var chart, chart_g;

  // INSTANCE SPECIFIC VARIABLES
  var first_update = true;
  var selectedOptions, perspective, question;
  var questionReferenceValue, questionGoodDirection;
  var selectedOptionsData;

  // INITIALIZE STATIC RESOURCES
  var question_map = {};
  var percentage_format = d3.format(".0%");

  for (var i=0; i < questions.length; i++) {
    var q = questions[i];
    question_map[q.column] = q ;
  }


  // INTERNAL FUNCTIONS

  function computeDimensions(width_total, height_total) {
    xAxisTopHeight = 30;
    xAxisBottomHeight = 24;
    margin = {top: 10, right: 25, bottom: 10, left: 10};
    width = width_total - margin.left - margin.right;
    height = height_total - margin.top - margin.bottom;
  }

  function generateChartElements() {

    // CHART
    chart = d3.select(".chart-panel").append("svg")
      .classed("mean-chart", true)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    // MARGIN ADJUSTED CHART ELEMENT
    chart_g = chart.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // WHITE BACKGROUND
    chart_g.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "white");

    // Y AXIS
    yAxisElement = chart_g.append("g")
      .classed("y", true)
      .classed("axis", true);

    // X AXIS TOP
    chart_g.append("g")
      .attr("class", "x axis top")
    .append("text")
      .classed('x-top-description', true)
      .text(usertexts.listXAxisDescription);

    // X AXIS BOTTOM
    chart_g.append("g")
      .attr("class", "x axis bottom")
    .append("text")
      .attr('class', 'x-bottom-description')
      .attr("text-anchor", "middle")
      .style("text-anchor", "middle")
      .text(usertexts.listXAxisDescription);

    yAxisReferenceElement = chart_g.append("g")
      .classed('y', true)
      .classed('axis', true)
      .style('opacity', 0);

  }

  // EXPORTED FUNCTIONS

  exports.generateMeanChart = function(selectedOptions_input, stat) {
    computeDimensions(chartWidthScrollBreakpoint, 300);
    generateChartElements();

    selectedOptions = selectedOptions_input;
    perspective = stat.p;
    question = stat.q;

    questionReferenceValue = question_map[question].mean_reference;
    questionGoodDirection = question_map[question].gooddirection;

    selectedOptionsData = [];
    selectedOptions.forEach(function(option, i) {
      selectedOptionsData.push({
        index: option,
        mean: stat.mean["0"].mean[option],
        count: stat.mean["0"].count[option],
      });
    });
  }

  function updateChartElements() {

    if (first_update) {
      var el_trans = d3.transition().duration(0);
    } else {
      var el_trans = element_transition;
    }

    var paddingInner = 0.3;
    var paddingOuter = 0.4;
    var maxBandwidth = 50;

    // TODO use to calculate minHeight for chart
    // rearranged equation from d3's source file band.js, ignoring the floor call
    // https://github.com/d3/d3-scale/blob/fd07dd8ceeaeaec612f675050ac134243b406f64/src/band.js#L26
    // var yHeightWithMaxBand = Math.max(1, selectedOptions.length - paddingInner + paddingOuter * 2) * maxBandwidth / (1 - paddingInner);
    //
    // var yStop = Math.min(height - xAxisBottomHeight, yHeightWithMaxBand + xAxisTopHeight);

    var yStop = height - xAxisBottomHeight;

    // CALCULATE Y SCALE
    y_scale = d3.scaleBand()
      .range([xAxisTopHeight, yStop])
      .paddingInner(paddingInner)
      .paddingOuter(paddingOuter)
      .domain(selectedOptions);


    // UPDATE Y AXIS
    yAxisScale = y_scale.copy();
    yAxisScale.domain(selectedOptionsData.map(function (option) { return question_map[perspective].options[option.index] }));
    var yAxis = d3.axisLeft()
      .tickSize(3)
      .scale(yAxisScale);

    oldYAxisWidth = Math.max(50, yAxisReferenceElement.node().getBBox().width);
    yAxisReferenceElement.call(yAxis);
    updateStyles(); // update yAxisReferenceElement styling to get correct width
    yAxisWidth = Math.max(50, yAxisReferenceElement.node().getBBox().width);

    if (first_update) {
      oldYAxisWidth = yAxisWidth;
    }

    yAxisElement.interrupt().selectAll('*').interrupt();

    yAxisElement
      .transition(el_trans)
        .attr("transform", "translate(" + yAxisWidth + ", 0)")
        .call(yAxis);

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
    x_scale = d3.scaleLinear()
      .domain([0, 100]) // TODO define range in producer
      .range([0, width - yAxisWidth]);


    // UPDATE X AXIS TOP
    var xAxisTop = d3.axisTop()
      .scale(x_scale)
      .ticks(20, "d")
      .tickSizeInner(0);

    var x_axis_top = d3.selectAll("g.x.axis.top");

    x_axis_top.interrupt().selectAll('*').interrupt();

    x_axis_top.transition(el_trans)
      .attr("transform", "translate(" + yAxisWidth + "," + xAxisTopHeight + ")")
      .call(xAxisTop);

    d3.selectAll(".x-top-description")
      .transition(el_trans)
        .attr("transform", "translate(" + (width - yAxisWidth)/2 + ", -20)");


    // UPDATE X AXIS BOTTOM
    var xAxisBottom = d3.axisBottom()
      .scale(x_scale)
      .ticks(20, "d")
      .tickSizeInner(-(yStop - xAxisTopHeight));

    var x_axis_bottom = d3.selectAll("g.x.axis.bottom");

    x_axis_bottom.interrupt().selectAll('*').interrupt();

    x_axis_bottom.transition(el_trans)
      .attr("transform", "translate(" + yAxisWidth + "," + (yStop) + ")")
      .call(xAxisBottom);

    d3.selectAll(".x-bottom-description")
      .transition(el_trans)
      .attr("transform", "translate(" + (width - yAxisWidth)/2 + ", 28)")


    // BARS
    var bars = chart_g.selectAll(".bar")
      .data(selectedOptionsData);

    // remove old bars
    bars.exit().remove();

    // add new bars
    bars.enter().append("g")
      .classed('bar', true)
      .attr("transform", function(option, i) { return "translate(" + (oldYAxisWidth + 1) + "," + y_scale(option.index) + ")"; })
      .append("rect")
        .classed('barrect', true)
        .attr("height", y_scale.bandwidth())
        .style("fill", function(option) { return colorForValue(option.mean, questionReferenceValue, questionGoodDirection) })
        .attr("width", function(option) { return first_update ? x_scale(option.mean) + 1 : 0; })
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
        ;

    // animate all bars into position
    bars = d3.selectAll('.bar');

    bars.interrupt().selectAll('*').interrupt();

    bars
      .transition(el_trans)
      .attr("transform", function(option) { return "translate(" + (yAxisWidth + 1) + "," + y_scale(option.index) + ")"; });

    bars.select(".barrect")
      .transition(el_trans)
        .style("fill", function(option) { return colorForValue(option.mean, questionReferenceValue, questionGoodDirection) })
        .attr("height", y_scale.bandwidth())
        .attr("width", function(option) { return x_scale(option.mean) + 1; });

    // REFERENCE LINES
    var referenceWidth = 3;
    chart_g.selectAll(".reference-line").remove();
    // var referenceLine = chart_g.append('g')
    //   .classed("reference-line", true)
    //   .append("rect")
    //     .attr("transform", "translate(" + (margin.left + yAxisWidth + x_scale(questionReferenceValue)) + "," + (margin.top + xAxisTopHeight) + ")")
    //     .style("fill", "black")
    //     .attr("height", height - xAxisTopHeight - xAxisBottomHeight)
    //     .attr("width", referenceWidth);

    var referenceLine = chart_g.append('g')
      .classed("reference-line", true)
      .append("line")
        .style("stroke", "#666")
        .style("stroke-dasharray", "5")
        .style("stroke-width", referenceWidth)
        .attr("x1", yAxisWidth + x_scale(questionReferenceValue))
        .attr("y1", xAxisTopHeight)
        .attr("x2", yAxisWidth + x_scale(questionReferenceValue))
        .attr("y2", height - xAxisBottomHeight);


    // REFERENCE LINES
    // var referenceWidth = 2;
    // var referenceExtraHeight = 4;
    // var referenceHeight = y_scale.bandwidth() + referenceExtraHeight;
    //
    // var references = chart_g.selectAll(".reference")
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
    //   .attr("transform", function(d, i) { return "translate(" + (yAxisWidth + x_scale(mean_references[getQid(i)]) - referenceWidth/2) + "," + (y_scale(d) - referenceExtraHeight/2) + ")"; })
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
    //   .transition(el_trans)
    //     .attr("transform", function(d, i) { return "translate(" + (yAxisWidth + x_scale(mean_references[d]) - referenceWidth/2) + "," + (y_scale(d) - referenceExtraHeight/2) + ")"; });
    //
    // references.select('.reference-line')
    //   .transition(el_trans)
    //     .attr("width", referenceWidth)
    //     .attr("height", referenceHeight);
    //
    // references.selectAll('.reference-line-box')
    //   .transition(el_trans)
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
    //   .transition(el_trans)
    //     .style("margin-left", yAxisWidth + bar_area_width/2 - select_width/2 + "px");
    //
    // header_select.node().selectedIndex = selected_option;


    // FINISH
    updateStyles();
  }

  function updateStyles() {
    d3.selectAll(".axis .domain")
      .style("visibility", "hidden");

    d3.selectAll(".axis path, .axis line")
      .style("fill", "none")
      .style("stroke", "#bbb")
      .style("shape-rendering", "geometricPrecision");

    d3.selectAll("text")
      .style("fill", "#555")
      .style("font", "13px sans-serif")
      .style("cursor", "default");

    d3.selectAll(".y path, .y line")
      .style("visibility", "hidden");

    d3.selectAll(".reference rect, .reference path")
      .style("fill", "#444");
  }

  exports.generateMeanLegend = function() {
    // GENERATE LEGEND
    var legend = d3.select('.daxplore-ExternalLegend')
      .style("margin-top", "0px")
      .style("margin-left", "0px");

    legend.html("");
  }

  exports.updateMeanChartSize = function(height_total) {
    var calcWidth = document.documentElement.clientWidth // window width
              - d3.select(".daxplore-QuestionPanel").node().offsetWidth // tree sidebar
              - 5 // tree margin (if changed here, needs to be changed in css)
              - d3.select(".daxplore-SidebarArea").node().offsetWidth // right sidebar
              - 2 // border of 1px + 1px (if changed here, needs to be changed in css)
              - 1; // 1px fudge

    var headerBlockWidth = d3.select(".daxplore-ExternalHeader").node().offsetWidth;
    var bottomBlockWidth = d3.select(".daxplore-PerspectivePanel").node().offsetWidth;
    var description = d3.select(".daxplore-DescriptionPanelBottom").node();
    if (description != null) {
        bottomBlockWidth += description.offsetWidth;
    }
    var horizontalMinWidth = Math.max(headerBlockWidth, bottomBlockWidth);

    var calcWidth = Math.max(calcWidth, horizontalMinWidth);

    var lockWidth = calcWidth < chartWidthScrollBreakpoint;
    if (lockWidth) {
      calcWidth = chartWidthScrollBreakpoint;
    }
    d3.select('.chart-panel')
      .classed('chart-scroll', lockWidth)
      .attr('width', function() {return lockWidth ? chartWidthScrollBreakpoint + "px" : null });

    computeDimensions(calcWidth, height_total);

    chart
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    updateChartElements();
  }

})(window);
