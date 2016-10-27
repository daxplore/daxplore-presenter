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

  var data, perspective_option;
  var charwrapperBB, xAxisTopHeight, xAxisBottomHeight, margin, width, height;
  var x_scale, y_scale;
  var yAxisWidth;
  
  var barTransitionTime = 300;
  var lastHoveredBar = 0;
  
  // FUNCTIONS

  function setToReferenceColor(i) {
    d3.select("barrect-" + i)
      .style("fill", colorForValue(data.reference_map[i], data.reference_map[i], data.direction_map[data.q_ids[i]]));
  }
  
  function setToNormalColor(i) {
    d3.select("#barrect-" + data.q_ids[i])
      .style("fill", colorForValue(data.means[i][perspective_option], data.references[i], data.direction_map[data.q_ids[i]]));
    d3.selectAll(".q-" + data.q_ids[i])
      .classed("bar-hover", false);
    d3.selectAll(".y.axis .tick")
      .classed("bar-hover", false);
  }
  
  function setToHoverColor(i) {
    d3.select("#barrect-" + data.q_ids[i])
      .style("fill", colorHoverForValue(data.means[i][perspective_option], data.references[i], data.direction_map[data.q_ids[i]]));
    d3.selectAll(".q-" + data.q_ids[i])
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
        data.shorttexts[i] + ": <b>" + d3.format(".2s")(data.means[i][perspective_option]) + "</b><br>"
        + data.usertexts.listReferenceValue + ": <b>" + d3.format(".2")(data.references[i]) + "</b>")
      .style("background", colorHoverForValue(data.means[i][perspective_option], data.references[i], data.direction_map[data.q_ids[i]]))
      .style("left", (charwrapperBB.left + x_scale(Math.max(data.means[i][perspective_option], data.references[i])) + yAxisWidth + 14) + "px")   
      .style("top", charwrapperBB.top +  y_scale(data.q_ids[i]) + y_scale.bandwidth()/2 - tooltipdiv.node().getBoundingClientRect().height/2 + "px");
    
    var arrowleft = d3.select(".arrow-left");
    
    arrowleft.transition()    
      .duration(200)    
      .style("opacity", 1);    
    
    arrowleft
      .style("border-right-color", colorHoverForValue(data.means[i][perspective_option], data.references[i], data.direction_map[data.q_ids[i]]))
      .style("left", (charwrapperBB.left + x_scale(Math.max(data.means[i][perspective_option], data.references[i])) + yAxisWidth + 4) + "px")   
      .style("top", charwrapperBB.top +  y_scale(data.q_ids[i]) + y_scale.bandwidth()/2 - arrowleft.node().getBoundingClientRect().height/2 + "px");
      
    setDescription(i);
  }
  
  function setDescription(i) {
    var description = d3.select(".description");
    
    description.transition()
      .duration(0)
      .style("opacity", 1);
    
    var color = colorTextForValue(data.means[i][perspective_option], data.references[i], data.direction_map[data.q_ids[i]]);
    var header = "<span class='description-header'>" + data.perspective_options[perspective_option] + "</span><br><b>" + data.shorttext_map[data.q_ids[i]] + ": " + d3.format(".2")(data.means[i][perspective_option]) + "</b><br>"
    var subheader = "<b>" + data.usertexts.listReferenceValue + ": " + d3.format(".2")(data.references[i]) + "</b><br>"; 
    
    
    var trueDiff = data.means[i][perspective_option] - data.references[i]; 
    if (data.direction_map[data.q_ids[i]] == "LOW") {
      var diff = data.references[i] - data.means[i][perspective_option]; 
    } else {
      var diff = trueDiff; 
    }
          
    if (diff < -5) {
      var referenceComparison = data.usertexts.listReferenceWorse;
    } else if (diff > 5) {
      var referenceComparison = data.usertexts.listReferenceBetter;
    } else {
      var referenceComparison = data.usertexts.listReferenceComparable;
    }
    
    referenceComparison = "<span style=\"color: " + color + "; font-weight: bold\">" + referenceComparison + ": " + d3.format("+.2")(trueDiff) + "</span></b><br><br>";
    
    description.html(header + subheader + referenceComparison + data.description_map[data.q_ids[i]]);
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
  
  
  // EXPORTS 
  
  exports.generateListChart = function(unpacked_data, selected_perspective_option) {
    data = unpacked_data;
    perspective_option = selected_perspective_option;
    
    // DEFINITIONS
      
    charwrapperBB = d3.select(".chart-wrapper").node().getBoundingClientRect();
    
    
    xAxisTopHeight = 30,
    xAxisBottomHeight = 24,
    margin = {top: 0, right: 13, bottom: xAxisTopHeight + xAxisBottomHeight, left: 0},
    width = charwrapperBB.width - margin.left - margin.right,
    height = charwrapperBB.height - margin.top - margin.bottom;

    
    // CHART
    
    var chart = d3.select(".chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
        
    chart.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "white");
    
    chart.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        
    // Y SCALE
        
    y_scale = d3.scaleBand()
      .range([xAxisTopHeight, height - xAxisBottomHeight])
      .paddingInner(0.3)
      .paddingOuter(0.4);
    
    y_scale.domain(data.q_ids);
    
    
    // Y AXIS
    
    var yAxisScale = y_scale.copy();
    
    yAxisScale.domain(data.shorttexts);
    
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
    

    // X SCALE

    x_scale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width - yAxisWidth]);
      
      
    // X AXIS TOP
    
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
        .text(data.usertexts.listXAxisDescription);
    
        
    // X AXIS BOTTOM
    
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
        .text(data.usertexts.listXAxisDescription);


    // BARS
    
    var bar = chart.selectAll(".bar")
      .data(data.q_ids)
    .enter().append("g")
      .attr("class", function (d, i) { return "bar q-" + d; })
      .attr("transform", function(d, i) { return "translate(" + (yAxisWidth + 1) + "," + y_scale(d) + ")"; });

    bar.append("rect")
      .attr("class", "barrect")
      .attr("id", function(d, i) { return "barrect-" + d; })
      .attr("height", y_scale.bandwidth())
      .style("fill", function(d, i) { return colorForValue(data.means[i][perspective_option], data.references[i], data.direction_map[data.q_ids[i]]); })
      .attr("width", function(d, i) { return x_scale(data.means[i][perspective_option]) + 1; })
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
      
    
    // REFERENCE LINE
    
    var referenceWidth = 2;
    var referenceExtraHeight = 4;
    var referenceHeight = y_scale.bandwidth() + referenceExtraHeight;
    var reference = chart.selectAll(".reference")
      .data(data.q_ids)
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
      .attr("transform", function(d, i) { return "translate(" + (yAxisWidth + x_scale(data.reference_map[d]) - referenceWidth/2) + "," + (y_scale(d) - referenceExtraHeight/2) + ")"; })
      .style("shape-rendering", "crispEdges");

    reference.append("rect")
      .attr("width", referenceWidth)
      .attr("height", referenceHeight);     
      q
    // invisible rect for mouseover 
    reference.append("rect")
      .attr("transform", "translate(-1, -1)")
      .attr("width", referenceWidth + 2)
      .attr("height", referenceHeight + 2)
      .attr("opacity", "0");  


      
    // HEADER
    
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
    
          
    // DESCRIPTION
    // populate the description box
    setDescription(lastHoveredBar);
    
    
    // GENERAL STYLE
    
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
  
  exports.updateSelecterOption = function(selected_perspective_option) {
    perspective_option = selected_perspective_option;
    
    var bar = d3.selectAll(".barrect")
      .transition()
        .duration(barTransitionTime)
        .ease(d3.easeLinear)
        .style("fill", function(d, i) { return colorForValue(data.means[i][perspective_option], data.references[i], data.direction_map[data.q_ids[i]]); })
        .attr("width", function(d, i) { return x_scale(data.means[i][perspective_option]) + 1; });
    
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

    img.onload = function(){
      var canvas_chart_selection = d3.select('body').append('canvas')
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .style("visibility", "hidden");
      var canvas_chart = canvas_chart_selection.node();
      
      var chart_ctx = canvas_chart.getContext('2d');
      chart_ctx.drawImage(img, 0, 0);
      
      var header_text = data.perspective_options[perspective_option];
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
      
      var source_text = data.usertexts.imageWaterStamp;
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
