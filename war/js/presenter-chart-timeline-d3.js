(function(exports) {
  var timepoints_map = {};
  
  for (var i=0; i < questions.length; i ++) {
    var q = questions[i];
    timepoints_map[q.column] = q.timepoints;
  }
  
  exports.generateTimeLineChart = function(statJson) {
    var stat = JSON.parse(statJson);
    var perspective = stat.p;
    var question = stat.q;
    
    console.log(stat);
    var timepoints = timepoints_map[question];

    timepoints.forEach(function(t) {
      
    });
   
//     var panel = d3.select('.line-chart-panel');
//     panel.html("");
    var panel = d3.select('.line-chart-panel').append('svg');
    var svg = panel.append('svg');
    var g = svg.append('g');

  }
  
//   function insertChart() {
//     var lineChartArea = d3.select('.line-chart-panel');
//     console.log('insert type', typeof lineChart);
// /*    
//     if (typeof lineChart === 'undefined') {
//       console.log('recurse');
//       window.setTimeout(insertChart(), 10);
//       return;
//     }
//     */
//     lineChartArea.innerHTML = 'timeline';
//   }
//     d3.select('.time-line-chart').node().innerHTML = 'timeline';
//     d3.select('.daxplore-ChartPanel').node().innerHTML = 'timeline';
// 
//     var svg = d3.select("svg"),
//       margin = {top: 20, right: 80, bottom: 30, left: 50},
//       width = svg.attr("width") - margin.left - margin.right,
//       height = svg.attr("height") - margin.top - margin.bottom,
//       g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
// 
//     var parseTime = d3.timeParse("%Y%m%d");
// 
//     var x = d3.scaleTime().range([0, width]),
//         y = d3.scaleLinear().range([height, 0]),
//         z = d3.scaleOrdinal(d3.schemeCategory10);
// 
//     var line = d3.line()
//       .curve(d3.curveBasis)
//       .x(function(d) { return x(d.date); })
//       .y(function(d) { return y(d.temperature); });
// 
//     var cities = data.columns.slice(1).map(function(id) {
//       return {
//         id: id,
//         values: data.map(function(d) {
//           return {date: d.date, temperature: d[id]};
//         })
//       };
//     });
// 
//     x.domain(d3.extent(data, function(d) { return d.date; }));
// 
//     y.domain([
//       d3.min(cities, function(c) { return d3.min(c.values, function(d) { return d.temperature; }); }),
//       d3.max(cities, function(c) { return d3.max(c.values, function(d) { return d.temperature; }); })
//     ]);
// 
//     z.domain(cities.map(function(c) { return c.id; }));
// 
//     g.append("g")
//       .attr("class", "axis axis--x")
//       .attr("transform", "translate(0," + height + ")")
//       .call(d3.axisBottom(x));
// 
//     g.append("g")
//         .attr("class", "axis axis--y")
//         .call(d3.axisLeft(y))
//       .append("text")
//         .attr("transform", "rotate(-90)")
//         .attr("y", 6)
//         .attr("dy", "0.71em")
//         .attr("fill", "#000")
//         .text("Temperature, ºF");
// 
//     var city = g.selectAll(".city")
//       .data(cities)
//       .enter().append("g")
//         .attr("class", "city");
// 
//     city.append("path")
//       .attr("class", "line")
//       .attr("d", function(d) { return line(d.values); })
//       .style("stroke", function(d) { return z(d.id); });
// 
//     city.append("text")
//       .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
//       .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")"; })
//       .attr("x", 3)
//       .attr("dy", "0.35em")
//       .style("font", "10px sans-serif")
//       .text(function(d) { return d.id; });
// 
//     function type(d, _, columns) {
//       d.date = parseTime(d.date);
//       for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
//       return d;
//     }
//   }
})(window);
