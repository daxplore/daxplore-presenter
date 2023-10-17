(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.meantimeline = namespace.chart.meantimeline || {}
  const exports = namespace.chart.meantimeline

  const optionsMap = {}
  const timepointsMap = {}
  let chartSvg

  exports.generateChart =
  function (questions, selectedOptions, statJson) {
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
  }
})(window.dax = window.dax || {})
