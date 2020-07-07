(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.meanprofile = namespace.chart.meanprofile || {}
  const exports = namespace.chart.meanprofile

  /** ** CHART TYPE AND INSTANCE VARIABLES ** **/

  // CONSTANTS
  const paddingInner = 0.3
  const paddingOuter = 0.4

  const xAxisTopHeight = 30
  const margin = { top: 0, right: 13, bottom: xAxisTopHeight, left: 10 }
  const elementTransition = d3.transition().duration(300).ease(d3.easeLinear)

  // SIZE VARIABLES
  let availableWidth = 600 // initial placeholder value
  let width = availableWidth
  // const height = availableHeight

  // CURRENT CHART
  // HEADER
  let headerDiv, headerMain, headerSub, headerDescriptionButton //, headerDecriptionPanel
  // CHART
  let chart, chartContainer, chartG
  // let referenceLine, referenceLineMouseArea

  // SCALES AND AXISES
  let xScale
  let xAxisTop, xAxisTopElement, xAxisTopDescription
  let xAxisBottom, xAxisBottomElement, xAxisBottomDescription
  let yScale, yAxis, yAxisElement, yAxisReferenceElement

  // STATE TRACKING
  let animateNextUpdate = false

  let perspectiveID, questionID, selectedPerspectiveOptions, questionReferenceValue, questionReferenceDirection
  let selectedOptionsData, selectedOptionsDataMap

  // let qIDs, means, meanReferences, perspectiveOptions, directions
  // TODO unused: descriptions
  // let shorttexts // TODO initialize
  // const selectedOption = 0
  // let selectedQIDs = []
  // let chartwrapperBB,
  // let xScale, yScale, yAxisElement, yAxisReferenceElement // TODO unused: chart
  // let yAxisWidth

  let lastHoveredBar = 0

  /** ** EXPORTED FUNCTIONS ** **/

  exports.initializeResources = function () {
    // INITIALIZE HEADER
    headerDiv = d3.select('.header-section').append('div')
      .attr('class', 'header-section__meanprofile')
    headerMain = headerDiv.append('div')
      .attr('class', 'header-section__main')
    headerSub = headerDiv.append('div')
      .attr('class', 'header-section__sub')
    headerDescriptionButton = d3.select('.chart-panel').append('div')
      .attr('class', 'header-section__description-button')
    // headerDecriptionPanel =
    headerDescriptionButton.append('div')
      .attr('class', 'header-section__description-panel')

    // INITIALIZE CHART
    // base div element
    chartContainer = d3.select('.chart').append('div')
      .attr('class', 'explorer-meanprofile')

    // base svg element
    chart = chartContainer.append('svg')
      .attr('class', 'explorer-meanprofile')

    // white background
    chart.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'white')

    // margin adjusted chart element
    chartG = chart.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    // Y AXIS
    yScale = d3.scaleBand()
      .paddingInner(paddingInner)
      .paddingOuter(paddingOuter)

    yAxis = d3.axisLeft()
      .tickSize(3)
      .tickFormat(function (opt) {
        return dax.data.getQuestionOptionText(perspectiveID, opt)
      })

    yAxisElement = chartG.append('g')
      .classed('y', true)
      .classed('axis', true)

    yAxisReferenceElement = chartG.append('g')
      .classed('y', true)
      .classed('axis', true)
      .style('opacity', 0)

    // X SCALE
    xScale = d3.scaleLinear()

    // X AXIS TOP
    xAxisTop = d3.axisTop()
      .scale(xScale)
      .ticks(20, 'd')
      .tickSizeInner(0)

    xAxisTopElement = chartG.append('g')
      .attr('class', 'x axis top')

    xAxisTopDescription = xAxisTopElement.append('text')
      .classed('x-top-description', true)
      .text(dax.text('listXAxisDescription')) // TODO use new text ID style

    // X AXIS BOTTOM
    xAxisBottom = d3.axisBottom()
      .scale(xScale)
      .ticks(20, 'd')

    xAxisBottomElement = chartG.append('g')
      .attr('class', 'x axis bottom')

    xAxisBottomDescription = xAxisBottomElement.append('text')
      .attr('class', 'x-bottom-description')
      .attr('text-anchor', 'middle')
      .style('text-anchor', 'middle')
      .text(dax.text('listXAxisDescription')) // TODO use new text ID style

    // REFERENCE LINE
    // referenceLine =
    chartG.append('line')
      .attr('class', 'reference-line')
      .style('stroke', '#666')
      .style('stroke-width', '3.2px')
      .style('stroke-linecap', 'square')
      .style('stroke-dasharray', '4,8')
      .style('shape-rendering', 'crispedges')

    // referenceLineMouseArea =
    chartG.append('rect')
      .style('opacity', 0)
      // .on('mouseover', function () { referenceTooltipDiv.classed('hidden', false) })
      // .on('mouseout', function () { referenceTooltipDiv.classed('hidden', true) })
  }

  exports.populateChart = function (questionIDInput, perspectiveIDInput, selectedPerspectiveOptionsInput) {
    displayChartElements(true)

    // Animate the update unless the perspective has changed.
    // As long as the perspective is the same, each bar represents a specific perspective option
    // which gives continuity for the user. But of the perspective change, the contextual meaning
    // of the bars and color changes.
    animateNextUpdate = perspectiveIDInput === perspectiveID

    // Arguments
    questionID = questionIDInput
    perspectiveID = perspectiveIDInput
    selectedPerspectiveOptions = selectedPerspectiveOptionsInput
    questionReferenceValue = dax.data.getMeanReference(questionID)
    questionReferenceDirection = dax.data.getMeanReferenceDirection(questionID)

    // DATA
    // Restructure the input data that can be used in a d3 join
    selectedOptionsData = []
    selectedOptionsDataMap = {}
    selectedPerspectiveOptions.forEach(function (option, i) {
      const stat = dax.data.getMean(questionID, perspectiveID, option)
      const mean = stat.mean
      const count = stat.count
      const optionData = {
        index: option,
        mean: mean,
        nodata: mean === -1 && count === 0,
        count: count,
      }
      selectedOptionsData.push(optionData)
      selectedOptionsDataMap[option] = optionData
    })

    // UPDATE HEADER
    const shortText = dax.data.getQuestionShortText(questionID)
    const longText = dax.data.getQuestionFullText(questionID)
    headerMain
      .text(shortText)
    headerSub
      .text(longText)
      .style('display', longText === '' || shortText === longText ? 'none' : null)

    // X AXIS
    xScale
      .domain([0, 100]) // TODO define range in producer

    // Y AXIS
    yScale
      .domain(selectedPerspectiveOptions)
    yAxis
      .scale(yScale)

    resizeAndPositionElements()
  }

  // Set the size available for the chart.
  // Updates the chart so it fits in the new size.
  exports.setSize = function (availableWidthInput) {
    availableWidth = availableWidthInput
    resizeAndPositionElements()
  }

  // Hide all meanbars chart elements
  // Called whenever the entire chart should be hidden, so that another chart type can be dislpayed
  exports.hide = function () {
    displayChartElements(false)
  }

  /** ** INTERNAL FUNCTIONS ** **/

  // Hide or show all top level elements: header, chart and legend
  function displayChartElements (show) {
    headerDiv.style('display', show ? null : 'none')
    chartContainer.style('display', show ? null : 'none')
    // legendDiv.style('display', show ? null : 'none')
  }

  // CHART ELEMENTS

  // function computeDimensions () {
  //   const wrapperClientBB = d3.select('.chart').node().getBoundingClientRect()
  //   chartwrapperBB = {}
  //   chartwrapperBB.left = wrapperClientBB.left + pageXOffset
  //   chartwrapperBB.top = wrapperClientBB.top + pageYOffset
  //   chartwrapperBB.width = wrapperClientBB.width
  //   chartwrapperBB.height = wrapperClientBB.height - 10
  //   xAxisTopHeight = 30
  //   margin = { top: 0, right: 13, bottom: xAxisTopHeight, left: 0 }
  //   width = chartwrapperBB.width - margin.left - margin.right
  //   height = 600 - margin.top - margin.bottom
  // }

  function updateStyles () {
    chartG.selectAll('.axis .domain')
      .style('visibility', 'hidden')

    chartG.selectAll('.axis path, .axis line')
      .style('fill', 'none')
      .style('stroke', '#bbb')
      .style('shape-rendering', 'geometricPrecision')

    chartG.selectAll('text')
      .style('fill', '#555')
      .style('font', '12px sans-serif')
      .style('cursor', 'default')

    chartG.selectAll('.y path, .y line')
      .style('visibility', 'hidden')

    chartG.selectAll('.reference rect, .reference path')
      .style('fill', '#444')
  }

  function resizeAndPositionElements () {
    let oldYAxisWidth = Math.max(50, yAxisReferenceElement.node().getBoundingClientRect().width)
    yAxisReferenceElement.call(yAxis)
    const yAxisWidth = Math.max(50, yAxisReferenceElement.node().getBoundingClientRect().width)
    if (!animateNextUpdate) {
      oldYAxisWidth = yAxisWidth
    }

    // const minBarLength = 100 // TODO
    // const chartNeededWidth = margin.left + margin.right + yAxisWidth + minBarLength

    width = availableWidth - margin.left - margin.right - 40

    const bandWidth = 20
    // rearranged equation from d3's source file band.js, ignoring the floor call
    // https://github.com/d3/d3-scale/blob/fd07dd8ceeaeaec612f675050ac134243b406f64/src/band.js#L26
    const barSectionHeight = Math.max(1, selectedPerspectiveOptions.length - paddingInner + paddingOuter * 2) * bandWidth / (1 - paddingInner)
    const yStop = barSectionHeight + xAxisTopHeight

    chart
      .attr('width', availableWidth - margin.left - margin.right)
      .attr('height', yStop + margin.top + margin.bottom)

    // UPDATE Y
    yScale
      .range([xAxisTopHeight, yStop])

    yAxisElement.interrupt().selectAll('*').interrupt()

    // const yae = animateNextUpdate ? yAxisElement : yAxisElement.transition(elementTransition)

    conditionalApplyTransition(yAxisElement, elementTransition, animateNextUpdate)
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

    // UPDATE X SCALE
    xScale
      .range([0, width - yAxisWidth])

    // UPDATE X TOP
    xAxisTopElement.interrupt().selectAll('*').interrupt()

    conditionalApplyTransition(xAxisTopElement, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + yAxisWidth + ',' + xAxisTopHeight + ')')
      .call(xAxisTop)

    conditionalApplyTransition(xAxisTopDescription, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + (width - yAxisWidth) / 2 + ', -20)')

    // UPDATE X BOTTOM
    xAxisBottom
      .tickSizeInner(-(yStop - xAxisTopHeight))

    xAxisBottomElement.interrupt().selectAll('*').interrupt()

    conditionalApplyTransition(xAxisBottomElement, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + yAxisWidth + ',' + yStop + ')')
      .call(xAxisBottom)

    conditionalApplyTransition(xAxisBottomDescription, elementTransition, animateNextUpdate)
      .transition(elementTransition)
      .attr('transform', 'translate(' + (width - yAxisWidth) / 2 + ', 28)')

    /** * TODO REMOVE OLD VERSION * **/

    // if (animateNextUpdate) {
    // let elTransition = elementTransition
    // } else {
    //   elTransition = d3.transition().duration(0)
    // }

    // UPDATE Y AXIS
    // const yAxisScale = yScale.copy()
    // yAxisScale.domain(yAxisScale.domain().map(function (opt) {
    //   return dax.data.getQuestionOptionText(perspectiveID, opt)
    // }))
    // yAxis
    //   .scale(yAxisScale)

    // let oldYAxisWidth = Math.max(50, yAxisReferenceElement.node().getBoundingClientRect().width)
    // yAxisReferenceElement.call(yAxis)
    // yAxisWidth = Math.max(50, yAxisReferenceElement.node().getBoundingClientRect().width)

    // UPDATE X AXIS BOTTOM
    //
    // const xAxisBottomElement = d3.selectAll('g.x.axis.bottom')
    //
    // xAxisBottomElement.interrupt().selectAll('*').interrupt()
    //
    // xAxisBottomElement.transition(elTransition)
    //   .attr('transform', 'translate(' + yAxisWidth + ',' + (yStop) + ')')
    //   .call(xAxisBottom)
    //
    // d3.selectAll('.x-bottom-description')
    //   .transition(elTransition)
    //   .attr('transform', 'translate(' + (width - yAxisWidth) / 2 + ', 28)')

    // BARS
    let bars = chartG.selectAll('.bar')
      .data(
        selectedOptionsData, // data
        function (option) { return option.index } // key function, mapping a specific DOM element to a specific option index
      )

    // remove old bars
    bars.exit().remove()

    // // add new bars
    bars.enter().append('g')
      .classed('bar', true)
      .attr('transform', function (option) { return 'translate(' + (oldYAxisWidth + 1) + ',' + yScale(option.index) + ')' })
      .append('rect')
        .classed('barrect', true)
        .attr('height', yScale.bandwidth())
        .style('fill', function (option) {
          return dax.profile.colorForValue(option.mean, questionReferenceValue, questionReferenceDirection)
        })
        .attr('width', function (option) { return animateNextUpdate ? xScale(option.mean) + 1 : 0 })
        .on('mouseover',
          function (option) {
            tooltipOver(option.index)
            setToHoverColor(option.index)
          })
        .on('mouseout',
          function (option) {
            tooltipOut()
            setToNormalColor(option.index)
          })

    // animate all bars into position
    bars = d3.selectAll('.bar')

    bars.interrupt().selectAll('*').interrupt()

    conditionalApplyTransition(bars, elementTransition, animateNextUpdate)
      .attr('transform', function (option) { return 'translate(' + (yAxisWidth + 1) + ',' + yScale(option.index) + ')' })

    conditionalApplyTransition(bars.select('.barrect'), elementTransition, animateNextUpdate)
      .style('fill', function (option) { return dax.profile.colorForValue(option.mean, questionReferenceValue, questionReferenceDirection) })
      .attr('height', yScale.bandwidth())
      .attr('width', function (option) { return xScale(option.mean) + 1 })

    // REFERENCE LINE
    // const referenceWidth = 2
    // const referenceExtraHeight = 4
    // const referenceHeight = yScale.bandwidth() + referenceExtraHeight
    //
    // let references = chart.selectAll('.reference')
    //   .data(selectedQIDs)
    //
    // // remove old reference lines
    // references.exit().remove()
    //
    // // add new reference lines
    // references.enter().append('g')
    //   .classed('reference', true)
    //   .on('mouseover',
    //     function (d) {
    //       const i = selectedQIDs.indexOf(d)
    //       tooltipOver(i)
    //       setToHoverColor(i)
    //     })
    //   .on('mouseout',
    //     function (d) {
    //       const i = selectedQIDs.indexOf(d)
    //       tooltipOut()
    //       setToNormalColor(i)
    //     })
    //   .attr('transform', function (d, i) { return 'translate(' + (yAxisWidth + xScale(meanReferences[getQid(i)]) - referenceWidth / 2) + ',' + (yScale(d) - referenceExtraHeight / 2) + ')' })
    //   .style('shape-rendering', 'crispEdges')
    //   .append('rect')
    //     .classed('reference-line', true)
    //     .attr('width', referenceWidth)
    //     .attr('height', referenceHeight)
    //   .append('rect') // invisible rect for mouseover
    //     .classed('reference-line-box', true)
    //     .attr('transform', 'translate(-1, -1)')
    //     .attr('width', referenceWidth + 2)
    //     .attr('height', referenceHeight + 2)
    //     .attr('opacity', '0')

    // update all reference lines
    //
    // references = d3.selectAll('.reference')
    //
    // references.interrupt().selectAll('*').interrupt()
    //
    // references
    //   .transition(elTransition)
    //     .attr('transform', function (d, i) { return 'translate(' + (yAxisWidth + xScale(meanReferences[d]) - referenceWidth / 2) + ',' + (yScale(d) - referenceExtraHeight / 2) + ')' })
    //
    // references.select('.reference-line')
    //   .transition(elTransition)
    //     .attr('width', referenceWidth)
    //     .attr('height', referenceHeight)
    //
    // references.selectAll('.reference-line-box')
    //   .transition(elTransition)
    //   .attr('width', referenceWidth + 2)
    //   .attr('height', referenceHeight + 2)

    // repopulate the description box and reset the tooltip
    if (selectedPerspectiveOptions.length > 0) {
      tooltipOver(Math.min(lastHoveredBar, selectedPerspectiveOptions.length - 1))
    } else {
      d3.selectAll('#chart-description')
        .style('opacity', '0')
    }
    tooltipOut()

    // // HEADER SELECT
    // const headerSelectDiv = d3.select('.header-select-div')
    // const headerSelect = d3.select('.header-select')
    //
    // const options = headerSelect.selectAll('option')
    //     .data(selectedPerspectiveOptions, function (d) { return d })
    //
    // options.exit().remove()
    //
    // options.enter()
    //   .append('option')
    //     .text(function (d) { return d })
    //     .attr('value', function (d, i) { return i })
    //
    // const barAreaWidth = (width - yAxisWidth)
    // const selectWidth = headerSelect.node().getBoundingClientRect().width
    //
    // headerSelectDiv.interrupt()
    //
    // headerSelectDiv
    //   .transition(elTransition)
    //     .style('margin-left', yAxisWidth + barAreaWidth / 2 - selectWidth / 2 + 'px')
    //
    // headerSelect.node().selectedIndex = selectedOption

    // FINISH
    updateStyles()
  }

  /** * * ** */

  // OLD VERSION 2020-04-27

  // FUNCTIONS

  // function getQid (i) {
  //   return selectedQIDs[i]
  // }
  //
  // function getMean (i, selectedOption) {
  //   return means[qIDs.indexOf(getQid(i))][selectedOption]
  // }

  function setToNormalColor (option) {
    d3.select('#barrect-' + option.index)
      .style('fill', dax.profile.colorForValue(option.mean, questionReferenceValue, questionReferenceDirection))
    d3.selectAll('.q-' + option.index)
      .classed('bar-hover', false)
    d3.selectAll('.y.axis .tick')
      .classed('bar-hover', false)
  }

  function setToHoverColor (option) {
    d3.select('#barrect-' + option.index)
      .style('fill', dax.profile.colorHoverForValue(option.mean, questionReferenceValue, questionReferenceDirection))
    d3.selectAll('.q-' + option.index)
      .classed('bar-hover', true)
    d3.selectAll('.y.axis .tick')
      .classed('bar-hover', function (option, index) { return option.index === index }) // TODO probably broken
  }

  function tooltipOver (i) {
    // computeDimensions()
    lastHoveredBar = i
    const tooltipdiv = d3.select('.tooltipdiv')

    tooltipdiv.transition()
      .duration(200)
      .style('opacity', 1)

    // tooltipdiv.html( // TODO externalize entire string
    //   shorttexts[getQid(i)] + ': <b>' + d3.format('d')(getMean(i, selectedOption)) + '</b><br>' +
    //     dax.text('listReferenceValue') + ': <b>' + d3.format('d')(meanReferences[getQid(i)]) + '</b>') // TODO use new text ID style
    //   .style('background', dax.profile.colorHoverForValue(getMean(i, selectedOption), meanReferences[getQid(i)], directions[getQid(i)]))
    //   .style('left', (chartwrapperBB.left + xScale(Math.max(getMean(i, selectedOption), meanReferences[getQid(i)])) + yAxisWidth + 14) + 'px')
    //   .style('top', chartwrapperBB.top + yScale(getQid(i)) + yScale.bandwidth() / 2 - tooltipdiv.node().getBoundingClientRect().height / 2 + 'px')

    const arrowleft = d3.select('.arrow-left')

    arrowleft.transition()
      .duration(200)
      .style('opacity', 1)

    // arrowleft
    //   .style('border-right-color', dax.profile.colorHoverForValue(getMean(i, selectedOption), meanReferences[getQid(i)], directions[getQid(i)]))
    //   .style('left', (chartwrapperBB.left + xScale(Math.max(getMean(i, selectedOption), meanReferences[getQid(i)])) + yAxisWidth + 4) + 'px')
    //   .style('top', chartwrapperBB.top + yScale(getQid(i)) + yScale.bandwidth() / 2 - arrowleft.node().getBoundingClientRect().height / 2 + 'px')
    //
    // dax.profile.setDescriptionFull(d3.select('#chart-description'), perspectiveOptions[selectedOption], getQid(i), getMean(i, selectedOption))
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

  // Helper
  function conditionalApplyTransition (element, transition, useTransition) {
    return useTransition ? element.transition(transition) : element
  }

  // CHART ELEMENTS

  // function computeDimensions () {
  //   let wrapperClientBB = d3.select('.chart-wrapper').node().getBoundingClientRect()
  //   chartwrapperBB = {}
  //   chartwrapperBB.left = wrapperClientBB.left + pageXOffset
  //   chartwrapperBB.top = wrapperClientBB.top + pageYOffset
  //   chartwrapperBB.width = wrapperClientBB.width
  //   chartwrapperBB.height = wrapperClientBB.height - 10
  //   xAxisTopHeight = 30
  //   margin = { top: 0, right: 13, bottom: xAxisTopHeight, left: 0 }
  //   width = chartwrapperBB.width - margin.left - margin.right
  //   height = chartwrapperBB.height - margin.top - margin.bottom
  // }

  // function generateChartElements () {
  //   // CHART
  //   let chart = d3.select('.chart')
  //     .attr('width', width + margin.left + margin.right)
  //     .attr('height', height + margin.top + margin.bottom)
  //
  //   // WHITE BACKGROUND
  //   chart.append('rect')
  //     .attr('width', '100%')
  //     .attr('height', '100%')
  //     .attr('fill', 'white')
  //
  //   // Y AXIS
  //   yAxisElement = chart.append('g')
  //     .classed('y', true)
  //     .classed('axis', true)
  //
  //   yAxisReferenceElement = chart.append('g')
  //     .classed('y', true)
  //     .classed('axis', true)
  //     .style('opacity', 0)
  //
  //   // X AXIS TOP
  //   chart.append('g')
  //     .attr('class', 'x axis top')
  //   .append('text')
  //     .classed('x-top-description', true)
  //     .text(dax.text('listXAxisDescription')) // TODO use new text ID style
  //
  //   // X AXIS BOTTOM
  //   chart.append('g')
  //     .attr('class', 'x axis bottom')
  //   .append('text')
  //     .attr('class', 'x-bottom-description')
  //     .attr('text-anchor', 'middle')
  //     .style('text-anchor', 'middle')
  //     .text(dax.text('listXAxisDescription')) // TODO use new text ID style
  //
  //   // TODO use Modernizr instead of IE-check
  //   // Hide save image button in IE11 because of a known svg bug
  //   // https://connect.microsoft.com/IE/feedbackdetail/view/925655
  //   let isIE11 = /Trident.*rv[ :]*11\./.test(navigator.userAgent)
  //   if (isIE11) {
  //     d3.selectAll('.save-image')
  //      .style('display', 'none')
  //   }
  // }

  // function updateChartElements () {
  //   if (firstUpdate) {
  //     let elTransition = d3.transition().duration(0)
  //   } else {
  //     elTransition = elementTransition
  //   }
  //
  //   let chart = d3.selectAll('.chart')
  //
  //   let paddingInner = 0.3
  //   let paddingOuter = 0.4
  //   let maxBandwidth = 50
  //
  //   // rearranged equation from d3's source file band.js, ignoring the floor call
  //   // https://github.com/d3/d3-scale/blob/fd07dd8ceeaeaec612f675050ac134243b406f64/src/band.js#L26
  //   let yHeightWithMaxBand = Math.max(1, selectedQIDs.length - paddingInner + paddingOuter * 2) * maxBandwidth / (1 - paddingInner)
  //
  //   let yStop = Math.min(height, yHeightWithMaxBand + xAxisTopHeight)
  //
  //   // CALCULATE Y SCALE
  //   yScale = d3.scaleBand()
  //     .range([xAxisTopHeight, yStop])
  //     .paddingInner(paddingInner)
  //     .paddingOuter(paddingOuter)
  //     .domain(selectedQIDs)
  //
  //   // UPDATE Y AXIS
  //   let yAxisScale = yScale.copy()
  //   yAxisScale.domain(selectedQIDs.map(function (qID) { return shorttexts[qID] }))
  //   let yAxis = d3.axisLeft()
  //     .tickSize(3)
  //     .scale(yAxisScale)
  //
  //   let oldYAxisWidth = Math.max(50, yAxisReferenceElement.node().getBBox().width)
  //   yAxisReferenceElement.call(yAxis)
  //   yAxisWidth = Math.max(50, yAxisReferenceElement.node().getBBox().width)
  //
  //   if (firstUpdate) {
  //     oldYAxisWidth = yAxisWidth
  //   }
  //
  //   yAxisElement.interrupt().selectAll('*').interrupt()
  //
  //   yAxisElement
  //     .transition(elTransition)
  //       .attr('transform', 'translate(' + yAxisWidth + ', 0)')
  //       .call(yAxis)
  //
  //   yAxisElement.selectAll('.y.axis text')
  //     .on('mouseover',
  //       function (d, i) {
  //         tooltipOver(i)
  //         setToHoverColor(i)
  //       })
  //     .on('mouseout',
  //       function (d, i) {
  //         tooltipOut()
  //         setToNormalColor(i)
  //       })
  //
  //   // CALCULATE X SCALE
  //   xScale = d3.scaleLinear()
  //     .domain([0, 100]) // TODO define range in producer
  //     .range([0, width - yAxisWidth])
  //
  //   // UPDATE X AXIS TOP
  //   let xAxisTop = d3.axisTop()
  //     .scale(xScale)
  //     .ticks(20, 'd')
  //     .tickSizeInner(0)
  //
  //   let xAxisTopElement = d3.selectAll('g.x.axis.top')
  //
  //   xAxisTopElement.interrupt().selectAll('*').interrupt()
  //
  //   xAxisTopElement.transition(elTransition)
  //     .attr('transform', 'translate(' + yAxisWidth + ',' + xAxisTopHeight + ')')
  //     .call(xAxisTop)
  //
  //   d3.selectAll('.x-top-description')
  //     .transition(elTransition)
  //       .attr('transform', 'translate(' + (width - yAxisWidth) / 2 + ', -20)')
  //
  //   // UPDATE X AXIS BOTTOM
  //   let xAxisBottom = d3.axisBottom()
  //     .scale(xScale)
  //     .ticks(20, 'd')
  //     .tickSizeInner(-(yStop - xAxisTopHeight))
  //
  //   let xAxisBottomElement = d3.selectAll('g.x.axis.bottom')
  //
  //   xAxisBottomElement.interrupt().selectAll('*').interrupt()
  //
  //   xAxisBottomElement.transition(elTransition)
  //     .attr('transform', 'translate(' + yAxisWidth + ',' + (yStop) + ')')
  //     .call(xAxisBottom)
  //
  //   d3.selectAll('.x-bottom-description')
  //     .transition(elTransition)
  //     .attr('transform', 'translate(' + (width - yAxisWidth) / 2 + ', 28)')
  //
  //   // BARS
  //   let bars = chart.selectAll('.bar')
  //     .data(selectedQIDs)
  //
  //   // remove old bars
  //   bars.exit().remove()
  //
  //   // add new bars
  //   bars.enter().append('g')
  //     .classed('bar', true)
  //     .attr('transform', function (d, i) { return 'translate(' + (oldYAxisWidth + 1) + ',' + yScale(d) + ')' })
  //     .append('rect')
  //       .classed('barrect', true)
  //       .attr('height', yScale.bandwidth())
  //       .style('fill', function (d, i) { return dax.profile.colorForValue(getMean(i, selectedOption), meanReferences[getQid(i)], directions[getQid(i)]) })
  //       .attr('width', function (d, i) { return firstUpdate ? xScale(getMean(i, selectedOption)) + 1 : 0 })
  //       .on('mouseover',
  //         function (d) {
  //           let i = selectedQIDs.indexOf(d)
  //           tooltipOver(i)
  //           setToHoverColor(i)
  //         })
  //       .on('mouseout',
  //         function (d) {
  //           let i = selectedQIDs.indexOf(d)
  //           tooltipOut()
  //           setToNormalColor(i)
  //         })
  //
  //   // animate all bars into position
  //   bars = d3.selectAll('.bar')
  //
  //   bars.interrupt().selectAll('*').interrupt()
  //
  //   bars
  //     .transition(elTransition)
  //     .attr('transform', function (d, i) { return 'translate(' + (yAxisWidth + 1) + ',' + yScale(d) + ')' })
  //
  //   bars.select('.barrect')
  //     .transition(elTransition)
  //       .style('fill', function (d, i) { return dax.profile.colorForValue(getMean(i, selectedOption), meanReferences[getQid(i)], directions[getQid(i)]) })
  //       .attr('height', yScale.bandwidth())
  //       .attr('width', function (d, i) { return xScale(getMean(i, selectedOption)) + 1 })
  //
  //   // REFERENCE LINES
  //   let referenceWidth = 2
  //   let referenceExtraHeight = 4
  //   let referenceHeight = yScale.bandwidth() + referenceExtraHeight
  //
  //   let references = chart.selectAll('.reference')
  //     .data(selectedQIDs)
  //
  //   // remove old reference lines
  //   references.exit().remove()
  //
  //   // add new reference lines
  //   references.enter().append('g')
  //     .classed('reference', true)
  //     .on('mouseover',
  //       function (d) {
  //         let i = selectedQIDs.indexOf(d)
  //         tooltipOver(i)
  //         setToHoverColor(i)
  //       })
  //     .on('mouseout',
  //       function (d) {
  //         let i = selectedQIDs.indexOf(d)
  //         tooltipOut()
  //         setToNormalColor(i)
  //       })
  //     .attr('transform', function (d, i) { return 'translate(' + (yAxisWidth + xScale(meanReferences[getQid(i)]) - referenceWidth / 2) + ',' + (yScale(d) - referenceExtraHeight / 2) + ')' })
  //     .style('shape-rendering', 'crispEdges')
  //     .append('rect')
  //       .classed('reference-line', true)
  //       .attr('width', referenceWidth)
  //       .attr('height', referenceHeight)
  //     .append('rect') // invisible rect for mouseover
  //       .classed('reference-line-box', true)
  //       .attr('transform', 'translate(-1, -1)')
  //       .attr('width', referenceWidth + 2)
  //       .attr('height', referenceHeight + 2)
  //       .attr('opacity', '0')
  //
  //   // update all reference lines
  //
  //   references = d3.selectAll('.reference')
  //
  //   references.interrupt().selectAll('*').interrupt()
  //
  //   references
  //     .transition(elTransition)
  //       .attr('transform', function (d, i) { return 'translate(' + (yAxisWidth + xScale(meanReferences[d]) - referenceWidth / 2) + ',' + (yScale(d) - referenceExtraHeight / 2) + ')' })
  //
  //   references.select('.reference-line')
  //     .transition(elTransition)
  //       .attr('width', referenceWidth)
  //       .attr('height', referenceHeight)
  //
  //   references.selectAll('.reference-line-box')
  //     .transition(elTransition)
  //     .attr('width', referenceWidth + 2)
  //     .attr('height', referenceHeight + 2)
  //
  //   // repopulate the description box and reset the tooltip
  //   if (selectedQIDs.length > 0) {
  //     tooltipOver(Math.min(lastHoveredBar, selectedQIDs.length - 1))
  //   } else {
  //     d3.selectAll('#chart-description')
  //       .style('opacity', '0')
  //   }
  //   tooltipOut()
  //
  //   // HEADER SELECT
  //   let headerSelectDiv = d3.select('.header-select-div')
  //   let headerSelect = d3.select('.header-select')
  //
  //   let options = headerSelect.selectAll('option')
  //       .data(perspectiveOptions, function (d) { return d })
  //
  //   options.exit().remove()
  //
  //   options.enter()
  //     .append('option')
  //       .text(function (d) { return d })
  //       .attr('value', function (d, i) { return i })
  //
  //   let barAreaWidth = (width - yAxisWidth)
  //   let selectWidth = headerSelect.node().getBoundingClientRect().width
  //
  //   headerSelectDiv.interrupt()
  //
  //   headerSelectDiv
  //     .transition(elTransition)
  //       .style('margin-left', yAxisWidth + barAreaWidth / 2 - selectWidth / 2 + 'px')
  //
  //   headerSelect.node().selectedIndex = selectedOption
  //
  //   // FINISH
  //   updateStyles()
  // }

  // function updateStyles () {
  //   d3.selectAll('.axis .domain')
  //     .style('visibility', 'hidden')
  //
  //   d3.selectAll('.axis path, .axis line')
  //     .style('fill', 'none')
  //     .style('stroke', '#bbb')
  //     .style('shape-rendering', 'geometricPrecision')
  //
  //   d3.selectAll('text')
  //     .style('fill', '#555')
  //     .style('font', '12px sans-serif')
  //     .style('cursor', 'default')
  //
  //   d3.selectAll('.y path, .y line')
  //     .style('visibility', 'hidden')
  //
  //   d3.selectAll('.reference rect, .reference path')
  //     .style('fill', '#444')
  // }

  // function getSelectedQIDs (means, selectedOption) {
  //   const selected = []
  //   qIDs.forEach(function (qID, i) {
  //     if (!isNaN(means[i][selectedOption]) && means[i][selectedOption] !== -1) {
  //       selected.push(qID)
  //     }
  //   })
  //   return selected
  // }

  // EXPORTS

  // exports.generateListChart =
  //   function (
  //     qIDsArray,
  //     referencesMap,
  //     shorttextsMap,
  //     directionsMap,
  //     selectedSelectedOption) {
  //     qIDs = qIDsArray
  //     meanReferences = referencesMap
  //     shorttexts = shorttextsMap
  //     directions = directionsMap
  //
  //     selectedOption = selectedSelectedOption
  //
  //     computeDimensions()
  //
  //     generateChartElements()
  //     updateStyles()
  //   }

  // exports.generateImage = function () {
  //   let chartBB = d3.select('.chart').node().getBoundingClientRect()
  //
  //   let chartWidth = chartBB.width
  //   let chartHeight = d3.select('.x.axis.top').node().getBoundingClientRect().height +
  //                   d3.select('.x.axis.bottom').node().getBoundingClientRect().height
  //
  //   let doctype = '<?xml version="1.0" standalone="no"?>' +
  //     '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'
  //
  //   let svg = d3.select('svg').node()
  //
  //   let source = (new XMLSerializer()).serializeToString(svg)
  //
  //   let blob = new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' })
  //
  //   let url = window.URL.createObjectURL(blob)
  //
  //   let imgSelection = d3.select('body').append('img')
  //     .attr('width', chartWidth)
  //     .attr('height', chartHeight)
  //     .style('visibility', 'hidden')
  //
  //   let img = imgSelection.node()
  //
  //   img.onload = function () {
  //     let canvasChartSelection = d3.select('body').append('canvas')
  //       .attr('width', chartWidth)
  //       .attr('height', chartHeight)
  //       .style('visibility', 'hidden')
  //     let canvasChart = canvasChartSelection.node()
  //
  //     let chartCtx = canvasChart.getContext('2d')
  //     chartCtx.drawImage(img, 0, 0)
  //
  //     let headerText = perspectiveOptions[selectedOption]
  //     let headerPaddingTop = 5
  //     let headerFontSize = 16
  //     let headerPaddingBottom = 10
  //     let headerFont = 'bold ' + headerFontSize + 'px sans-serif'
  //     let headerHeight = headerPaddingTop + headerFontSize + headerPaddingBottom
  //
  //     let imgMargin = { top: 10, right: 20, bottom: 20, left: 10 }
  //
  //     let completeWidth = imgMargin.left + chartWidth + imgMargin.right
  //     let completeHeight = imgMargin.top + headerHeight + chartHeight + imgMargin.bottom
  //     let canvasCompleteSelection = d3.select('body').append('canvas')
  //       .attr('width', completeWidth + 'px')
  //       .attr('height', completeHeight + 'px')
  //       .style('visibility', 'hidden')
  //
  //     let canvasComplete = canvasCompleteSelection.node()
  //
  //     let ctx = canvasCompleteSelection.node().getContext('2d')
  //
  //     ctx.fillStyle = 'white'
  //     ctx.fillRect(0, 0, completeWidth, completeHeight)
  //     ctx.fillStyle = 'black'
  //
  //     ctx.font = headerFont
  //
  //     let headerWidth = ctx.measureText(headerText).width
  //
  //     let barAreaWidth = (width - yAxisWidth)
  //     let headerHorizontalShift = yAxisWidth + barAreaWidth / 2 - headerWidth / 2
  //
  //     ctx.fillText(headerText, headerHorizontalShift + imgMargin.left, headerPaddingTop + headerFontSize + imgMargin.top)
  //
  //     let sourceText = dax.text('imageWaterStamp') // TODO new text ID style
  //     let sourceFontHeight = 11
  //     ctx.font = sourceFontHeight + 'px sans-serif'
  //     ctx.fillStyle = '#555'
  //     // TODO unused: let sourceTextWidth = ctx.measureText(sourceText).width
  //     ctx.fillText(sourceText, 5, completeHeight - 5)
  //
  //     ctx.drawImage(canvasChart, imgMargin.left, imgMargin.top + headerHeight)
  //
  //     canvasComplete.toBlob(function (blob) {
  //       saveAs(blob, headerText + '.png')
  //     })
  //
  //     imgSelection.remove()
  //     canvasChartSelection.remove()
  //     canvasCompleteSelection.remove()
  //   }
  //
  //   img.src = url
  // }
})(window.dax = window.dax || {})
