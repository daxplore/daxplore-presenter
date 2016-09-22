function generateListChart(data, questions) {
  // DATA
  
  var q_ids = [];
  
  var means = [];
  
  var references = [];
  var reference_map = {};
  
  for (var i = 0; i < data.length; i++) {
    var d = data[i];
    
    var q_id = d.q
    q_ids.push(q_id);
    
    var mean_total = d.mean["0"].all;
    means.push(mean_total);
    
    var global_reference_mean = d.mean["0"].global;
    references.push(global_reference_mean);
    reference_map[q_id] = global_reference_mean;
  }
  
  var shorttext_map = {};
  var description_map = {};
  var direction_map = {};

  for (var i=0; i < questions.length; i ++) {
    var q = questions[i];
    shorttext_map[q.column] = q.short;
    description_map[q.column] = unescape(q.description);
    
    if ("direction" in q) {
      direction_map[q.column] = q.direction;
    }
  }
  
  var shorttexts = q_ids.map(function(q) { return shorttext_map[q]; });
  
  
  // DEFINITIONS
    
  var chartBB = d3.select(".chart-wrapper").node().getBoundingClientRect();
  
  var
    xAxisTopHeight = 30,
    xAxisBottomHeight = 24,
    margin = {top: 0, right: 11, bottom: xAxisTopHeight + xAxisBottomHeight, left: 0},
    width = chartBB.width - margin.left - margin.right,
    height = chartBB.height - margin.top - margin.bottom;
    
  
  var colors = {};

  colors.good    = "hsl(95, 38%, 64%)";
  colors.average = "hsl(58, 60%, 62%)",
  colors.bad     = "hsl( 5, 38%, 72%)",
  
  colors.good_hover    = "hsl(95, 38%, 57%)";
  colors.average_hover = "hsl(60, 60%, 51%)",
  colors.bad_hover     = "hsl( 5, 38%, 67%)",
  
  colors.good_text    = "hsl(95, 38%, 34%)";
  colors.average_text = "hsl(60, 60%, 31%)",
  colors.bad_text     = "hsl( 5, 38%, 42%)",
  
  
  // FUNCTIONS

  function setToReferenceColor(q) {
    d3.select("barrect-" + q)
      .style("fill", colorForValue(reference_map[q], reference_map[q], direction_map[q]));
  }
  
  function setToNormalColor(i) {
    d3.select("#barrect-" + q_ids[i])
      .style("fill", colorForValue(means[i], references[i], direction_map[q_ids[i]]));
    d3.selectAll(".q-" + q_ids[i])
      .classed("bar-hover", false);
    d3.selectAll(".y.axis .tick")
      .classed("bar-hover", false);
  }
  
  function setToHoverColor(i) {
    d3.select("#barrect-" + q_ids[i])
      .style("fill", colorHoverForValue(means[i], references[i], direction_map[q_ids[i]]));
    d3.selectAll(".q-" + q_ids[i])
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
    tooltipdiv.transition()    
      .duration(200)    
      .style("opacity", 1);
    
    tooltipdiv.html(shorttexts[i] + ": <b>" + d3.format(".2s")(means[i]) + "</b><br>Referensvärde: <b>" + d3.format(".2")(references[i]) + "</b>")
      .style("background", colorHoverForValue(means[i], references[i], direction_map[q_ids[i]]))
      .style("left", (chartBB.left + x(Math.max(means[i], references[i])) + yAxisWidth + 14) + "px")   
      .style("top", chartBB.top +  y(q_ids[i]) + y.bandwidth()/2 - tooltipdiv.node().getBoundingClientRect().height/2 + "px");
      
    arrowleft.transition()    
      .duration(200)    
      .style("opacity", 1);    
    
    arrowleft
      .style("border-right-color", colorHoverForValue(means[i], references[i], direction_map[q_ids[i]]))
      .style("left", (chartBB.left + x(Math.max(means[i], references[i])) + yAxisWidth + 4) + "px")   
      .style("top", chartBB.top +  y(q_ids[i]) + y.bandwidth()/2 - arrowleft.node().getBoundingClientRect().height/2 + "px");
      
    description.transition()
      .duration(0)
      .style("opacity", 1);
    
    var color = colorTextForValue(means[i], references[i], direction_map[q_ids[i]]);
    var header = "<b>" + shorttext_map[q_ids[i]] + ": " + d3.format(".2")(means[i]) + "</b><br>"
    var subheader = "<b>Referensvärde: " + d3.format(".2")(references[i]) + "</b><br>"; 
    
    
    var trueDiff = means[i] - references[i]; 
    if (direction_map[q_ids[i]] == "low") {
      var diff = references[i] - means[i]; 
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
    
    description.html(header + subheader + subsubheader + description_map[q_ids[i]]);
  }
  
  function tooltipOut(i) {
    tooltipdiv.transition()    
      .duration(300)    
      .style("opacity", 0); 
      
    arrowleft.transition()    
      .duration(300)    
      .style("opacity", 0); 
  }
  
    
  // DESCRIPTION DIV
  
  var description = d3.select(".description") 
    .style("opacity", 0);  

    
  // CHART
  
  var chart = d3.select(".chart")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      
      
  // Y SCALE
      
  var y = d3.scaleBand()
    .range([xAxisTopHeight, height - xAxisBottomHeight])
    .paddingInner(0.3)
    .paddingOuter(0.4);
  
  y.domain(q_ids);
  
  
  // Y AXIS
  
  var yAxisScale = y.copy();
  
  yAxisScale.domain(shorttexts);
  
  var yAxis = d3.axisLeft()
    .tickSize(3)
    .scale(yAxisScale);
    
  var yAxisElement = chart.append("g")
    .attr("class", "y axis")
    .call(yAxis);
    
  var yAxisWidth = yAxisElement.node().getBBox().width;
  
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
        tooltipOut(i);
        setToNormalColor(i);
      });
  

  // X SCALE

  var x = d3.scaleLinear()
    .domain([0, 100])
    .range([0, width - yAxisWidth]);
    
    
  // X AXIS TOP
  
  var xAxisTop = d3.axisTop()
    .scale(x)
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
    .scale(x)
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

  var barTransition = d3.transition()
    .duration(500)
    .ease(d3.easeLinear);
  
  var bar = chart.selectAll(".bar")
    .data(q_ids)
  .enter().append("g")
    .attr("class", function (d, i) { return "bar q-" + d; })
    .attr("transform", function(d, i) { return "translate(" + (yAxisWidth + 1) + "," + y(d) + ")"; });

  bar.append("rect")
      .attr("id", function(d, i) { return "barrect-" + d; })
      .attr("height", y.bandwidth())
      .attr("width", function(d, i) { return x(references[i]) + 1; })
      .style("fill", function(d, i) { return colorForValue(references[i], references[i], direction_map[q_ids[i]]); })
      .on("mouseover",
        function(d, i) {
          tooltipOver(i);
          setToHoverColor(i); 
        })
      .on("mouseout",
        function(d, i) {
          tooltipOut(i);
          setToNormalColor(i);
        })
    .transition(barTransition)
      .style("fill", function(d, i) { return colorForValue(means[i], references[i], direction_map[q_ids[i]]); })
      .attr("width", function(d, i) { return x(means[i]) + 1; });
    
  
  // REFERENCE LINE
  
  var referenceWidth = 4;
  var referenceExtraHeight = 4;
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
          tooltipOut(i);
          setToNormalColor(i);
        })
    .attr("transform", function(d, i) { return "translate(" + (yAxisWidth + x(reference_map[d]) - referenceWidth/2) + "," + (y(d) - referenceExtraHeight/2) + ")"; });

  reference.append("rect")
    .attr("width", referenceWidth/2)
    .attr("height", y.bandwidth() + referenceExtraHeight);      

    
  // HEADER
  
  var header_select = d3.select(".header-select");
  var bar_area_width = (width - yAxisWidth);
  var select_width = header_select.node().getBoundingClientRect().width;
  header_select
    .style("margin-left", yAxisWidth + bar_area_width/2 - select_width/2 + "px");
    
    
  // TOOLTIP DIV
  
  var tooltipdiv = d3.select(".chart-wrapper").append("div") 
    .attr("class", "tooltip")       
    .style("opacity", 0);
    
  var arrowleft = d3.select(".chart-wrapper").append("div") 
    .attr("class", "arrow-left")       
    .style("opacity", 0);
    
    /* only populate the description box, nothing visual */
    tooltipOver(0);
    tooltipOut(0);
}
