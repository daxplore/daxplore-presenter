(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.meantimeline = namespace.chart.meantimeline || {}
  const exports = namespace.chart.meantimeline

  const optionsMap = {}
  const timepointsMap = {}
  let chartSvg

  exports.generateChart = function (questions, selectedOptions, statJson) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      timepointsMap[q.column] = q.timepoints
      optionsMap[q.column] = q.options
    }

    const stat = JSON.parse(statJson)
    const perspective = stat.p
    // TODO unused
    // let question = stat.q

    const panel = d3.select('.line-chart-panel')
    //     if (typeof chartSvg == 'undefined') {
    chartSvg = panel.append('svg')
    //     } else {
    //       panel.append(chartSvg);
    //     }
    //     let g = svg.append('g');

    const margin = { top: 10, right: 10, bottom: 10, left: 30 }
    //     let width = svg.attr("width") - margin.left - margin.right;
    //     let height = svg.attr("height") - margin.top - margin.bottom;
    const width = 600
    const height = 300
    chartSvg.attr('width', (width + margin.left + margin.right) + 'px')
    chartSvg.attr('height', (height + margin.top + margin.bottom + 20) + 'px')

    const g = chartSvg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    // TODO check actually delivered time points in statJson data?
    // TODO generate timepoint texts in daxplore export file to experiment with that as an array here
    // console.log(timepointsMap[perspective])
    const x = d3.scaleBand()
      .range([0, width])
      .paddingInner(0.3)
      .paddingOuter(0)
      .domain(timepointsMap[perspective])

    // TODO use a dynamic scale or min/max points set in producer
    const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, 10])

    const z = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(optionsMap[perspective])

    const line = d3.line()
      .curve(d3.curveLinear)
      .x(function (d) { return x(d.timepoint) + x.bandwidth() / 2 })
      .y(function (d) { return y(d.mean) })

    const options = []
    selectedOptions.forEach(function (i) {
      // TODO check actually delivered time points in statJson data?
      const values = []
      timepointsMap[perspective].forEach(function (timepoint) {
        values.push({
          timepoint: timepoint,
          mean: stat.mean[timepoint].mean[i],
          count: stat.mean[timepoint].count[i],
        })
      })
      options.push({
        id: optionsMap[perspective][i],
        values: values,
      })
    })

    const xAxis = d3.axisBottom(x)

    g.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)

    g.append('g')
        .attr('class', 'axis axis--y')
        .call(d3.axisLeft(y))
      .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '0.71em')
        .attr('fill', '#000')
        .text('')

    const option = g.selectAll('.option')
      .data(options)
      .enter().append('g')
        .attr('class', 'option')

    option.append('path')
      .attr('class', 'line')
      .attr('d', function (d) { return line(d.values) })
      .style('stroke', function (d) { return z(d.id) })

    // -----------------------------------------------------------------
    //   });

    //     g.append("g")
    //       .attr("class", "axis axis--x")
    //       .attr("transform", "translate(0," + height + ")")
    //       .call(d3.axisBottom(x));
    //
    //      console.log(options);
    //      console.log(timepointsMap);
    //
    //     let timepoints = timepointsMap[question];
    //
    //     let panel = d3.select('.line-chart-panel');
    // //     if (typeof chartSvg == 'undefined') {
    //       chartSvg = panel.append('svg');
    // //     } else {
    // //       panel.append(chartSvg);
    // //     }
    // //     let g = svg.append('g');
    //
    //     let margin = {top: 10, right: 10, bottom: 10, left: 30};
    // //     let width = svg.attr("width") - margin.left - margin.right;
    // //     let height = svg.attr("height") - margin.top - margin.bottom;
    //     let width = 600;
    //     let height = 300;
    //     chartSvg.attr('width', (width + margin.left + margin.right) + 'px');
    //     chartSvg.attr('height', (height + margin.top + margin.bottom + 20) + 'px');
    //
    //     let g = chartSvg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    //
    //     let pt = d3.timeParse("%d-%b-%y");
    //
    //     let data = [{date:pt("24-Apr-07"), close:Math.random()*100},
    //                 {date:pt("25-Apr-07"), close:Math.random()*100},
    //                 {date:pt("26-Apr-07"), close:Math.random()*100},
    //                 {date:pt("27-Apr-07"), close:Math.random()*100},
    //                 {date:pt("30-Apr-07"), close:Math.random()*100},
    //                 {date:pt("1-May-07"), close:Math.random()*100},
    //                 {date:pt("2-May-07"), close:Math.random()*100},
    //                 {date:pt("3-May-07"), close:Math.random()*100},
    //                 {date:pt("4-May-07"), close:Math.random()*100},
    //                 {date:pt("7-May-07"), close:Math.random()*100},
    //                 {date:pt("8-May-07"), close:Math.random()*100},
    //                 {date:pt("9-May-07"), close:Math.random()*100},
    //                 {date:pt("10-May-07"), close:Math.random()*100}];
    //
    //     let x = d3.scaleTime().rangeRound([0, width]);
    //     let y = d3.scaleLinear().rangeRound([height, 0]);
    //     let z = d3.scaleOrdinal(d3.schemeCategory10);
    //
    //     let line = d3.line()
    //       .x(function(d) { return x(d.date); })
    //       .y(function(d) { return y(d.close); });
    //
    //     x.domain(d3.extent(data, function(d) { return d.date; }));
    //     y.domain(d3.extent(data, function(d) { return d.close; }));
    //
    //     g.append("g")
    //         .attr("transform", "translate(0," + height + ")")
    //         .call(d3.axisBottom(x))
    //       .select(".domain")
    //         .remove();
    //
    //     g.append("g")
    //         .call(d3.axisLeft(y))
    //       .append("text")
    //         .attr("fill", "#000")
    //         .attr("transform", "rotate(-90)")
    //         .attr("y", 6)
    //         .attr("dy", "0.71em")
    //         .attr("text-anchor", "end")
    //         .text("Price ($)");
    //
    //     g.append("path")
    //       .datum(data)
    //       .attr("fill", "none")
    //       .attr("stroke", "steelblue")
    //       .attr("stroke-linejoin", "round")
    //       .attr("stroke-linecap", "round")
    //       .attr("stroke-width", 1.5)
    //       .attr("d", line);
  }

//   function insertChart() {
//     let lineChartArea = d3.select('.line-chart-panel');
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
//     let svg = d3.select("svg"),
//       margin = {top: 20, right: 80, bottom: 30, left: 50},
//       width = svg.attr("width") - margin.left - margin.right,
//       height = svg.attr("height") - margin.top - margin.bottom,
//       g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
//     let parseTime = d3.timeParse("%Y%m%d");
//
//     let x = d3.scaleTime().range([0, width]),
//         y = d3.scaleLinear().range([height, 0]),
//         z = d3.scaleOrdinal(d3.schemeCategory10);
//
//     let line = d3.line()
//       .curve(d3.curveBasis)
//       .x(function(d) { return x(d.date); })
//       .y(function(d) { return y(d.temperature); });
//
//     let cities = data.columns.slice(1).map(function(id) {
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
//     let city = g.selectAll(".city")
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
//       for (let i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
//       return d;
//     }
//   }
})(window.dax = window.dax || {})
