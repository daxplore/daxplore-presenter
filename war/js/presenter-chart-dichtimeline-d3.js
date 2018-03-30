(function(exports) {
  
  var chartwrapperBB, yAxisWidth, xAxisHeight, margin, width, height;
  var chart, chart_g;
    
  // INITIALIZE STATIC RESOURCES
  var dichselected_map = {};
  var options_map = {};
  var timepoints_map = {};
  var percentage_format = d3.format(".0%");
  
  for (var i=0; i < questions.length; i ++) {
    var q = questions[i];
    dichselected_map[q.column] = q.dichselected;
    options_map[q.column] = q.options;
    timepoints_map[q.column] = q.timepoints;
  }
  
  var pointSymbol = d3.symbol().type(d3.symbolCircle);
  var pointSize = 40;
  var pointFocusSize = 550;
  
  var fade_transition = d3.transition()
      .duration(300)
      .ease(d3.easeLinear);
  

  // INSTANCE SPECIFIC VARIABLES
  
  var lineColors, hoverColors;
  var question, perspective;
  var current_options;
  var z_scale_color;
  
  // FUNCTIONS
  
  function fadeOthers(focused_index) {
    unfadeAll();
    for (var i=0; i<current_options.length; i++) {
        var option_index = current_options[i].index;
        
        var row = d3.select(".dich-legend-row-" + option_index);
        row.interrupt().selectAll('*').interrupt();
        
        var lineMain = d3.selectAll(".line.dataset-" + option_index);
        lineMain.interrupt().selectAll('*').interrupt();
       
        var pointMain = d3.selectAll(".dich-point.dataset-" + option_index);
        pointMain.interrupt().selectAll('*').interrupt();
        
        if (option_index != focused_index) {
          row.transition(fade_transition)
            .style("opacity", 0.6);
          
          lineMain.transition(fade_transition)
            .attr("opacity", 0.3);
            
          pointMain.transition(fade_transition)
            .attr("opacity", 0.3);
        } else {
          row.style("opacity", 1);
          lineMain.attr("opacity", 1);
          pointMain.attr("opacity", 1);
        }
    }
  }

  function unfadeAll() {
    for (var i=0; i<current_options.length; i++) {
      var option_index = current_options[i].index;
      var row = d3.select(".dich-legend-row-" + option_index);
      row.interrupt().selectAll('*').interrupt();
      row
        .transition(fade_transition)
        .style("opacity", 1);
    }
    var lineMain = d3.selectAll(".line");
    lineMain.interrupt().selectAll('*').interrupt();
    lineMain
        .transition(fade_transition)
        .attr("opacity", 1);
        
    var pointMain = d3.selectAll(".dich-point");
    pointMain.interrupt().selectAll('*').interrupt();
    pointMain
        .transition(fade_transition)
        .attr("opacity", 1);
  }
  
  function tooltipOver(focused_index) {
    tooltipOut();
    var tooltips = d3.selectAll(".point-tooltip-" + focused_index);
    tooltips.interrupt().selectAll('*').interrupt();
    tooltips.style("display", "block");
//     tooltips.transition(fade_transition)
//       .style("opacity", 1);
    
//     var symbol = d3.symbol().type(d3.symbolCircle);
//     var points = d3.selectAll(".dich-point.dataset-" + focused_index);
// //     points.interrupt().selectAll('*').interrupt();
// //     points.attr("d", symbol.size(64));
// //     console.log(points);
//     points
// //       .transition().duration(100)
//       .attr("d", symbol.size(500));
// //     path.attr("d", symbol.size(64));
// 
// //     points.transition().duration(1000).attr("d", symbol.size(550));
// //     points.transition(fade_transition)
// //       .attr("d", symbol.size(400));
    
    var lineCover = d3.selectAll(".line-cover.dataset-" + focused_index);
    lineCover
      .attr("opacity", "1");
    
    var pointMain = d3.selectAll(".dich-point-cover.dataset-" + focused_index);
    pointMain
      .attr("opacity", "1");
  }
  
  function tooltipOut() {
    var tooltips = d3.selectAll(".point-tooltip");
    tooltips.interrupt().selectAll('*').interrupt();
    tooltips.style("display", "none");
//     tooltips.transition(fade_transition)
//       .style("opacity", 0);
    
//     var symbol = d3.symbol().type(d3.symbolCircle);
//     var points = d3.selectAll(".dich-point");
// //     points.interrupt().selectAll('*').interrupt();
//     points.attr("d", symbol.size(pointSize));
//     
// //     var symbol = d3.symbol().size(40).type(d3.symbolCircle);
// //     var points = d3.selectAll(".dich-point");
// //     points.interrupt().selectAll('*').interrupt();
// //     points.transition(fade_transition)
// //       .attr("d", symbol.size(pointSize));
    
    var lineCover = d3.selectAll(".line-cover");
    lineCover
      .attr("opacity", "0");
    
    var pointMain = d3.selectAll(".dich-point-cover");
    pointMain
      .attr("opacity", "0");
  }

  
  function computeDimensions(width_total, height_total) {
    yAxisWidth = 35;
    xAxisHeight = 24;
    margin = {top: 10, right: 13, bottom: xAxisHeight, left: yAxisWidth + 10};
    width = width_total - margin.left - margin.right;
    height = height_total - margin.top - margin.bottom;
  }
  
  function generateChartElements() {
    // CHART
    chart = d3.select(".line-chart-panel").append("svg");
    chart
      .classed("dich-line-chart", true)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
    
    // WHITE BACKGROUND
    chart.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "white");
      
    // MARGIN ADJUSTED CHART ELEMENT
    chart_g = chart.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
    // Y AXIS
    yAxisElement = chart_g.append("g")
      .attr("class", "axis dichtime-y-axis");

    // X AXIS
    chart_g.append("g")
      .attr("class", "axis dichtime-x-axis");
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
      .style("cursor", "default");
  }
  
  function updateChartElements() {
        // X SCALE
    var x_scale = d3.scaleBand()
      .range([0, width])
      .paddingInner(0.3)
      .paddingOuter(0)
      .domain(timepoints_map[perspective]);
      
    var x_bandwidth = x_scale.bandwidth();

      
    // Y SCALE
    // TODO use a dynamic scale or min/max points set in producer
    var y_scale = d3.scaleLinear()
      .range([height, 0])
      .domain([0, 1]);
    
      
    // Z SCALE
    // mapping selected options to colors
    z_scale_color = d3.scaleOrdinal(lineColors)
      .domain(options_map[perspective]);
      
    z_scale_hover_color = d3.scaleOrdinal(hoverColors)
      .domain(options_map[perspective]);
      
    var z_scale_symbol = d3
      .scaleOrdinal([d3.symbolCircle, d3.symbolDiamond, d3.symbolSquare, d3.symbolTriangle, d3.symbolStar, d3.symbolCross, d3.symbolWye])
      .domain(options_map[perspective]);

      
    // LINE TEMPLATE
    var line = d3.line()
      .curve(d3.curveLinear)
      .x(function(d) { return x_scale(d.timepoint) + x_scale.bandwidth()/2; })
      .y(function(d) {
        return y_scale(d.percentage);
      });
    
      
    // UPDATE X AXIS
    var xAxis = d3.axisBottom(x_scale)
      .tickFormat(function(d) {
        return usertexts["timepoint" + d];
      });

    var xAxisElement = d3.select(".dichtime-x-axis");
    
//     xAxisElement.interrupt().selectAll('*').interrupt();
    
    xAxisElement
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

      
    // UPDATE Y AXIS
    var yAxis = d3.axisLeft(y_scale)
      .tickFormat(d3.format(".0%"))
      .tickSize(0)
      .tickSizeInner(width);
      
    var yAxisElement = d3.select(".dichtime-y-axis");

    yAxisElement.interrupt().selectAll('*').interrupt();
    
    yAxisElement
      .attr("transform", "translate(" + width + ",0)")
      .call(yAxis);
      
    // UPDATE LINES
//     var option = chart_g.selectAll(".option")
//       .data(options)
//       .enter().append("g")
//         .attr("class", "option");
// 
//     option.append("path")
//       .attr("class", "line")
//       .attr("d", function(d) {
//         return line(d.values);
//       })
//       .style("stroke", function(d) { return z_scale_color(d.id); });
      
//     current_options.forEach(function(option) {
//       var color = z_scale_color(option.id);
//       var hover_color = z_scale_hover_color(option.id);
//       
      
    // Connect the points with lines
//       chart_g.append("path")
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
    current_options.forEach(function(option) {
      var color = z_scale_color(option.id);
      d3.select(".line.dataset-" + option.index).remove();
      chart_g.append("path")
        .datum(option.values)
        .attr("class", "line dataset-" + option.index)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", "3")
        .attr("d", line)
        .on("mouseover",
          function(d) {
            tooltipOver(option.index);
            fadeOthers(option.index)
        })
        .on("mouseout",
          function(d) {
            tooltipOut();
            unfadeAll();
        });
    });
        
      // Individual points
    current_options.forEach(function(option) {
      var color = z_scale_color(option.id);
      chart_g.selectAll(".dich-point.dataset-" + option.index)
        .data(option.values)
      .enter().append("path")
        .attr("class", "dich-point dataset-" + option.index)
        .attr("fill", color)
        .attr("stroke", color)
        .attr("d", pointSymbol.size(pointSize))
        .attr("transform", function(d) {
          return "translate(" + (x_scale(d.timepoint) + x_bandwidth/2) + "," + y_scale(d.percentage) + ")";
        })
        .on("mouseover",
          function(d) {
            tooltipOver(option.index);
            fadeOthers(option.index);
        })
        .on("mouseout",
          function(d) {
            tooltipOut();
            unfadeAll();
        });
        
      chart_g.selectAll(".dich-point.dataset-" + option.index)
        .attr("transform", function(d) {
          return "translate(" + (x_scale(d.timepoint) + x_bandwidth/2) + "," + y_scale(d.percentage) + ")";
        });
        
    });
      
    // Mouse over elements added later in order to cover underlying elements when highlighted
    current_options.forEach(function(option) {
      var color = z_scale_color(option.id);

      // Connect the points with lines
      d3.selectAll(".line-cover.dataset-" + option.index).remove();
      chart_g.append("path")
        .datum(option.values)
        .attr("class", "line-cover dataset-" + option.index)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", "3")
        .attr("opacity", "0")
        .attr("pointer-events", "none")
        .attr("d", line);
    });
    
    current_options.forEach(function(option) {
      var color = z_scale_color(option.id);
      // Individual points
      d3.selectAll(".dich-point-cover.dataset-" + option.index).remove();
      chart_g.selectAll(".dich-point-cover.dataset-" + option.index)
        .data(option.values)
      .enter().append("path")
        .attr("class", "dich-point-cover dataset-" + option.index)
        .attr("fill", color)
        .attr("stroke", color)
        .attr("d", pointSymbol.size(pointFocusSize))
        .attr("opacity", "0")
        .attr("pointer-events", "none");
        
      chart_g.selectAll(".dich-point-cover.dataset-" + option.index)
        .attr("transform", function(d) {
          return "translate(" + (x_scale(d.timepoint) + x_bandwidth/2) + "," + y_scale(d.percentage) + ")";
        });
    });

    current_options.forEach(function(option) {
      // Add tooltip divs
//       var dichWrapper = d3.select(".dich-line-chart").node().getBoundingClientRect();
//         var xAxisStart = d3.select(".dichtime-x-axis").node().getBoundingClientRect().x;
      d3.selectAll(".point-tooltip-" + option.index).remove();
      chart_g.selectAll(".point-tooltip-" + option.index)
        .data(option.values)
        .enter().append("text")
          .attr("class", "point-tooltip point-tooltip-" + option.index)
          .text(function (d) { return percentage_format(d.percentage)})
          .style("font-size", "10px")
          .on("mouseover",
            function(d) {
              tooltipOver(option.index);
              fadeOthers(option.index)
          })
          .on("mouseout",
            function(d) {
              tooltipOut();
              unfadeAll();
          });
          
      chart_g.selectAll(".point-tooltip-" + option.index)
          .attr("transform", function(d) {
            return "translate("
            + (x_scale(d.timepoint) + x_bandwidth/2 - this.getComputedTextLength()/2) + ","
            + (y_scale(d.percentage) + 3.5) + ")";
          })
          .style("display", "none");
    });
  }
  
  exports.generateDichTimeLineChart = function(selectedOptions, statJson, lineColors_input, hoverColors_input) {
    // TODO initizalize once, not every time
    lineColors = lineColors_input;
    hoverColors = hoverColors_input;
    computeDimensions(600, 300);
    generateChartElements();

    // PARSE DATA
    var stat = JSON.parse(statJson);
//     console.log(stat);
    perspective = stat.p;
    question = stat.q;
    
    //TODO check actually delivered time points in statJson data?
    //TODO generate timepoint texts in daxplore export file to experiment with that as an array here
    var options = [];
    selectedOptions.forEach(function(option, i) {
      var values = [];
      timepoints_map[perspective].forEach(function(t) {
        var timepoint = t;
        if (typeof stat.freq[t] != "undefined") {
          var freq = stat.freq[t][option];
          var selected = dichselected_map[question];
          var selected_count = 0;
          var total_count = 0;
          for (var i=0; i<freq.length; i++) {
            if (freq[i] > 0) {
              total_count += freq[i];
              for (var j=0; j<selected.length; j++) {
                if (i == selected[j]) {
                  selected_count += freq[i];
                }
              }
            }
          }
          if (total_count > 0) {
            values.push({
              timepoint: t,
              percentage: (selected_count / total_count),
              count: total_count
            });
          }
        }
      });
      options.push({
        index: option,
        id: options_map[perspective][option],
        values: values
      });
    });
    
    current_options = options;
    
    updateChartElements();

  }
  
  exports.generateDichTimeLineLegend = function() {
    // GENERATE LEGEND
    var legend = d3.select('.daxplore-ExternalLegend')
      .style("margin-top", (height/3) + "px")
      .style("margin-left", "4px");
      
    var option = legend.selectAll(".dich-legend-row")
      .data(current_options)
      .enter()
        .append("div")
        .attr("class", function(d) { return "dich-legend-row dich-legend-row-" + d.index; })
        .html(function(option) {
           return "<span class='dich-legend-marker' style='background-color: "
                  + z_scale_color(option.id) + ";'>&nbsp</span>"
                  + "<span class='dich-legend-text'>" + option.id + "</span>";
        })
      .on("mouseover",
        function(d) {
          tooltipOver(d.index);
          fadeOthers(d.index);
      })
      .on("mouseout",
        function(d) {
          tooltipOut();
          unfadeAll();
      });

    updateStyles();
  }
  
  exports.updateDichTimeLineChartSize = function(height_total) {
    var calcWidth = document.documentElement.clientWidth // window width
              - d3.select(".daxplore-QuestionPanel").node().offsetWidth // tree sidebar
              - 5 // tree margin (if changed here, needs to be changed in css)
              - d3.select(".daxplore-SidebarArea").node().offsetWidth // right sidebar
              - 2; // border of 1px + 1px (if changed here, needs to be changed in css)
    
    var headerBlockWidth = d3.select(".daxplore-ExternalHeader").node().offsetWidth;
    var bottomBlockWidth = d3.select(".daxplore-PerspectivePanel").node().offsetWidth;
    var description = d3.select(".daxplore-DescriptionPanelBottom").node();
    if (description != null) {
        bottomBlockWidth += description.offsetWidth;
    }
    var horizontalMinWidth = Math.max(headerBlockWidth, bottomBlockWidth);
    
    var calcWidth = Math.max(calcWidth, horizontalMinWidth);

    computeDimensions(calcWidth, height_total);

    chart
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
      
    updateChartElements();
  }
  
})(window);
