(function(exports) {
  
  var colors = {};

  colors.good    = "hsl(95, 38%, 64%)";
  colors.average = "hsl(58, 60%, 62%)";
  colors.bad     = "hsl( 5, 38%, 72%)";
  
  colors.good_hover    = "hsl(95, 38%, 57%)";
  colors.average_hover = "hsl(60, 60%, 51%)";
  colors.bad_hover     = "hsl( 5, 38%, 67%)";
  
  colors.good_text    = "hsl(95, 38%, 34%)";
  colors.average_text = "hsl(60, 60%, 31%)",
  colors.bad_text     = "hsl( 5, 38%, 42%)";

  var q_ids, means, references, perspective_option, usertexts, descriptions, directions;
  var selected_option;
  var charwrapperBB, xAxisTopHeight, xAxisBottomHeight, margin, width, height;
  var x_scale, y_scale;
  var yAxisWidth;
  
  var barTransitionTime = 300;
  var lastHoveredBar = 0;
  
  // FUNCTIONS

  
  function setToNormalColor(i) {
    d3.select("#barrect-" + q_ids[i])
      .style("fill", colorForValue(means[i][selected_option], references[i], directions[i]));
    d3.selectAll(".q-" + q_ids[i])
      .classed("bar-hover", false);
    d3.selectAll(".y.axis .tick")
      .classed("bar-hover", false);
  }
  
  function setToHoverColor(i) {
    d3.select("#barrect-" + q_ids[i])
      .style("fill", colorHoverForValue(means[i][selected_option], references[i], directions[i]));
    d3.selectAll(".q-" + q_ids[i])
      .classed("bar-hover", true);
    d3.selectAll(".y.axis .tick")
      .classed("bar-hover", function(d, index) { return i == index; });
  }
      
  function colorForValue(value, reference, direction) {
    if (direction == "LOW") {
      var diff = reference - value;
    } else {
      var diff = value - reference;
    }

    if (diff < -5) {
      return colors.bad;
    } else if (diff > 5) {
      return colors.good;
    } else {
      return colors.average;
    }
  }
  
  function colorHoverForValue(value, reference, direction) {
    if (direction == "LOW") {
      var diff = reference - value;
    } else {
      var diff = value - reference;
    }

    if (diff < -5) {
      return colors.bad_hover;
    } else if (diff > 5) {
      return colors.good_hover;
    } else {
      return colors.average_hover;
    }
  }
  
  function colorTextForValue(value, reference, direction) {
    if (direction == "LOW") {
      var diff = reference - value;
    } else {
      var diff = value - reference;
    }

    if (diff < -5) {
      return colors.bad_text;
    } else if (diff > 5) {
      return colors.good_text;
    } else {
      return colors.average_text;
    }
  }
  
  function tooltipOver(i) {
    lastHoveredBar = i;
    var tooltipdiv = d3.select(".tooltipdiv");
    
    tooltipdiv.transition()    
      .duration(200)    
      .style("opacity", 1);
    
    tooltipdiv.html(
        shorttexts[i] + ": <b>" + d3.format(".2s")(means[i][selected_option]) + "</b><br>"
        + usertexts.listReferenceValue + ": <b>" + d3.format(".2")(references[i]) + "</b>")
      .style("background", colorHoverForValue(means[i][selected_option], references[i],  directions[i]))
      .style("left", (charwrapperBB.left + x_scale(Math.max(means[i][selected_option], references[i])) + yAxisWidth + 14) + "px")   
      .style("top", charwrapperBB.top +  y_scale(q_ids[i]) + y_scale.bandwidth()/2 - tooltipdiv.node().getBoundingClientRect().height/2 + "px");
    
    var arrowleft = d3.select(".arrow-left");
    
    arrowleft.transition()    
      .duration(200)    
      .style("opacity", 1);    
    
    arrowleft
      .style("border-right-color", colorHoverForValue(means[i][selected_option], references[i],  directions[i]))
      .style("left", (charwrapperBB.left + x_scale(Math.max(means[i][selected_option], references[i])) + yAxisWidth + 4) + "px")   
      .style("top", charwrapperBB.top +  y_scale(q_ids[i]) + y_scale.bandwidth()/2 - arrowleft.node().getBoundingClientRect().height/2 + "px");
      
    setDescription(i);
  }
  
  function setDescription(i) {
    var description = d3.select(".description");
    
    description.transition()
      .duration(0)
      .style("opacity", 1);
    
    var color = colorTextForValue(means[i][selected_option], references[i],  directions[i]);
    var header = "<span class='description-header'>" + perspective_option[selected_option] + "</span><br><b>" + shorttexts[i] + ": " + d3.format(".2")(means[i][selected_option]) + "</b><br>"
    var subheader = "<b>" + usertexts.listReferenceValue + ": " + d3.format(".2")(references[i]) + "</b><br>"; 
    
    
    var trueDiff = means[i][selected_option] - references[i]; 
    if (directions[i] == "LOW") {
      var diff = references[i] - means[i][selected_option]; 
    } else {
      var diff = trueDiff; 
    }
          
    if (diff < -5) {
      var referenceComparison = usertexts.listReferenceWorse;
    } else if (diff > 5) {
      var referenceComparison = usertexts.listReferenceBetter;
    } else {
      var referenceComparison = usertexts.listReferenceComparable;
    }
    
    referenceComparison = "<span style=\"color: " + color + "; font-weight: bold\">" + referenceComparison + ": " + d3.format("+.2")(trueDiff) + "</span></b><br><br>";
    
    description.html(header + subheader + referenceComparison + descriptions[i]);
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
  
  function generateChart() {
    var chart = d3.select(".chart")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
        
    chart.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "white");
    
    chart.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    return chart;
  }
  
  function generateYScale(q_ids) {
    var y_scale = d3.scaleBand()
      .range([xAxisTopHeight, height - xAxisBottomHeight])
      .paddingInner(0.3)
      .paddingOuter(0.4);

    y_scale.domain(q_ids);
    
    return y_scale;
  }
  
  function generateYAxis(chart, shorttexts, y_scale) {
    var yAxisScale = y_scale.copy();
    
    yAxisScale.domain(shorttexts);
    
    var yAxis = d3.axisLeft()
      .tickSize(3)
      .scale(yAxisScale);
      
    var yAxisElement = chart.append("g")
      .attr("class", "y axis")
      .call(yAxis);
      
    yAxisWidth = yAxisElement.node().getBBox().width;
    
    yAxisElement
      .attr("transform", "translate(" + yAxisWidth + ", 0)");
      
    d3.selectAll(".y.axis text")
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
  }
  
  function generateXScale() {
    var x_scale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width - yAxisWidth]);
      
    return x_scale;
  }
  
  function generateXAxisTop(chart, x_scale, usertexts) {
    var xAxisTop = d3.axisTop()
      .scale(x_scale)
      .ticks(20, "d")
      .tickSizeInner(0);
      
    var xAxisTopElement = chart.append("g")
        .attr("class", "x axis top")
        .attr("transform", "translate(" + yAxisWidth + "," + xAxisTopHeight + ")")
        .call(xAxisTop)
      .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + (width - yAxisWidth)/2 + ", -20)")
        .style("text-anchor", "middle")
        .text(usertexts.listXAxisDescription);
  }
  
  function generateXAxisBottom(chart, x_scale, usertexts) {
    var xAxisBottom = d3.axisBottom()
      .scale(x_scale)
      .ticks(20, "d")
      .tickSizeInner(-(height - xAxisTopHeight - xAxisBottomHeight));
      
    chart.append("g")
        .attr("class", "x axis bottom")
        .attr("transform", "translate(" + yAxisWidth + "," + (height - xAxisBottomHeight) + ")")
        .call(xAxisBottom)
      .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + (width - yAxisWidth)/2 + ", 28)")
        .style("text-anchor", "middle")
        .text(usertexts.listXAxisDescription); 
  }
  
  function generateBars(chart, means, q_ids, references, x_scale, y_scale) {
    var bar = chart.selectAll(".bar")
        .data(q_ids)
      .enter().append("g")
        .attr("class", function (d, i) { return "bar q-" + d; })
        .attr("transform", function(d, i) { return "translate(" + (yAxisWidth + 1) + "," + y_scale(d) + ")"; });

    bar.append("rect")
      .attr("class", "barrect")
      .attr("id", function(d, i) { return "barrect-" + d; })
      .attr("height", y_scale.bandwidth())
      .style("fill", function(d, i) { return colorForValue(means[i][selected_option], references[i], directions[i]); })
      .attr("width", function(d, i) { return x_scale(means[i][selected_option]) + 1; })
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
  }
  
  function generateReferenceLines(chart, q_ids, x_scale, y_scale) {
    var referenceWidth = 2;
    var referenceExtraHeight = 4;
    var referenceHeight = y_scale.bandwidth() + referenceExtraHeight;
    var reference = chart.selectAll(".reference")
      .data(q_ids)
    .enter().append("g")
      .attr("class", function (d, i) { return "reference q-" + d; })
        .on("mouseover",
          function(d, i) {
            tooltipOver(i);
            setToHoverColor(i); 
          })
        .on("mouseout",
          function(d, i) {
            tooltipOut();
            setToNormalColor(i);
          })
      .attr("transform", function(d, i) { return "translate(" + (yAxisWidth + x_scale(references[i]) - referenceWidth/2) + "," + (y_scale(d) - referenceExtraHeight/2) + ")"; })
      .style("shape-rendering", "crispEdges");

    reference.append("rect")
      .attr("width", referenceWidth)
      .attr("height", referenceHeight);     
      
    // invisible rect for mouseover 
    reference.append("rect")
      .attr("transform", "translate(-1, -1)")
      .attr("width", referenceWidth + 2)
      .attr("height", referenceHeight + 2)
      .attr("opacity", "0");   
  }
  
  function generateHeader() {
    var header_select_div = d3.select(".header-select-div");
    var header_select = d3.select(".header-select");
    var bar_area_width = (width - yAxisWidth);
    var arrow_img_width = 33;
    var select_width = header_select.node().getBoundingClientRect().width + arrow_img_width;
    
    header_select_div
      .style("width", select_width + "px")
      .style("margin-left", yAxisWidth + bar_area_width/2 - select_width/2 + "px");
      
    header_select
      .style("width", select_width+28 + "px") 
  }
  
  function generateStyle() {
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
  
  
  // EXPORTS 
  
  exports.generateListChart =
    function(
      q_ids_array,
      means_array,
      references_array,
      perspective_option_array,
      shorttexts_array,
      usertexts_map,
      descriptions_array,
      directions_array,
      selected_selected_option) {
    
    q_ids = q_ids_array;
    means = means_array;
    references = references_array;
    perspective_option = perspective_option_array;
    shorttexts = shorttexts_array;
    usertexts = usertexts_map;
    descriptions = descriptions_array;
    directions = directions_array;

    selected_option = selected_selected_option;
    
    computeDimensions();
    
    var chart = generateChart();
    
    y_scale = generateYScale(q_ids);
        
    generateYAxis(chart, shorttexts, y_scale);
    
    x_scale = generateXScale(chart);
    
    generateXAxisTop(chart, x_scale, usertexts);
    
    generateXAxisBottom(chart, x_scale, usertexts);
    
    generateBars(chart, means, q_ids, references, x_scale, y_scale);
    
    generateReferenceLines(chart, q_ids, x_scale, y_scale);

    generateHeader();
    
    // populate the description box
    setDescription(lastHoveredBar);
    
    generateStyle();
  }
  
  exports.updateSelectorOption = function(selected_selected_option) {
    selected_option = selected_selected_option;
    
    var bar = d3.selectAll(".barrect")
      .transition()
        .duration(barTransitionTime)
        .ease(d3.easeLinear)
        .style("fill", function(d, i) {
          return colorForValue(means[i][selected_option], references[i], directions[i]); })
        .attr("width", function(d, i) { return x_scale(means[i][selected_option]) + 1; });
    
    /* repopulate the description box and reset the tooltip */
    tooltipOver(lastHoveredBar);
    tooltipOut();
  }
  
  exports.generateImage = function() {
    var chartBB = d3.select(".chart").node().getBoundingClientRect();
    
    var chartWidth = chartBB.width;
    var chartHeight = chartBB.height - xAxisTopHeight - xAxisBottomHeight + 10; // constant to fudge result
    
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
      
      var header_text = perspective_option[selected_option];
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
