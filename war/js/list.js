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
    var chartBB, xAxisTopHeight, xAxisBottomHeight, margin, width, height;
    var x_scale, y_scale;
    var yAxisWidth;
    
    var barTransitionTime = 300;
    var lastHoveredBar = 0;
    
    // FUNCTIONS

    function setToReferenceColor(i) {
      d3.select("barrect-" + i)
        .style("fill", colorForValue(data.reference_map[i], data.reference_map[i], data.direction_map[i]));
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
      if (direction == "low") {
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
      if (direction == "low") {
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
      if (direction == "low") {
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
      
      tooltipdiv.html(data.shorttexts[i] + ": <b>" + d3.format(".2s")(data.means[i][perspective_option]) + "</b><br>Referensvärde: <b>" + d3.format(".2")(data.references[i]) + "</b>")
        .style("background", colorHoverForValue(data.means[i][perspective_option], data.references[i], data.direction_map[data.q_ids[i]]))
        .style("left", (chartBB.left + x_scale(Math.max(data.means[i][perspective_option], data.references[i])) + yAxisWidth + 14) + "px")   
        .style("top", chartBB.top +  y_scale(data.q_ids[i]) + y_scale.bandwidth()/2 - tooltipdiv.node().getBoundingClientRect().height/2 + "px");
      
      var arrowleft = d3.select(".arrow-left");
      
      arrowleft.transition()    
        .duration(200)    
        .style("opacity", 1);    
      
      arrowleft
        .style("border-right-color", colorHoverForValue(data.means[i][perspective_option], data.references[i], data.direction_map[data.q_ids[i]]))
        .style("left", (chartBB.left + x_scale(Math.max(data.means[i][perspective_option], data.references[i])) + yAxisWidth + 4) + "px")   
        .style("top", chartBB.top +  y_scale(data.q_ids[i]) + y_scale.bandwidth()/2 - arrowleft.node().getBoundingClientRect().height/2 + "px");
        
      var description = d3.select(".description");
      
      description.transition()
          .duration(0)
          .style("opacity", 1);
      
      var color = colorTextForValue(data.means[i][perspective_option], data.references[i], data.direction_map[data.q_ids[i]]);
      var header = "<b>" + data.shorttext_map[data.q_ids[i]] + ": " + d3.format(".2")(data.means[i][perspective_option]) + "</b><br>"
      var subheader = "<b>Referensvärde: " + d3.format(".2")(data.references[i]) + "</b><br>"; 
      
      
      var trueDiff = data.means[i][perspective_option] - data.references[i]; 
      if (data.direction_map[data.q_ids[i]] == "low") {
        var diff = data.references[i] - data.means[i][perspective_option]; 
      } else {
        var diff = trueDiff; 
      }
            
      if (diff < -5) {
        var subsubheader = "Sämre än referensgruppen";
      } else if (diff > 5) {
        var subsubheader = "Bättre än referensgruppen";
      } else {
        var subsubheader = "Jämförbart med referensgruppen";
      }
      
      subsubheader = "<span style=\"color: " + color + "; font-weight: bold\">" + subsubheader + ": " + d3.format("+.2")(trueDiff) + "</span></b><br><br>";
      
      description.html(header + subheader + subsubheader + data.description_map[data.q_ids[i]]);
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
      
    chartBB = d3.select(".chart-wrapper").node().getBoundingClientRect();
    
    
    xAxisTopHeight = 30,
    xAxisBottomHeight = 24,
    margin = {top: 0, right: 11, bottom: xAxisTopHeight + xAxisBottomHeight, left: 0},
    width = chartBB.width - margin.left - margin.right,
    height = chartBB.height - margin.top - margin.bottom;

      
    // DESCRIPTION DIV
    
    d3.select(".description") 
      .style("opacity", 0);  

      
    // CHART
    
    var chart = d3.select(".chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
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
        .text("Medelvärde på en skala 0-100, där 5 poäng eller mer anses vara en relevant/märkbar skillnad");
    
        
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
        .text("Medelvärde på en skala 0-100, där 5 poäng eller mer anses vara en relevant/märkbar skillnad");


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
      .attr("width", function(d, i) { return x_scale(data.references[i]) + 1; })
      .style("fill", function(d, i) { return colorForValue(data.references[i], data.references[i], data.direction_map[data.q_ids[i]]); })
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
    .transition()
      .duration(barTransitionTime)
      .ease(d3.easeLinear)
      .style("fill", function(d, i) { return colorForValue(data.means[i][perspective_option], data.references[i], data.direction_map[data.q_ids[i]]); })
      .attr("width", function(d, i) { return x_scale(data.means[i][perspective_option]) + 1; });
      
    
    // REFERENCE LINE
    
    var referenceWidth = 4;
    var referenceExtraHeight = 4;
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
      .attr("transform", function(d, i) { return "translate(" + (yAxisWidth + x_scale(data.reference_map[d]) - referenceWidth/2) + "," + (y_scale(d) - referenceExtraHeight/2) + ")"; });

    reference.append("rect")
      .attr("width", referenceWidth/2)
      .attr("height", y_scale.bandwidth() + referenceExtraHeight);      

      
    // HEADER
    
    var header_select = d3.select(".header-select");
    var bar_area_width = (width - yAxisWidth);
    var select_width = header_select.node().getBoundingClientRect().width;
    header_select
      .style("margin-left", yAxisWidth + bar_area_width/2 - select_width/2 + "px");
      
      
    // TOOLTIP DIV
    
    /* only populate the description box, nothing visual */
    tooltipOver(0);
    tooltipOut();
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
  
})(window);
