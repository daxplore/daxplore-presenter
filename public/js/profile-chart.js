(function (namespace) {
  namespace.profile = namespace.profile || {}
  const exports = namespace.profile

  let firstUpdate = true

  let chart, chartSvg
  let qIDs, means, meanReferences, perspectiveOptions, directions
  let customDataChart
  let shorttexts
  let selectedOption = 0
  let selectedQIDs = []
  let chartwrapperBB, xAxisTopHeight, margin, width, height
  let xScale, yScale, yAxisElement, yAxisReferenceElement
  let yAxisWidth

  const elementTransition = d3.transition()
      .duration(300)
      .ease(d3.easeLinear)

  let lastHoveredBar = 0

  // FUNCTIONS

  function getQid (i) {
    return selectedQIDs[i]
  }

  function getMean (qID, selectedOption) {
    return means[qIDs.indexOf(qID)][selectedOption]
  }

  function setToNormalColor (i) {
    const questionID = getQid(i)
    d3.select('.barrect-' + questionID)
      .style('fill', dax.colors.colorForValue(getMean(questionID, selectedOption), meanReferences[questionID], directions[questionID]))
    d3.selectAll('.y.axis .tick')
      .classed('bar-hover', false)
  }

  function setToHoverColor (i) {
    const questionID = getQid(i)
    d3.select('.barrect-' + questionID)
      .style('fill', dax.colors.colorHoverForValue(getMean(questionID, selectedOption), meanReferences[questionID], directions[questionID]))
    d3.selectAll('.y.axis .tick')
      .classed('bar-hover', function (d, index) { return i === index })
  }

  function tooltipOver (i) {
    computeDimensions()
    lastHoveredBar = i
    const qID = getQid(i)
    const tooltipdiv = d3.select('.profile-tooltipdiv')

    tooltipdiv.transition()
      .duration(200)
      .style('opacity', 1)

    tooltipdiv.html( // TODO externalize entire string
      shorttexts[qID] + ': <b>' + d3.format('d')(getMean(qID, selectedOption)) + '</b><br>' +
        dax.text('profile.chart.mean_bar_vertical.reference.value') + ': <b>' + d3.format('d')(meanReferences[qID]) + '</b>')
      .style('left', (chartwrapperBB.left + xScale(Math.max(getMean(qID, selectedOption), meanReferences[qID])) + yAxisWidth + 15.5) + 'px')
      .style('top', (yScale(qID) + yScale.bandwidth() / 2 - tooltipdiv.node().getBoundingClientRect().height / 2 + 0.5) + 'px')
    const arrowleft = d3.select('.profile-arrow-left')

    arrowleft.transition()
      .duration(200)
      .style('opacity', 1)

    arrowleft
      .style('left', (chartwrapperBB.left + xScale(Math.max(getMean(qID, selectedOption), meanReferences[qID])) + yAxisWidth + 10) + 'px')
      .style('top', (yScale(qID) + yScale.bandwidth() / 2 - arrowleft.node().getBoundingClientRect().height / 2 + 2) + 'px')

    d3.select('#profile-description')
      .html(dax.description.getProfileDescriptionFull(perspectiveOptions[selectedOption], qID, getMean(qID, selectedOption)))
  }

  function tooltipOut () {
    d3.select('.profile-tooltipdiv')
      .transition()
        .duration(300)
        .style('opacity', 0)

    d3.select('.profile-arrow-left')
      .transition()
        .duration(300)
        .style('opacity', 0)
  }

  // CHART ELEMENTS

  function computeDimensions () {
    const wrapperClientBB = d3.select('.profile-chart-wrapper').node().getBoundingClientRect()
    chartwrapperBB = {}
    chartwrapperBB.left = Math.floor(wrapperClientBB.left + pageXOffset)
    chartwrapperBB.top = Math.floor(wrapperClientBB.top + pageYOffset)
    chartwrapperBB.width = Math.floor(wrapperClientBB.width)
    chartwrapperBB.height = Math.floor(wrapperClientBB.height - 10)
    xAxisTopHeight = 30
    margin = { top: 0, right: 10, bottom: xAxisTopHeight, left: 0 }
    width = Math.floor(chartwrapperBB.width - margin.left - margin.right)
    height = Math.floor(chartwrapperBB.height - margin.top - margin.bottom)
  }

  function generateChartElements () {
    // CHART
    chartSvg = d3.select('.profile-chart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    // WHITE BACKGROUND
    chartSvg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'white')

    chart = chartSvg.append('g')
      .classed('profile-chart-content', true)
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

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
        .text(dax.text('profile.chart.mean_bar_vertical.x_axis_description'))

    // X AXIS BOTTOM
    chart.append('g')
      .attr('class', 'x axis bottom')
      .append('text')
        .attr('class', 'x-bottom-description')
        .attr('text-anchor', 'middle')
        .style('text-anchor', 'middle')
        .text(dax.text('profile.chart.mean_bar_vertical.x_axis_description'))

    // TODO use Modernizr instead of IE-check
    // Hide save image button in IE11 because of a known svg bug
    // https://connect.microsoft.com/IE/feedbackdetail/view/925655
    const isIE11 = /Trident.*rv[ :]*11\./.test(navigator.userAgent)
    if (isIE11) {
      d3.selectAll('.profile-save-image')
       .style('display', 'none')
    }
  }

  function updateChartElements () {
    let elTransition = elementTransition
    if (firstUpdate) {
      elTransition = d3.transition().duration(0)
    }

    const paddingInner = 0.3
    const paddingOuter = 0.4
    const maxBandwidth = 50

    // Rearranged equation from d3's source file band.js, ignoring the floor call
    // https://github.com/d3/d3-scale/blob/fd07dd8ceeaeaec612f675050ac134243b406f64/src/band.js#L26
    const yHeightWithMaxBand = Math.max(1, selectedQIDs.length - paddingInner + paddingOuter * 2) * maxBandwidth / (1 - paddingInner)

    const yStop = Math.min(height, yHeightWithMaxBand + xAxisTopHeight)

    // CALCULATE Y SCALE
    yScale = d3.scaleBand()
      .range([xAxisTopHeight, yStop])
      .paddingInner(paddingInner)
      .paddingOuter(paddingOuter)
      .domain(selectedQIDs)

    // UPDATE Y AXIS
    const yAxisScale = yScale.copy()
    yAxisScale.domain(selectedQIDs.map(function (qID) { return shorttexts[qID] }))
    const yAxis = d3.axisLeft()
      .tickSize(3)
      .scale(yAxisScale)

    let oldYAxisWidth = Math.max(50, yAxisReferenceElement.node().getBBox().width)
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
    const xAxisTop = d3.axisTop()
      .scale(xScale)
      .ticks(20, 'd')
      .tickSizeInner(0)

    const xAxisTopElement = d3.selectAll('g.x.axis.top')

    xAxisTopElement.interrupt().selectAll('*').interrupt()

    xAxisTopElement.transition(elTransition)
      .attr('transform', 'translate(' + yAxisWidth + ',' + xAxisTopHeight + ')')
      .call(xAxisTop)

    d3.selectAll('.x-top-description')
      .transition(elTransition)
        .attr('transform', 'translate(' + (width - yAxisWidth) / 2 + ', -20)')

    // UPDATE X AXIS BOTTOM
    const xAxisBottom = d3.axisBottom()
      .scale(xScale)
      .ticks(20, 'd')
      .tickSizeInner(-(yStop - xAxisTopHeight))

    const xAxisBottomElement = d3.selectAll('g.x.axis.bottom')

    xAxisBottomElement.interrupt().selectAll('*').interrupt()

    xAxisBottomElement.transition(elTransition)
      .attr('transform', 'translate(' + yAxisWidth + ',' + (yStop) + ')')
      .call(xAxisBottom)

    d3.selectAll('.x-bottom-description')
      .transition(elTransition)
      .attr('transform', 'translate(' + (width - yAxisWidth) / 2 + ', 28)')

    // BARS
    let bars = chart.selectAll('.bar')
      .data(
        selectedQIDs, // data
        function (option) { return option } // key function
      )

    // Remove old bars
    bars.exit().remove()

    // Add new bars
    bars.enter().append('g')
      .classed('bar', true)
      .attr('transform', function (d, i) { return 'translate(' + (oldYAxisWidth + 1) + ',' + yScale(d) + ')' })
      .append('rect')
        .attr('class', function (qID) {
          return 'barrect barrect-' + qID
        })
        .attr('height', yScale.bandwidth())
        .style('fill', function (qID) { return dax.colors.colorForValue(getMean(qID, selectedOption), meanReferences[qID], directions[qID]) })
        .attr('width', function (qID) { return firstUpdate ? xScale(getMean(qID, selectedOption)) + 1 : 0 })
        .on('mouseover',
          function (d) {
            const i = selectedQIDs.indexOf(d)
            tooltipOver(i)
            setToHoverColor(i)
          })
        .on('mouseout',
          function (d) {
            const i = selectedQIDs.indexOf(d)
            tooltipOut()
            setToNormalColor(i)
          })

    // animate all bars into position
    bars = d3.selectAll('.bar')

    bars.interrupt().selectAll('*').interrupt()

    bars
      .transition(elTransition)
      .attr('transform', function (d, i) { return 'translate(' + (yAxisWidth + 1) + ',' + yScale(d) + ')' })

    bars.selectAll('.barrect')
      .transition(elTransition)
        .style('fill', function (qID) {
          return dax.colors.colorForValue(getMean(qID, selectedOption), meanReferences[qID], directions[qID])
        })
        .attr('height', yScale.bandwidth())
        .attr('width', function (qID) { return xScale(getMean(qID, selectedOption)) + 1 })

    // REFERENCE LINES
    const referenceWidth = 2
    const referenceExtraHeight = 4
    const referenceHeight = yScale.bandwidth() + referenceExtraHeight

    let references = chart.selectAll('.reference')
      .data(selectedQIDs)

    // Remove old reference lines
    references.exit().remove()

    // Add new reference lines
    references.enter().append('g')
      .classed('reference', true)
      .on('mouseover',
        function (d) {
          const i = selectedQIDs.indexOf(d)
          tooltipOver(i)
          setToHoverColor(i)
        })
      .on('mouseout',
        function (d) {
          const i = selectedQIDs.indexOf(d)
          tooltipOut()
          setToNormalColor(i)
        })
      .attr('transform', function (d, i) { return 'translate(' + (yAxisWidth + xScale(meanReferences[getQid(i)]) - referenceWidth / 2) + ',' + (yScale(d) - referenceExtraHeight / 2) + ')' })
      .style('shape-rendering', 'geometricPrecision')
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

    // Update all reference lines
    references = d3.selectAll('.reference')

    references.interrupt().selectAll('*').interrupt()

    references
      .raise()
      .transition(elTransition)
        .attr('transform', function (d, i) { return 'translate(' + (yAxisWidth + xScale(meanReferences[d]) - referenceWidth / 2) + ',' + (yScale(d) - referenceExtraHeight / 2) + ')' })

    references.selectAll('.reference-line')
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
      d3.select('#chart-description')
        .style('opacity', '0')
    }
    tooltipOut()

    // HEADER SELECT
    // TODO should header be in separate component or in core instead?
    const headerSelectDiv = d3.select('.header-select-div')
    const headerSelect = d3.select('.header-select')

    const options = headerSelect.selectAll('option')
      .data(perspectiveOptions, function (d) { return d })

    options.exit().remove()

    options.enter()
      .append('option')
        .text(function (d) { return d })
        .attr('value', function (d, i) { return i })

    const barAreaWidth = (width - yAxisWidth)
    const selectWidth = headerSelect.node().getBoundingClientRect().width

    headerSelectDiv.interrupt()

    headerSelectDiv
      .transition(elTransition)
        .style('margin-left', yAxisWidth + barAreaWidth / 2 - selectWidth / 2 + 'px')

    headerSelect.node().selectedIndex = selectedOption

    // FINISH
    updateStyles()
  }

  function updateStyles () {
    chart.selectAll('.axis .domain')
      .style('visibility', 'hidden')

    chart.selectAll('.axis path, .axis line')
      .style('fill', 'none')
      .style('stroke', '#bbb')
      .style('shape-rendering', 'geometricPrecision')

    chart.selectAll('text')
      .style('fill', '#555')
      .style('font-size', '13px')
      .style('font-family', '"Varta", sans-serif')
      .style('cursor', 'default')

    chart.selectAll('.y path, .y line')
      .style('visibility', 'hidden')

    chart.selectAll('.reference rect, .reference path')
      .style('fill', '#444')
  }

  function getSelectedQIDs (means, selectedOption) {
    const selected = []
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
      directionsMap,
      selectedSelectedOption,
      customDataChartInput
    ) {
      qIDs = qIDsArray
      meanReferences = referencesMap
      shorttexts = shorttextsMap
      directions = directionsMap
      selectedOption = selectedSelectedOption
      customDataChart = customDataChartInput

      computeDimensions()

      generateChartElements()
      updateStyles()
    }

  exports.setChartData =
  function (perspectiveOptionsArray, meansArray) {
    perspectiveOptions = perspectiveOptionsArray
    means = meansArray
    selectedQIDs = getSelectedQIDs(means, selectedOption)

    dax.profile.setPerspectiveOption(selectedOption)

    firstUpdate = false
  }

  exports.setPerspectiveOption =
  function (selectedSelectedOption) {
    selectedOption = selectedSelectedOption
    selectedQIDs = getSelectedQIDs(means, selectedOption)

    updateChartElements()
    updateStyles()
  }

  exports.generateImage =
  function () {
    const imageScaling = 2
    const leftAdjust = 10
    const widthAdjust = 20

    const chartCopy = d3.select(chartSvg.node().cloneNode(true))
    chartCopy.select('g').attr('transform', 'translate(' + (margin.left + leftAdjust) + ',' + margin.top + ')')

    const doctype = '<?xml version="1.0" standalone="no"?>' +
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'

    const descriptionRightPosition = d3.select('.x-top-description').node().getBoundingClientRect()
    chartCopy.attr('width', Math.max(width + margin.left + margin.right, descriptionRightPosition.x + descriptionRightPosition.width + 5) + widthAdjust)

    const widthBefore = chartCopy.attr('width')
    chartCopy.attr('width', imageScaling * (Number(widthBefore) + widthAdjust))
    const heightBefore = chartCopy.attr('height')
    chartCopy.attr('height', imageScaling * Number(heightBefore))
    chartCopy.style('transform', 'scale(' + imageScaling + ')' +
      'translate(' + ((Number(widthBefore) + widthAdjust) / 2) + 'px,' + (Number(heightBefore) / 2) + 'px)')

    const source = (new XMLSerializer()).serializeToString(chartCopy.node())
    const blob = new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const imgSelection = d3.select('body').append('img')
      .style('visibility', 'hidden')
    const img = imgSelection.node()

    img.onload = function () {
      const canvasChartSelection = d3.select('body').append('canvas')
        .attr('width', img.width)
        .attr('height', img.height)
        .style('visibility', 'hidden')
      const canvasChart = canvasChartSelection.node()

      const chartCtx = canvasChart.getContext('2d')
      chartCtx.drawImage(img, 0, 0)

      const headerText = perspectiveOptions[selectedOption]
      const headerPaddingTop = 5 * imageScaling
      const headerFontSize = 16 * imageScaling
      const headerPaddingBottom = 10 * imageScaling
      const headerFont = 'bold ' + headerFontSize + 'px "Varta"'
      const headerHeight = headerPaddingTop + headerFontSize + headerPaddingBottom

      const imgMargin = { top: 10 * imageScaling, right: 0 * imageScaling, bottom: 20 * imageScaling, left: 10 * imageScaling }

      const completeWidth = imgMargin.left + img.width + imgMargin.right
      const completeHeight = imgMargin.top + headerHeight + img.height + imgMargin.bottom
      const canvasCompleteSelection = d3.select('body').append('canvas')
        .attr('width', completeWidth + 'px')
        .attr('height', completeHeight + 'px')
        .style('visibility', 'hidden')

      const canvasComplete = canvasCompleteSelection.node()

      const ctx = canvasCompleteSelection.node().getContext('2d')

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, completeWidth, completeHeight)
      ctx.fillStyle = 'black'

      ctx.font = headerFont

      const headerWidth = ctx.measureText(headerText).width

      const yAxisSectionWidth = (yAxisWidth + margin.left + imgMargin.left) * imageScaling
      const barAreaWidth = img.width - yAxisSectionWidth - (margin.right + imgMargin.right + leftAdjust + widthAdjust) * imageScaling
      const headerHorizontalShift = yAxisSectionWidth + barAreaWidth / 2 - headerWidth / 2

      ctx.fillText(headerText, headerHorizontalShift, headerPaddingTop + headerFontSize + imgMargin.top)

      let watermarkText = dax.text(customDataChart ? 'user_profile.image.watermark' : 'profile.chart.mean_bar_vertical.image.watermark')

      const date = new Date()
      watermarkText = watermarkText.replace(
        '{date}',
        date.getFullYear() + '-' +
        ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
        ('0' + date.getDate()).slice(-2))

      const fileName = dax.text(customDataChart ? 'user_profile.chart.mean_bar_vertical.image.filename' : 'profile.image.filename')
        .replace('{option}', headerText)

      const sourceFontHeight = 11 * imageScaling
      ctx.font = sourceFontHeight + 'px "Varta"'
      ctx.fillStyle = '#555'
      // TODO unused: let sourceTextWidth = ctx.measureText(sourceText).width
      ctx.fillText(watermarkText, 5 * imageScaling, completeHeight - 5 * imageScaling)

      ctx.drawImage(canvasChart, imgMargin.left, imgMargin.top + headerHeight)

      canvasComplete.toBlob(function (blob) {
        saveAs(blob, fileName + '.png')
      })

      imgSelection.remove()
      canvasChartSelection.remove()
      canvasCompleteSelection.remove()
    }

    img.src = url
  }
})(window.dax = window.dax || {})
