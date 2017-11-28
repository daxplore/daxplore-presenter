(function(exports) {
  
  var charwrapperBB, yAxisWidth, xAxisHeight, margin, width, height;
  var chart, chart_g;
    
  // INITIALIZE STATIC RESOURCES
  var dichselected_map = {};
  var options_map = {};
  var timepoints_map = {};
  
  for (var i=0; i < questions.length; i ++) {
    var q = questions[i];
    dichselected_map[q.column] = q.dichselected;
    options_map[q.column] = q.options;
    timepoints_map[q.column] = q.timepoints;
  }

  
  // FUNCTIONS
  
        
  // CHART ELEMENTS
  
  function computeDimensions() {
    charwrapperBB = d3.select(".line-chart-panel").node().getBoundingClientRect();
    yAxisWidth = 35;
    xAxisHeight = 24;
    margin = {top: 10, right: 13, bottom: xAxisHeight, left: yAxisWidth + 10};
    width = charwrapperBB.width - margin.left - margin.right;
    height = charwrapperBB.height - margin.top - margin.bottom;
    
    width = 600;
    height = 300;
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
  
  exports.generateDichTimeLineChart = function(selectedOptions, statJson) {
    // TODO initizalize once, not every time
    computeDimensions();
    generateChartElements();
    
    // PARSE DATA
    var stat = JSON.parse(statJson);
//     console.log(stat);
    var perspective = stat.p;
    var question = stat.q;
    
    //TODO check actually delivered time points in statJson data?
    //TODO generate timepoint texts in daxplore export file to experiment with that as an array here
    var options = [];
    selectedOptions.forEach(function(option) {
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
        id: options_map[perspective][option],
        values: values
      });
    });
    
    
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
    var z_scale_color = d3.scaleOrdinal(d3.schemeCategory20)
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
      
    options.forEach(function(option, i) {
      var color = z_scale_color(option.id);
      // Individual points
      var symbol = d3.symbol().size(40).type(d3.symbolCircle);
      chart_g.selectAll(".point.dataset-" + i)
          .data(option.values)
        .enter().append("path")
          .attr("class", "point dataset-" + i)
          .attr("fill", color)
          .attr("stroke", color)
          .attr("d", symbol())
          .attr("transform", function(d) {
            return "translate(" + (x_scale(d.timepoint) + x_bandwidth/2) + "," + y_scale(d.percentage) + ")";
          });

      // Connect the points with lines
      chart_g.append("path")
        .datum(option.values)
        .attr("class", "line dataset-" + i)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", "2")
        .attr("d", line);
    });

    updateStyles();
  }
})(window);
