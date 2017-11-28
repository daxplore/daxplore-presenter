(function(exports) {

  var first_update = true;
  
  var q_ids, means, mean_references, perspective_options, usertexts, descriptions, directions;
  var selected_option = 0, selected_q_ids = [];
  var charwrapperBB, xAxisTopHeight, xAxisBottomHeight, margin, width, height;
  var chart, x_scale, y_scale;
  var yAxisWidth;

  var element_transition = d3.transition()
      .duration(300)
      .ease(d3.easeLinear);
  
  var lastHoveredBar = 0;

  // FUNCTIONS
  
  function getQid(i) {
      return selected_q_ids[i];
  }
  
  function getMean(i, selected_option) {
      return means[q_ids.indexOf(getQid(i))][selected_option];
  }

  function setToNormalColor(i) {
    d3.select("#barrect-" + getQid(i))
      .style("fill", colorForValue(getMean(i, selected_option), mean_references[getQid(i)], directions[getQid(i)]));
    d3.selectAll(".q-" + getQid(i))
      .classed("bar-hover", false);
    d3.selectAll(".y.axis .tick")
      .classed("bar-hover", false);
  }

  function setToHoverColor(i) {
    d3.select("#barrect-" + getQid(i))
      .style("fill", colorHoverForValue(getMean(i, selected_option), mean_references[getQid(i)], directions[getQid(i)]));
    d3.selectAll(".q-" + getQid(i))
      .classed("bar-hover", true);
    d3.selectAll(".y.axis .tick")
      .classed("bar-hover", function(d, index) { return i == index; });
  }

  function tooltipOver(i) {
    lastHoveredBar = i;
    var tooltipdiv = d3.select(".tooltipdiv");

    tooltipdiv.transition()
      .duration(200)
      .style("opacity", 1);

    tooltipdiv.html(
        shorttexts[getQid(i)] + ": <b>" + d3.format("d")(getMean(i, selected_option)) + "</b><br>"
        + usertexts.listReferenceValue + ": <b>" + d3.format("d")(mean_references[getQid(i)]) + "</b>")
      .style("background", colorHoverForValue(getMean(i, selected_option), mean_references[getQid(i)],  directions[getQid(i)]))
      .style("left", (charwrapperBB.left + x_scale(Math.max(getMean(i, selected_option), mean_references[getQid(i)])) + yAxisWidth + 14) + "px")
      .style("top", charwrapperBB.top +  y_scale(getQid(i)) + y_scale.bandwidth()/2 - tooltipdiv.node().getBoundingClientRect().height/2 + "px");

    var arrowleft = d3.select(".arrow-left");

    arrowleft.transition()
      .duration(200)
      .style("opacity", 1);

    arrowleft
      .style("border-right-color", colorHoverForValue(getMean(i, selected_option), mean_references[getQid(i)],  directions[getQid(i)]))
      .style("left", (charwrapperBB.left + x_scale(Math.max(getMean(i, selected_option), mean_references[getQid(i)])) + yAxisWidth + 4) + "px")
      .style("top", charwrapperBB.top +  y_scale(getQid(i)) + y_scale.bandwidth()/2 - arrowleft.node().getBoundingClientRect().height/2 + "px");

    setDescriptionFull(d3.select("#chart-description"), perspective_options[selected_option], getQid(i), getMean(i, selected_option));
  }

  function tooltipOut() {
    d3.select(".tooltipdiv")
      .transition()
        .duration(300)
        .style("opacity", 0);

    d3.select(".arrow-left")
      .transition()
        .duration(300)
        .style("opacity", 0);
  }


  // CHART ELEMENTS

  function computeDimensions() {
    charwrapperBB = d3.select(".chart-wrapper").node().getBoundingClientRect();
    xAxisTopHeight = 30;
    xAxisBottomHeight = 24;
    margin = {top: 0, right: 13, bottom: xAxisTopHeight + xAxisBottomHeight, left: 0};
    width = charwrapperBB.width - margin.left - margin.right;
    height = charwrapperBB.height - margin.top - margin.bottom;
  }
  
  function generateChartElements() {
      
    // CHART
    var chart = d3.select(".chart")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
    
    // WHITE BACKGROUND
    chart.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "white");
    
    // Y AXIS
    yAxisElement = chart.append("g")
      .classed("y", true)
      .classed("axis", true);
    
    yAxisReferenceElement = chart.append("g")
      .classed('y', true)
      .classed('axis', true)
      .style('opacity', 0);

    // X AXIS TOP
    chart.append("g")
      .attr("class", "x axis top")
    .append("text")
      .classed('x-top-description', true)
      .text(usertexts.listXAxisDescription);
    
    // X AXIS BOTTOM
    chart.append("g")
      .attr("class", "x axis bottom")
    .append("text")
      .attr('class', 'x-bottom-description')
      .attr("text-anchor", "middle")
      .style("text-anchor", "middle")
      .text(usertexts.listXAxisDescription);
    
    // Hide save image button in IE11 because of a known svg bug
    // https://connect.microsoft.com/IE/feedbackdetail/view/925655
    var isIE11 = /Trident.*rv[ :]*11\./.test(navigator.userAgent);
    if (isIE11) {
      d3.selectAll('.save-image')
       .style('display', 'none');
    }
  }
  
  
  function updateChartElements() {
    
    if (first_update) {
      var el_trans = d3.transition().duration(0);
    } else {
      var el_trans = element_transition;
    }
    
    var chart = d3.selectAll('.chart');
    
    var paddingInner = 0.3;
    var paddingOuter = 0.4;
    var maxBandwidth = 50;
    
    // rearranged equation from d3's source file band.js, ignoring the floor call
    // https://github.com/d3/d3-scale/blob/fd07dd8ceeaeaec612f675050ac134243b406f64/src/band.js#L26
    var yHeightWithMaxBand = Math.max(1, selected_q_ids.length - paddingInner + paddingOuter * 2) * maxBandwidth / (1 - paddingInner);
    
    var yStop = Math.min(height - xAxisBottomHeight, yHeightWithMaxBand + xAxisTopHeight);
    
    
    // CALCULATE Y SCALE
    y_scale = d3.scaleBand()
      .range([xAxisTopHeight, yStop])
      .paddingInner(paddingInner)
      .paddingOuter(paddingOuter)
      .domain(selected_q_ids);
    

    // UPDATE Y AXIS
    yAxisScale = y_scale.copy();
    yAxisScale.domain(selected_q_ids.map(function (q_id) { return shorttexts[q_id] }));
    var yAxis = d3.axisLeft()
      .tickSize(3)
      .scale(yAxisScale);
    
    oldYAxisWidth = Math.max(50, yAxisReferenceElement.node().getBBox().width);
    yAxisReferenceElement.call(yAxis);
    yAxisWidth = Math.max(50, yAxisReferenceElement.node().getBBox().width);
    
    if (first_update) {
      oldYAxisWidth = yAxisWidth;
    }
    
    yAxisElement.interrupt().selectAll('*').interrupt();
    
    yAxisElement
      .transition(el_trans)
        .attr("transform", "translate(" + yAxisWidth + ", 0)")
        .call(yAxis);
    
    yAxisElement.selectAll(".y.axis text")
      .on("mouseover",
        function(d, i) {
          tooltipOver(i);
          setToHoverColor(i);
      })
      .on("mouseout",
        function(d, i) {
          tooltipOut();
          setToNormalColor(i);
        });
    
    
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
    var bars = chart.selectAll(".bar")
      .data(selected_q_ids);
    
    // remove old bars
    bars.exit().remove();
    
    // add new bars
    bars.enter().append("g")
      .classed('bar', true)
      .attr("transform", function(d, i) { return "translate(" + (oldYAxisWidth + 1) + "," + y_scale(d) + ")"; })
      .append("rect")
        .classed('barrect', true)
        .attr("height", y_scale.bandwidth())
        .style("fill", function(d, i) { return colorForValue(getMean(i, selected_option), mean_references[getQid(i)], directions[getQid(i)]); })
        .attr("width", function(d, i) { return first_update ? x_scale(getMean(i, selected_option)) + 1 : 0; })
        .on("mouseover",
          function(d) {
            var i = selected_q_ids.indexOf(d);
            tooltipOver(i);
            setToHoverColor(i);
          })
        .on("mouseout",
          function(d) {
            var i = selected_q_ids.indexOf(d);
            tooltipOut();
            setToNormalColor(i);
          });

    // animate all bars into position
    bars = d3.selectAll('.bar');
    
    bars.interrupt().selectAll('*').interrupt();
    
    bars
      .transition(el_trans)
      .attr("transform", function(d, i) { return "translate(" + (yAxisWidth + 1) + "," + y_scale(d) + ")"; });
    
    bars.select(".barrect")
      .transition(el_trans)
        .style("fill", function(d, i) {return colorForValue(getMean(i, selected_option), mean_references[getQid(i)], directions[getQid(i)]); })
        .attr("height", y_scale.bandwidth())
        .attr("width", function(d, i) { return x_scale(getMean(i, selected_option)) + 1; });
    
    // REFERENCE LINES
    var referenceWidth = 2;
    var referenceExtraHeight = 4;
    var referenceHeight = y_scale.bandwidth() + referenceExtraHeight;
    
    var references = chart.selectAll(".reference")
      .data(selected_q_ids);
    
    // remove old reference lines
    references.exit().remove();
    
    // add new reference lines
    references.enter().append("g")
      .classed('reference', true)
      .on("mouseover",
        function(d) {
          var i = selected_q_ids.indexOf(d);
          tooltipOver(i);
          setToHoverColor(i);
        })
      .on("mouseout",
        function(d) {
          var i = selected_q_ids.indexOf(d);
          tooltipOut();
          setToNormalColor(i);
        })
      .attr("transform", function(d, i) { return "translate(" + (yAxisWidth + x_scale(mean_references[getQid(i)]) - referenceWidth/2) + "," + (y_scale(d) - referenceExtraHeight/2) + ")"; })
      .style("shape-rendering", "crispEdges")
      .append("rect")
        .classed('reference-line', true)
        .attr("width", referenceWidth)
        .attr("height", referenceHeight)
      .append("rect") // invisible rect for mouseover
        .classed('reference-line-box', true)
        .attr("transform", "translate(-1, -1)")
        .attr("width", referenceWidth + 2)
        .attr("height", referenceHeight + 2)
        .attr("opacity", "0");
    
    // update all reference lines
    
    references = d3.selectAll('.reference');
    
    references.interrupt().selectAll('*').interrupt();
    
    references
      .transition(el_trans)
        .attr("transform", function(d, i) { return "translate(" + (yAxisWidth + x_scale(mean_references[d]) - referenceWidth/2) + "," + (y_scale(d) - referenceExtraHeight/2) + ")"; });
    
    references.select('.reference-line')
      .transition(el_trans)
        .attr("width", referenceWidth)
        .attr("height", referenceHeight);
    
    references.selectAll('.reference-line-box')
      .transition(el_trans)
      .attr("width", referenceWidth + 2)
      .attr("height", referenceHeight + 2)
    
    // repopulate the description box and reset the tooltip
    if (selected_q_ids.length > 0) {
      tooltipOver(Math.min(lastHoveredBar, selected_q_ids.length -1));
    } else {
      d3.selectAll('#chart-description')
        .style('opacity', '0');
    }
    tooltipOut();
    
    
    // HEADER SELECT
    var header_select_div = d3.select(".header-select-div");
    var header_select = d3.select(".header-select");
    
    var options = header_select.selectAll('option')
        .data(perspective_options, function(d) { return d; });
    
    options.exit().remove();
    
    options.enter()
      .append('option')
        .text(function(d) { return d; })
        .attr("value", function(d, i) { return i });
    
    var bar_area_width = (width - yAxisWidth);
    var select_width = header_select.node().getBoundingClientRect().width;

    header_select_div.interrupt();
    
    header_select_div
      .transition(el_trans)
        .style("margin-left", yAxisWidth + bar_area_width/2 - select_width/2 + "px");
    
    header_select.node().selectedIndex = selected_option;
    
    
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
      .style("font", "12px sans-serif")
      .style("cursor", "default")

    d3.selectAll(".y path, .y line")
      .style("visibility", "hidden");

    d3.selectAll(".reference rect, .reference path")
      .style("fill", "#444");
  }
  
  function get_selected_q_ids(means, selected_option) {
    var selected = [];
    q_ids.forEach(function(q_id, i) {
      if (!isNaN(means[i][selected_option]) && means[i][selected_option] != -1) {
        selected.push(q_id);
      }
    });
    return selected;
  }


  // EXPORTS

  exports.generateListChart =
    function(
      q_ids_array,
      references_map,
      shorttexts_map,
      usertexts_map,
      descriptions_map,
      directions_map,
      selected_selected_option) {

    q_ids = q_ids_array;
    mean_references = references_map;
    shorttexts = shorttexts_map;
    usertexts = usertexts_map;
    descriptions = descriptions_map;
    directions = directions_map;

    selected_option = selected_selected_option;

    computeDimensions();

    generateChartElements();
    updateStyles();
  }

  exports.setChartData = function(perspective_options_array, means_array) {
    perspective_options = perspective_options_array;
    means = means_array;
    selected_q_ids = get_selected_q_ids(means, selected_option);
    
    updateSelectorOption(selected_option);
    
    first_update = false;
  }
  
  exports.updateSelectorOption = function(selected_selected_option) {
    selected_option = selected_selected_option;
    selected_q_ids = get_selected_q_ids(means, selected_option);

    updateChartElements();
    updateStyles();
  }

  exports.generateImage = function() {
    var chartBB = d3.select(".chart").node().getBoundingClientRect();

    var chartWidth = chartBB.width;
    var chartHeight = d3.select('.x.axis.top').node().getBoundingClientRect().height
                    + d3.select('.x.axis.bottom').node().getBoundingClientRect().height
                    + 10;  // constant to fudge the result
    
    var doctype = '<?xml version="1.0" standalone="no"?>'
      + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

    var svg = d3.select('svg').node();

    var source = (new XMLSerializer()).serializeToString(svg);

    var blob = new Blob([ doctype + source], { type: "image/svg+xml;charset=utf-8" });

    var url = window.URL.createObjectURL(blob);

    var img_selection = d3.select('body').append('img')
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .style("visibility", "hidden");

    img = img_selection.node();

    img.onload = function() {
      var canvas_chart_selection = d3.select('body').append('canvas')
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .style("visibility", "hidden");
      var canvas_chart = canvas_chart_selection.node();
  
      var chart_ctx = canvas_chart.getContext('2d');
      chart_ctx.drawImage(img, 0, 0);
  
      var header_text = perspective_options[selected_option];
      var header_padding_top = 5;
      var header_font_size = 16;
      var header_padding_bottom = 10;
      var header_font = "bold " + header_font_size + "px sans-serif";
      var header_height = header_padding_top + header_font_size + header_padding_bottom;

      var img_margin = {top: 10, right: 20, bottom: 20, left: 10};

      var complete_width = img_margin.left + chartWidth + img_margin.right;
      var complete_height = img_margin.top + header_height + chartHeight + img_margin.bottom;
      var canvas_complete_selection = d3.select("body").append("canvas")
        .attr("width", complete_width + "px")
        .attr("height", complete_height + "px")
        .style("visibility", "hidden");

      var canvas_complete = canvas_complete_selection.node();

      var ctx = canvas_complete_selection.node().getContext("2d");

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, complete_width, complete_height);
      ctx.fillStyle = "black";

      ctx.font = header_font;

      var header_width = ctx.measureText(header_text).width;

      var bar_area_width = (width - yAxisWidth);
      var header_horizontal_shift = yAxisWidth + bar_area_width/2 - header_width/2;

      ctx.fillText(header_text, header_horizontal_shift + img_margin.left, header_padding_top + header_font_size + img_margin.top);

      var source_text = usertexts.imageWaterStamp;
      var source_font_height = 11;
      ctx.font = source_font_height + "px sans-serif";
      ctx.fillStyle = "#555";
      var source_text_width = ctx.measureText(source_text).width;
      ctx.fillText(source_text, 5, complete_height - 5);

      ctx.drawImage(canvas_chart, img_margin.left, img_margin.top + header_height);

      canvas_complete.toBlob(function(blob) {
        saveAs(blob, header_text + ".png");
      });

      img_selection.remove();
      canvas_chart_selection.remove();
      canvas_complete_selection.remove();
    }

    img.src = url;
  }
})(window);

