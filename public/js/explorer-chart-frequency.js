(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.frequency = namespace.chart.frequency || {}
  const exports = namespace.chart.frequency

  // CONSTANTS
  var chartHeight = 350

  var primaryColors // TODO unused: , hoverColors
  var missingDataColor = d3.hsl('#BBB')
  var yAxisWidth, xAxisHeight, margin, width, height // TODO unused: , chartwrapperBB
  var chart, chartG

  // INITIALIZE STATIC RESOURCES
  var usertexts
  var questionMap
  // TODO
  // for (var i=0; i < questions.length; i ++) {
  //   var q = questions[i];
  //   questionMap[q.column] = q;
  // }

  var percentageFormat = d3.format('.0%')

  // INSTANCE SPECIFIC VARIABLES
  var question, perspective, timepoints, data
  var selectedPerspectiveOptionIndices, selectedPerspectiveOptions, optionKeys
  var selectedTimepoint, highlightedQuestionOption, highlightedPerspectiveOption
  var hasMissingData
  var tpWidths, tpWidthsAdditive
  var x, y, z

  // EXPORTED FUNCTIONS
  exports.generateChart = function (usertextsInput, questionMapInput, primaryColorsInput, hoverColorsInput, stat, selectedPerspectiveOptionIndicesInput, selectedTimepointInput) {
    usertexts = usertextsInput
    questionMap = questionMapInput
    // TODO initialize once, not every time
    primaryColors = primaryColorsInput
    // TODO unused: hoverColors = hoverColorsInput

    selectedPerspectiveOptionIndices = selectedPerspectiveOptionIndicesInput

    perspective = stat.p
    question = stat.q
    timepoints = questionMap[question].timepoints
    hasMissingData = false

    optionKeys = questionMap[question].options.slice()
    optionKeys.push('MISSING_DATA')

    selectedPerspectiveOptions = []
    selectedPerspectiveOptionIndices.forEach(function (i) {
      selectedPerspectiveOptions.push(questionMap[perspective].options[i])
    })

    data = {}
    for (var tpIndex = 0; tpIndex < timepoints.length; tpIndex++) {
      var tp = timepoints[tpIndex]
      var perspectiveOptions = questionMap[perspective].options
      var currentTimeData = stat.freq[tp]
      var tpData = []

      selectedPerspectiveOptionIndices.forEach(function (i) {
        var total = currentTimeData[i].length > 0 ? currentTimeData[i].reduce(function (a, b) { return a + b }) : 0
        var stackData = {
          __option: perspectiveOptions[i],
          __total: total,
          __timepoint: timepoints[tpIndex],
        }

        if (total === 0) {
          hasMissingData = true
          stackData.MISSING_DATA = 1
        } else {
          for (var j = 0; j < optionKeys.length; j++) {
            stackData[optionKeys[j]] = total !== 0 ? currentTimeData[i][j] / total : 0
          }
        }
        tpData.push(stackData)
      })
      data[tp] = tpData
    }

    z = d3.scaleOrdinal()
      .range(primaryColors)
      // .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    z.domain(optionKeys)

    selectedTimepoint = selectedTimepointInput

    // TODO this is completely recalculated in updateFreqChartSize, should not be needed
    computeDimensions(600, chartHeight) // 600 is an arbitrary number which is overwritten later
    generateChartElements()
    calculateTPWidths()
    // updateChartElements();
    daxplore.chart.frequency.updateSize(chartHeight)
  }

  exports.updateSize = function (heightTotal) {
    // 2. width for chart to use is max of:
    // a. room remaining of window width after QP, SA, margins, (scroll bar?)
    // b. max of
    // b.1 room required by header block
    // b.2 room required by bottom block
    // 3. calculate min width needed to draw chart
    // 4. if allocated space in 2. < need in 3.
    // then: set scroll area width to 2., chart to 3., wrap and scroll
    // else: set chart to 2, no scroll

    var availableWidth = document.documentElement.clientWidth - // window width
              d3.select('.question-panel').node().offsetWidth - // tree sidebar
              5 - // tree margin (if changed here, needs to be changed in css)
              d3.select('.sidebar-column').node().offsetWidth - // right sidebar
              2 - // border of 1px + 1px (if changed here, needs to be changed in css)
              1 // 1px fudge
    // TODO - scrollbar width?

    var headerBlockWidth = d3.select('.daxplore-ExternalHeader').node().offsetWidth
    var bottomBlockWidth = d3.select('.perspective-panel').node().offsetWidth
    var description = d3.select('.description-panel').node()
    if (description != null && description.offsetWidth > 0) {
      bottomBlockWidth += 250 // TODO hard coded
    }
    var topBotNeededWidth = Math.max(headerBlockWidth, bottomBlockWidth)

    var widthForChart = Math.max(availableWidth, topBotNeededWidth)

    // heuristically calculate width needed to display chart without internal overlap
    var yAxis = 31 // could be calculated?
    var outsideMargin = 24 // could be calculated?
    var innerMarginBars = 25 // could be calculated?
    var innerMarginTexts = 15
    var selectedTimepointCount = timepoints.length
    var minWidthPerTimepoint = 32
    var selectedPerspectiveOptionCount = selectedPerspectiveOptions.length

    var longestPerspectiveOptionTextLength = 0
    d3.select('.frequency-x-axis').selectAll('text')
      .each(function () {
        if (this.getBBox().width > longestPerspectiveOptionTextLength) {
          longestPerspectiveOptionTextLength = this.getBBox().width
        }
      })

    var minWidthBasedOnBars = yAxis + outsideMargin * 2 + innerMarginBars * (selectedPerspectiveOptionCount - 1) +
                            (selectedTimepointCount * minWidthPerTimepoint) * selectedPerspectiveOptionCount

    var minWidthBasedOnTickTexts = yAxis + outsideMargin * 2 + innerMarginTexts * (selectedPerspectiveOptionCount - 1) +
                            longestPerspectiveOptionTextLength * selectedPerspectiveOptionCount

    var chartNeededWidth = Math.max(minWidthBasedOnBars, minWidthBasedOnTickTexts)

    var lockWidth = widthForChart < chartNeededWidth
    var chartWidth
    if (lockWidth) {
      chartWidth = chartNeededWidth
    } else {
      chartWidth = widthForChart
    }
    d3.select('.chart')
      .classed('chart-scroll', lockWidth)
      .style('width', function () { return lockWidth ? widthForChart + 'px' : null })

    computeDimensions(chartWidth, heightTotal)

    chart
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    updateChartElements()
  }

  exports.generateLegend = function () {
    // GENERATE LEGEND
    var legend = d3.select('.legend')
      .style('margin-top', (height / 2) + 'px')
      .style('margin-left', '4px')

    legend.html('')

    var rows = [].concat(questionMap[question].options).reverse()

    // Add legend options
    legend.selectAll('.legend-row')
      .data(rows)
      .enter()
        .append('div')
        .attr('class', function (d) { return 'legend-row legend-row-' + d.index })
        .html(function (option) {
          return "<span class='legend-marker' style='background-color: " +
                  z(option) + ";'>&nbsp</span>" +
                  "<span class='legend-text'>" + option + '</span>'
        })
    // TODO mouseover legend effect
    // .on("mouseover",
    //   function(d) {
    //     tooltipOver(d.index);
    //     fadeOthers(d.index);
    // })
    // .on("mouseout",
    //   function(d) {
    //     tooltipOut();
    //     unfadeAll();
    // });

    if (hasMissingData) {
      legend.append('div')
          .attr('class', 'legend-row legend-row-missing-data')
          .html("<span class='legend-marker' style='background-color: " +
                 missingDataColor + ";'>&nbsp</span>" +
                 "<span class='legend-text'>" + 'Data saknas' + '</span>') // TODO externalize text
    }

    updateStyles()
  }

  // INTERNAL FUNCTIONS

  function updateChartElements () {
    // UPDATE X-AXIS
    x = d3.scaleBand()
      .rangeRound([0, width])
      .paddingInner(0.1)
      .paddingOuter(0.07)
      .domain(selectedPerspectiveOptions)

    var xAxis = d3
      .axisBottom(x)
      .tickSize(41)

    d3.select('.frequency-x-axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)

    // UPDATE Y AXIS
    y = d3.scaleLinear()
      .rangeRound([height - 2, 0])
      .domain([0, 1])

    var yAxisY = d3.scaleLinear()
      .rangeRound([height, 0])
      .domain([0, 1])

    var yAxis = d3.axisLeft(yAxisY)
      .tickFormat(d3.format('.0%'))
      .tickSize(0)
      .tickSizeInner(width)

    d3.select('.frequency-y-axis')
      .attr('transform', 'translate(' + width + ',0)')
      .call(yAxis)

    for (var tpIndex = timepoints.length - 1; tpIndex >= 0; tpIndex--) {
      var tp = timepoints[tpIndex]
      var tpData = data[tp]

      var freqBars = chartG
       .selectAll('.freq-bar-' + tp)
       .data(d3.stack().keys(optionKeys)(tpData))
       .enter().append('g')
         .classed('freq-bar-' + tp, true)
         .attr('transform', function (d, i) {
           return 'translate(0,' + 1.5 + ')'
         })

      freqBars.selectAll('.freq-bar-section-' + tp)
        .data(function (d) {
          return d.map(function (v) {
            return { start: v[0], end: (isNaN(v[1]) ? v[0] : v[1]), key: d.key, option: v.data.__option, timepoint: tp }
          })
        })
        .enter().append('rect')
          .classed('freq-bar-section-' + tp, true)

      d3.selectAll('.freq-bar-section-' + tp)
        .attr('x', function (d) { return x(d.option) })
        .attr('y', function (d) { return y(d.end) })
        .attr('height', function (d) { return y(d.start) - y(d.end) })
        .attr('width', tpWidthsAdditive[tpIndex] * x.bandwidth())
        .attr('fill', function (d) { return barFillColor(d.key, tpIndex) })
        .attr('stroke', function (d) { return barStrokeColor(d.key, tpIndex) })
        .attr('stroke-width', 1)
        .on('mouseover', function (d) {
          highlightedQuestionOption = d.key
          highlightedPerspectiveOption = d.option
          setSelectedTimepoint(d.timepoint)
          var percentage = d.end - d.start
          var timepointText = usertexts['timepoint' + d.timepoint]
          if (d.key !== 'MISSING_DATA') {
            d3.select('.daxplore-ExternalHeader-freq-tooltip')
              .text(percentageFormat(percentage) + ' av gruppen "' + d.option + '" svarade "' + d.key + (timepoints.length >= 2 ? '" år ' + timepointText : '') + '.') // TODO externalize text
              .style('color', barStrokeColor(d.key, tpIndex).darker(0.5))
          } else if (percentage > 0) {
            d3.select('.daxplore-ExternalHeader-freq-tooltip')
              .text('Data saknas, färre än 10 deltagare i gruppen "' + d.option + '" svarade år ' + timepointText + '.') // TODO externalize text
              .style('color', '#555')
          }
        })
        .on('mouseout', function (d) {
          highlightedQuestionOption = d.key
          highlightedPerspectiveOption = d.option
        })

      // barSections.append("text")
      //   .classed("freq-bar-section-text-" + tpIndex, true)
      //   .attr("font-size", function(d) {
      //     var height = 15;
      //     if (y(d.start)-y(d.end) < height - 2) {
      //       height = y(d.start)-y(d.end) - 2;
      //     }
      //     if (height < 0) {
      //       height = 0;
      //     }
      //     return height + "px";
      //   })
      //   .text(function(d) {
      //     return d.key != "MISSING_DATA" ? "99%" : ""
      //   })
      //   .attr("x", function(d) { return x(d.option) + tpWidthsAdditive[tpIndex] * x.bandwidth(); })
      //   .attr("y", function(d) {
      //     var fontSize = d3.select(this).attr("font-size").replace("px","");
      //     return y(d.end) + (y(d.start) - y(d.end))/2 + fontSize/2 ;
      //    });

      // console.log(timepoints);
      chartG.selectAll('.freq-bar-timetick-wrapper-' + tp)
        .data(selectedPerspectiveOptions)
          .enter().append('g')
            .classed('freq-bar-timetick-wrapper-' + tp, true)
            .append('text')
              .classed('freq-bar-timetick-' + tp, true)
              .text(usertexts['timepoint' + tp])
    }
    setSelectedTimepoint(selectedTimepoint, true)
    updateStyles()
  }

  function setSelectedTimepoint (selectedTimepointInput, instantAnimation = false) {
    // TODO unused:
    // var timepointChanged = selectedTimepoint !== selectedTimepointInput
    selectedTimepoint = selectedTimepointInput
    calculateTPWidths(selectedTimepoint)
    var transitionTime = instantAnimation ? 0 : 300

    for (var tpIndex = 0; tpIndex < timepoints.length; tpIndex++) {
      var tp = timepoints[tpIndex]

      d3.selectAll('.freq-bar-section-' + tp)
        .transition()
          .duration(transitionTime) // TODO figure out fast mouseover animation for color while keeping width transition
          .attr('width', tpWidthsAdditive[tpIndex] * x.bandwidth())
          .attr('fill', function (d) {
            var darken = 0
            if (highlightedQuestionOption === d.key &&
                selectedTimepoint === tp &&
                highlightedPerspectiveOption === d.option) {
              darken = 0.1
            }
            return barFillColor(d.key, tpIndex).darker(darken)
          })
          .attr('stroke', function (d) { return barStrokeColor(d.key, tpIndex) })

      // d3.selectAll(".freq-bar-section-text-" + tp)
      //   .transition()
      //     .duration(transitionTime)
      //       .attr("x", function(d) { return x(d.option) + (tpWidthsAdditive[tpIndex] - tpWidths[tpIndex]) * x.bandwidth() + 5 })
      //       .attr("opacity", tp === selectedTimepoint ? 1 : 0);

      d3.selectAll('.freq-bar-timetick-wrapper-' + tp)
        .transition()
          .duration(transitionTime)
            .attr('transform', function (d) {
              var xPos = x(d) + (tpWidthsAdditive[tpIndex] - tpWidths[tpIndex] / 2) * x.bandwidth()
              var yPos = height + 15
              return 'translate(' + xPos + ',' + yPos + ')'
            })

      d3.selectAll('.freq-bar-timetick-' + tp)
        .transition()
          .duration(transitionTime)
            .style('transform', function (d) {
              if (tp < selectedTimepoint) {
                return 'translate(-14px, 19px) rotate(-45deg)'
              } else if (tp > selectedTimepoint) {
                return 'translate(-8px, 0px) rotate(45deg)'
              }
              return 'translate(-13px, 4px) rotate(0deg)'
            })
            .style('fill', tp === selectedTimepoint ? 'black' : '#555')
    }
  }

  function barFillColor (key, tpIndex) {
    var asymptoticLightnessTarget = 0.8
    var lightnessDropoffRate = 1.3
    var selectedTPIndex = timepoints.indexOf(selectedTimepoint)
    if (key === 'MISSING_DATA') {
      var color = missingDataColor
    } else {
      color = d3.hsl(z(key)).darker(0.3)
    }
    var lightness = color.l
    var targetDiff = asymptoticLightnessTarget - lightness
    color.l = lightness + targetDiff - (targetDiff) / Math.pow(lightnessDropoffRate, Math.abs(selectedTPIndex - tpIndex))

    var asymptoticSaturationTarget = 0.25
    var saturationDropoffRate = 1.5
    var saturation = color.s
    targetDiff = saturation - asymptoticSaturationTarget
    color.s = saturation - targetDiff + (targetDiff) / Math.pow(saturationDropoffRate, Math.abs(selectedTPIndex - tpIndex))

    return color
  }

  function barStrokeColor (key, tpIndex) {
    return barFillColor(key, tpIndex).darker(0.8)
  }

  function calculateTPWidths () {
    tpWidths = []
    var selectedTPIndex = timepoints.indexOf(selectedTimepoint)
    // if (selectedTPIndex === -1) {
    //   console.log('Invalid selected tp.', 'question:', question, '/ perspective:', perspective, '/ selectedTimepoint:', selectedTimepoint)
    // }
    var unselectedSize = 0.4
    for (var tpIndex = 0; tpIndex < timepoints.length; tpIndex++) {
      tpWidths.push(selectedTPIndex - tpIndex === 0 ? 1 : unselectedSize)
    }
    // Adjust the widths so they sum up to 1
    var totalWidth = tpWidths.reduce(function (a, b) { return a + b })
    tpWidthsAdditive = []
    var widthSum = 0
    for (tpIndex = 0; tpIndex < timepoints.length; tpIndex++) {
      tpWidths[tpIndex] /= totalWidth
      widthSum += tpWidths[tpIndex]
      tpWidthsAdditive[tpIndex] = widthSum
    }
  }

  function computeDimensions (widthTotal, heightTotal) {
    yAxisWidth = 35
    xAxisHeight = 24
    margin = { top: 20, right: 13, bottom: xAxisHeight + 40, left: yAxisWidth + 10 }
    width = widthTotal - margin.left - margin.right
    height = heightTotal - margin.top - margin.bottom
  }

  function generateChartElements () {
    chart = d3.select('.chart').append('svg')
    chart
      .classed('frequency-chart', true)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    // WHITE BACKGROUND
    chart.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'white')

    // MARGIN ADJUSTED CHART ELEMENT
    chartG = chart.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    // Y AXIS
    chartG.append('g')
      .attr('class', 'axis frequency-y-axis')

    // X AXIS
    chartG.append('g')
      .attr('class', 'axis frequency-x-axis')

    updateStyles()
  }

  function updateStyles () {
    d3.selectAll('.axis .domain')
      .style('visibility', 'hidden')

    d3.selectAll('.axis path, .axis line')
      .style('fill', 'none')
      .style('stroke', '#bbb')
      .style('shape-rendering', 'geometricPrecision')

    d3.selectAll('text')
      .style('fill', '#555')
      .style('font', '12px sans-serif')
      .style('cursor', 'default')
  }
})(window.daxplore = window.daxplore || {})
