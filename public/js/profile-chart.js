(function (namespace) {
  namespace.profile = namespace.profile || {}
  const exports = namespace.profile

  var firstUpdate = true

  var qIDs, means, meanReferences, perspectiveOptions, usertexts, directions
  // TODO unused: descriptions
  var shorttexts // TODO initialize
  var selectedOption = 0
  var selectedQIDs = []
  var chartwrapperBB, xAxisTopHeight, xAxisBottomHeight, margin, width, height
  var xScale, yScale, yAxisElement, yAxisReferenceElement // TODO unused: chart
  var yAxisWidth

  var elementTransition = d3.transition()
      .duration(300)
      .ease(d3.easeLinear)

  var lastHoveredBar = 0

  // FUNCTIONS

  function getQid (i) {
    return selectedQIDs[i]
  }

  function getMean (i, selectedOption) {
    return means[qIDs.indexOf(getQid(i))][selectedOption]
  }

  function setToNormalColor (i) {
    d3.select('#barrect-' + getQid(i))
      .style('fill', daxplore.profile.colorForValue(getMean(i, selectedOption), meanReferences[getQid(i)], directions[getQid(i)]))
    d3.selectAll('.q-' + getQid(i))
      .classed('bar-hover', false)
    d3.selectAll('.y.axis .tick')
      .classed('bar-hover', false)
  }

  function setToHoverColor (i) {
    d3.select('#barrect-' + getQid(i))
      .style('fill', daxplore.profile.colorHoverForValue(getMean(i, selectedOption), meanReferences[getQid(i)], directions[getQid(i)]))
    d3.selectAll('.q-' + getQid(i))
      .classed('bar-hover', true)
    d3.selectAll('.y.axis .tick')
      .classed('bar-hover', function (d, index) { return i === index })
  }

  function tooltipOver (i) {
    computeDimensions()
    lastHoveredBar = i
    var tooltipdiv = d3.select('.tooltipdiv')

    tooltipdiv.transition()
      .duration(200)
      .style('opacity', 1)

    tooltipdiv.html(
      shorttexts[getQid(i)] + ': <b>' + d3.format('d')(getMean(i, selectedOption)) + '</b><br>' +
        usertexts.listReferenceValue + ': <b>' + d3.format('d')(meanReferences[getQid(i)]) + '</b>')
      .style('background', daxplore.profile.colorHoverForValue(getMean(i, selectedOption), meanReferences[getQid(i)], directions[getQid(i)]))
      .style('left', (chartwrapperBB.left + xScale(Math.max(getMean(i, selectedOption), meanReferences[getQid(i)])) + yAxisWidth + 14) + 'px')
      .style('top', chartwrapperBB.top + yScale(getQid(i)) + yScale.bandwidth() / 2 - tooltipdiv.node().getBoundingClientRect().height / 2 + 'px')

    var arrowleft = d3.select('.arrow-left')

    arrowleft.transition()
      .duration(200)
      .style('opacity', 1)

    arrowleft
      .style('border-right-color', daxplore.profile.colorHoverForValue(getMean(i, selectedOption), meanReferences[getQid(i)], directions[getQid(i)]))
      .style('left', (chartwrapperBB.left + xScale(Math.max(getMean(i, selectedOption), meanReferences[getQid(i)])) + yAxisWidth + 4) + 'px')
      .style('top', chartwrapperBB.top + yScale(getQid(i)) + yScale.bandwidth() / 2 - arrowleft.node().getBoundingClientRect().height / 2 + 'px')

    daxplore.profile.setDescriptionFull(d3.select('#chart-description'), perspectiveOptions[selectedOption], getQid(i), getMean(i, selectedOption))
  }

  function tooltipOut () {
    d3.select('.tooltipdiv')
      .transition()
        .duration(300)
        .style('opacity', 0)

    d3.select('.arrow-left')
      .transition()
        .duration(300)
        .style('opacity', 0)
  }

  // CHART ELEMENTS

  function computeDimensions () {
    var wrapperClientBB = d3.select('.chart-wrapper').node().getBoundingClientRect()
    chartwrapperBB = {}
    chartwrapperBB.left = wrapperClientBB.left + pageXOffset
    chartwrapperBB.top = wrapperClientBB.top + pageYOffset
    chartwrapperBB.width = wrapperClientBB.width
    chartwrapperBB.height = wrapperClientBB.height
    xAxisTopHeight = 30
    xAxisBottomHeight = 24
    margin = { top: 0, right: 13, bottom: xAxisTopHeight + xAxisBottomHeight, left: 0 }
    width = chartwrapperBB.width - margin.left - margin.right
    height = chartwrapperBB.height - margin.top - margin.bottom
  }

  function generateChartElements () {
    // CHART
    var chart = d3.select('.chart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    // WHITE BACKGROUND
    chart.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'white')

    // Y AXIS
    yAxisElement = chart.append('g')
      .classed('y', true)
      .classed('axis', true)

    yAxisReferenceElement = chart.append('g')
      .classed('y', true)
      .classed('axis', true)
      .style('opacity', 0)

    // X AXIS TOP
    chart.append('g')
      .attr('class', 'x axis top')
    .append('text')
      .classed('x-top-description', true)
      .text(usertexts.listXAxisDescription)

    // X AXIS BOTTOM
    chart.append('g')
      .attr('class', 'x axis bottom')
    .append('text')
      .attr('class', 'x-bottom-description')
      .attr('text-anchor', 'middle')
      .style('text-anchor', 'middle')
      .text(usertexts.listXAxisDescription)

    // TODO use Modernizr instead of IE-check
    // Hide save image button in IE11 because of a known svg bug
    // https://connect.microsoft.com/IE/feedbackdetail/view/925655
    var isIE11 = /Trident.*rv[ :]*11\./.test(navigator.userAgent)
    if (isIE11) {
      d3.selectAll('.save-image')
       .style('display', 'none')
    }
  }

  function updateChartElements () {
    if (firstUpdate) {
      var elTransition = d3.transition().duration(0)
    } else {
      elTransition = elementTransition
    }

    var chart = d3.selectAll('.chart')

    var paddingInner = 0.3
    var paddingOuter = 0.4
    var maxBandwidth = 50

    // rearranged equation from d3's source file band.js, ignoring the floor call
    // https://github.com/d3/d3-scale/blob/fd07dd8ceeaeaec612f675050ac134243b406f64/src/band.js#L26
    var yHeightWithMaxBand = Math.max(1, selectedQIDs.length - paddingInner + paddingOuter * 2) * maxBandwidth / (1 - paddingInner)

    var yStop = Math.min(height - xAxisBottomHeight, yHeightWithMaxBand + xAxisTopHeight)

    // CALCULATE Y SCALE
    yScale = d3.scaleBand()
      .range([xAxisTopHeight, yStop])
      .paddingInner(paddingInner)
      .paddingOuter(paddingOuter)
      .domain(selectedQIDs)

    // UPDATE Y AXIS
    var yAxisScale = yScale.copy()
    yAxisScale.domain(selectedQIDs.map(function (qID) { return shorttexts[qID] }))
    var yAxis = d3.axisLeft()
      .tickSize(3)
      .scale(yAxisScale)

    var oldYAxisWidth = Math.max(50, yAxisReferenceElement.node().getBBox().width)
    yAxisReferenceElement.call(yAxis)
    yAxisWidth = Math.max(50, yAxisReferenceElement.node().getBBox().width)

    if (firstUpdate) {
      oldYAxisWidth = yAxisWidth
    }

    yAxisElement.interrupt().selectAll('*').interrupt()

    yAxisElement
      .transition(elTransition)
        .attr('transform', 'translate(' + yAxisWidth + ', 0)')
        .call(yAxis)

    yAxisElement.selectAll('.y.axis text')
      .on('mouseover',
        function (d, i) {
          tooltipOver(i)
          setToHoverColor(i)
        })
      .on('mouseout',
        function (d, i) {
          tooltipOut()
          setToNormalColor(i)
        })

    // CALCULATE X SCALE
    xScale = d3.scaleLinear()
      .domain([0, 100]) // TODO define range in producer
      .range([0, width - yAxisWidth])

    // UPDATE X AXIS TOP
    var xAxisTop = d3.axisTop()
      .scale(xScale)
      .ticks(20, 'd')
      .tickSizeInner(0)

    var xAxisTopElement = d3.selectAll('g.x.axis.top')

    xAxisTopElement.interrupt().selectAll('*').interrupt()

    xAxisTopElement.transition(elTransition)
      .attr('transform', 'translate(' + yAxisWidth + ',' + xAxisTopHeight + ')')
      .call(xAxisTop)

    d3.selectAll('.x-top-description')
      .transition(elTransition)
        .attr('transform', 'translate(' + (width - yAxisWidth) / 2 + ', -20)')

    // UPDATE X AXIS BOTTOM
    var xAxisBottom = d3.axisBottom()
      .scale(xScale)
      .ticks(20, 'd')
      .tickSizeInner(-(yStop - xAxisTopHeight))

    var xAxisBottomElement = d3.selectAll('g.x.axis.bottom')

    xAxisBottomElement.interrupt().selectAll('*').interrupt()

    xAxisBottomElement.transition(elTransition)
      .attr('transform', 'translate(' + yAxisWidth + ',' + (yStop) + ')')
      .call(xAxisBottom)

    d3.selectAll('.x-bottom-description')
      .transition(elTransition)
      .attr('transform', 'translate(' + (width - yAxisWidth) / 2 + ', 28)')

    // BARS
    var bars = chart.selectAll('.bar')
      .data(selectedQIDs)

    // remove old bars
    bars.exit().remove()

    // add new bars
    bars.enter().append('g')
      .classed('bar', true)
      .attr('transform', function (d, i) { return 'translate(' + (oldYAxisWidth + 1) + ',' + yScale(d) + ')' })
      .append('rect')
        .classed('barrect', true)
        .attr('height', yScale.bandwidth())
        .style('fill', function (d, i) { return daxplore.profile.colorForValue(getMean(i, selectedOption), meanReferences[getQid(i)], directions[getQid(i)]) })
        .attr('width', function (d, i) { return firstUpdate ? xScale(getMean(i, selectedOption)) + 1 : 0 })
        .on('mouseover',
          function (d) {
            var i = selectedQIDs.indexOf(d)
            tooltipOver(i)
            setToHoverColor(i)
          })
        .on('mouseout',
          function (d) {
            var i = selectedQIDs.indexOf(d)
            tooltipOut()
            setToNormalColor(i)
          })

    // animate all bars into position
    bars = d3.selectAll('.bar')

    bars.interrupt().selectAll('*').interrupt()

    bars
      .transition(elTransition)
      .attr('transform', function (d, i) { return 'translate(' + (yAxisWidth + 1) + ',' + yScale(d) + ')' })

    bars.select('.barrect')
      .transition(elTransition)
        .style('fill', function (d, i) { return daxplore.profile.colorForValue(getMean(i, selectedOption), meanReferences[getQid(i)], directions[getQid(i)]) })
        .attr('height', yScale.bandwidth())
        .attr('width', function (d, i) { return xScale(getMean(i, selectedOption)) + 1 })

    // REFERENCE LINES
    var referenceWidth = 2
    var referenceExtraHeight = 4
    var referenceHeight = yScale.bandwidth() + referenceExtraHeight

    var references = chart.selectAll('.reference')
      .data(selectedQIDs)

    // remove old reference lines
    references.exit().remove()

    // add new reference lines
    references.enter().append('g')
      .classed('reference', true)
      .on('mouseover',
        function (d) {
          var i = selectedQIDs.indexOf(d)
          tooltipOver(i)
          setToHoverColor(i)
        })
      .on('mouseout',
        function (d) {
          var i = selectedQIDs.indexOf(d)
          tooltipOut()
          setToNormalColor(i)
        })
      .attr('transform', function (d, i) { return 'translate(' + (yAxisWidth + xScale(meanReferences[getQid(i)]) - referenceWidth / 2) + ',' + (yScale(d) - referenceExtraHeight / 2) + ')' })
      .style('shape-rendering', 'crispEdges')
      .append('rect')
        .classed('reference-line', true)
        .attr('width', referenceWidth)
        .attr('height', referenceHeight)
      .append('rect') // invisible rect for mouseover
        .classed('reference-line-box', true)
        .attr('transform', 'translate(-1, -1)')
        .attr('width', referenceWidth + 2)
        .attr('height', referenceHeight + 2)
        .attr('opacity', '0')

    // update all reference lines

    references = d3.selectAll('.reference')

    references.interrupt().selectAll('*').interrupt()

    references
      .transition(elTransition)
        .attr('transform', function (d, i) { return 'translate(' + (yAxisWidth + xScale(meanReferences[d]) - referenceWidth / 2) + ',' + (yScale(d) - referenceExtraHeight / 2) + ')' })

    references.select('.reference-line')
      .transition(elTransition)
        .attr('width', referenceWidth)
        .attr('height', referenceHeight)

    references.selectAll('.reference-line-box')
      .transition(elTransition)
      .attr('width', referenceWidth + 2)
      .attr('height', referenceHeight + 2)

    // repopulate the description box and reset the tooltip
    if (selectedQIDs.length > 0) {
      tooltipOver(Math.min(lastHoveredBar, selectedQIDs.length - 1))
    } else {
      d3.selectAll('#chart-description')
        .style('opacity', '0')
    }
    tooltipOut()

    // HEADER SELECT
    var headerSelectDiv = d3.select('.header-select-div')
    var headerSelect = d3.select('.header-select')

    var options = headerSelect.selectAll('option')
        .data(perspectiveOptions, function (d) { return d })

    options.exit().remove()

    options.enter()
      .append('option')
        .text(function (d) { return d })
        .attr('value', function (d, i) { return i })

    var barAreaWidth = (width - yAxisWidth)
    var selectWidth = headerSelect.node().getBoundingClientRect().width

    headerSelectDiv.interrupt()

    headerSelectDiv
      .transition(elTransition)
        .style('margin-left', yAxisWidth + barAreaWidth / 2 - selectWidth / 2 + 'px')

    headerSelect.node().selectedIndex = selectedOption

    // FINISH
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

    d3.selectAll('.y path, .y line')
      .style('visibility', 'hidden')

    d3.selectAll('.reference rect, .reference path')
      .style('fill', '#444')
  }

  function getSelectedQIDs (means, selectedOption) {
    var selected = []
    qIDs.forEach(function (qID, i) {
      if (!isNaN(means[i][selectedOption]) && means[i][selectedOption] !== -1) {
        selected.push(qID)
      }
    })
    return selected
  }

  // EXPORTS

  exports.generateListChart =
    function (
      qIDsArray,
      referencesMap,
      shorttextsMap,
      usertextsMap,
      directionsMap,
      selectedSelectedOption) {
      qIDs = qIDsArray
      meanReferences = referencesMap
      shorttexts = shorttextsMap
      usertexts = usertextsMap
      directions = directionsMap

      selectedOption = selectedSelectedOption

      computeDimensions()

      generateChartElements()
      updateStyles()
    }

  exports.setChartData = function (perspectiveOptionsArray, meansArray) {
    perspectiveOptions = perspectiveOptionsArray
    means = meansArray
    selectedQIDs = getSelectedQIDs(means, selectedOption)

    daxplore.profile.updateSelectorOption(selectedOption)

    firstUpdate = false
  }

  exports.updateSelectorOption = function (selectedSelectedOption) {
    selectedOption = selectedSelectedOption
    selectedQIDs = getSelectedQIDs(means, selectedOption)

    updateChartElements()
    updateStyles()
  }

  exports.generateImage = function () {
    var chartBB = d3.select('.chart').node().getBoundingClientRect()

    var chartWidth = chartBB.width
    var chartHeight = d3.select('.x.axis.top').node().getBoundingClientRect().height +
                    d3.select('.x.axis.bottom').node().getBoundingClientRect().height +
                    10 // constant to fudge the result

    var doctype = '<?xml version="1.0" standalone="no"?>' +
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'

    var svg = d3.select('svg').node()

    var source = (new XMLSerializer()).serializeToString(svg)

    var blob = new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' })

    var url = window.URL.createObjectURL(blob)

    var imgSelection = d3.select('body').append('img')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .style('visibility', 'hidden')

    var img = imgSelection.node()

    img.onload = function () {
      var canvasChartSelection = d3.select('body').append('canvas')
        .attr('width', chartWidth)
        .attr('height', chartHeight)
        .style('visibility', 'hidden')
      var canvasChart = canvasChartSelection.node()

      var chartCtx = canvasChart.getContext('2d')
      chartCtx.drawImage(img, 0, 0)

      var headerText = perspectiveOptions[selectedOption]
      var headerPaddingTop = 5
      var headerFontSize = 16
      var headerPaddingBottom = 10
      var headerFont = 'bold ' + headerFontSize + 'px sans-serif'
      var headerHeight = headerPaddingTop + headerFontSize + headerPaddingBottom

      var imgMargin = { top: 10, right: 20, bottom: 20, left: 10 }

      var completeWidth = imgMargin.left + chartWidth + imgMargin.right
      var completeHeight = imgMargin.top + headerHeight + chartHeight + imgMargin.bottom
      var canvasCompleteSelection = d3.select('body').append('canvas')
        .attr('width', completeWidth + 'px')
        .attr('height', completeHeight + 'px')
        .style('visibility', 'hidden')

      var canvasComplete = canvasCompleteSelection.node()

      var ctx = canvasCompleteSelection.node().getContext('2d')

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, completeWidth, completeHeight)
      ctx.fillStyle = 'black'

      ctx.font = headerFont

      var headerWidth = ctx.measureText(headerText).width

      var barAreaWidth = (width - yAxisWidth)
      var headerHorizontalShift = yAxisWidth + barAreaWidth / 2 - headerWidth / 2

      ctx.fillText(headerText, headerHorizontalShift + imgMargin.left, headerPaddingTop + headerFontSize + imgMargin.top)

      var sourceText = usertexts.imageWaterStamp
      var sourceFontHeight = 11
      ctx.font = sourceFontHeight + 'px sans-serif'
      ctx.fillStyle = '#555'
      // TODO unused: var sourceTextWidth = ctx.measureText(sourceText).width
      ctx.fillText(sourceText, 5, completeHeight - 5)

      ctx.drawImage(canvasChart, imgMargin.left, imgMargin.top + headerHeight)

      canvasComplete.toBlob(function (blob) {
        saveAs(blob, headerText + '.png')
      })

      imgSelection.remove()
      canvasChartSelection.remove()
      canvasCompleteSelection.remove()
    }

    img.src = url
  }
})(window.daxplore = window.daxplore || {})
