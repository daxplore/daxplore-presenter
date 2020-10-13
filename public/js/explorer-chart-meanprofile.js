(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.meanprofile = namespace.chart.meanprofile || {}
  const exports = namespace.chart.meanprofile

  /** ** CHART TYPE AND INSTANCE VARIABLES ** **/

  // CONSTANTS
  const paddingInner = 0.3
  const paddingOuter = 0.3
  const tooltipBarArrowDistance = 6

  const referenceLineHoverWidth = 10 // width of the reference line mouseover area

  const xAxisTopHeight = 30
  const margin = { top: 0, right: 23, bottom: xAxisTopHeight, left: 10 }
  const elementTransition = d3.transition().duration(300).ease(d3.easeLinear)

  // SIZE VARIABLES
  let availableWidth = 600 // initial placeholder value
  let width = availableWidth

  // CURRENT CHART
  // HEADER
  let headerDiv, headerMain, headerSub
  // CHART
  let chart, chartContainer, chartG
  let bars
  let referenceLine, referenceLineMouseArea
  let tooltipArrow, tooltipBody

  // SCALES AND AXISES
  let xScale
  let xAxisTop, xAxisTopElement, xAxisTopDescription
  let xAxisBottom, xAxisBottomElement, xAxisBottomDescription
  let yScale, yAxis, yAxisElement, yAxisReferenceElement
  let yAxisWidth = 50

  // STATE TRACKING
  let animateNextUpdate = false

  let questionID, perspectives, selectedPerspectiveOptions, questionReferenceValue, questionReferenceDirection
  let selectedOptionsData, selectedOptionsDataMap

  /** ** EXPORTED FUNCTIONS ** **/

  exports.initializeResources = function () {
    // INITIALIZE HEADER
    headerDiv = d3.select('.header-section').append('div')
      .attr('class', 'header-section__meanprofile')
    headerMain = headerDiv.append('div')
      .attr('class', 'header-section__main')
    headerSub = headerDiv.append('div')
      .attr('class', 'header-section__sub')

    // INITIALIZE CHART
    // base div element
    chartContainer = d3.select('.chart').append('div')
      .attr('class', 'explorer-meanprofile')

    // base svg element
    chart = chartContainer.append('svg')

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
        const optSplit = opt.split('|')
        switch (optSplit[0]) {
        case 'HEADER': return dax.data.getPerspectivesOptionTexts(perspectives.slice(0, 1), optSplit[1])
        case 'DATA': return dax.data.getPerspectivesOptionTexts(perspectives, optSplit[1]).slice(-1)
        }
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
    referenceLine = chartG.append('line')
      .attr('class', 'reference-line')
      .style('stroke', '#666')
      .style('stroke-width', '3.2px')
      .style('stroke-linecap', 'square')
      .style('stroke-dasharray', '4,8')
      .style('shape-rendering', 'crispedges')

    referenceLineMouseArea = chartG.append('rect')
      .style('opacity', 0)
      .attr('width', referenceLineHoverWidth)
      .on('mouseover', tooltipOverReferenceLine)
      .on('mousemove', tooltipReferenceLineMove)
      .on('mouseout', function () {
        tooltipOut()
        referenceLine.style('stroke', '#666')
      })

    // TOOLTIPS
    tooltipArrow = chartContainer.append('div')
      .classed('meanprofile__tooltip-arrow', true)
      .style('opacity', 0)
    tooltipBody = chartContainer.append('div')
      .classed('meanprofile__tooltip-body', true)
      .style('opacity', 0)
  }

  exports.populateChart = function (questionIDInput, perspectivesInput, selectedPerspectiveOptionsInput) {
    displayChartElements(true)

    // Animate the update unless the perspective has changed.
    // As long as the perspective is the same, each bar represents a specific perspective option
    // which gives continuity for the user. But of the perspective change, the contextual meaning
    // of the bars and color changes.
    // animateNextUpdate = JSON.stringify(perspectivesInput) === JSON.stringify(perspectives)
    animateNextUpdate = true

    // Arguments
    questionID = questionIDInput
    perspectives = perspectivesInput
    selectedPerspectiveOptions = selectedPerspectiveOptionsInput
    questionReferenceValue = dax.data.getMeanReference(questionID)
    questionReferenceDirection = dax.data.getMeanReferenceDirection(questionID)

    // DATA
    // Restructure the input data that can be used in a d3 join
    selectedOptionsData = []
    selectedOptionsDataMap = {}
    let secondarySection = -1
    selectedPerspectiveOptions.forEach(function (option, i) {
      if (perspectives.length === 2) {
        const newSecondarySection = Math.floor(option / dax.data.getQuestionOptionCount(perspectives[1]))
        if (secondarySection !== newSecondarySection) {
          secondarySection = newSecondarySection
          selectedOptionsData.push({
            index: secondarySection,
            nodata: true,
            type: 'HEADER',
          })
        }
      }
      const stat = dax.data.getMean(questionID, perspectives, option)
      const mean = stat.mean
      const count = stat.count
      const optionData = {
        count: count,
        index: option,
        mean: mean,
        nodata: mean === -1 && count === 0,
        type: 'DATA',
      }
      selectedOptionsData.push(optionData)
      selectedOptionsDataMap[option] = optionData
    })

    // UPDATE HEADER
    const shortText = dax.data.getQuestionShortText(questionID)
    const longText = dax.data.getQuestionFullText(questionID)
    headerMain.text(shortText)
    headerSub
      .text(longText)
      .style('display', longText === '' || shortText === longText ? 'none' : null)

    // X AXIS
    xScale.domain([0, 100]) // TODO define range in producer

    // Y AXIS
    yScale.domain(selectedOptionsData.map(function (opt) {
      return opt.type + '|' + opt.index
    }))
    yAxis.scale(yScale)
  }

  // Set the size available for the chart.
  // Updates the chart so it fits in the new size.
  exports.setSize = function (availableWidthInput) {
    animateNextUpdate = availableWidth === availableWidthInput
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

  function resizeAndPositionElements () {
    // CANCEL ALL PREVIOUS ANIMATIONS
    chart.interrupt().selectAll('*').interrupt()

    // CALCULATE HEIGHT
    const bandWidth = 20
    // rearranged equation from d3's source file band.js, ignoring the floor call
    // https://github.com/d3/d3-scale/blob/fd07dd8ceeaeaec612f675050ac134243b406f64/src/band.js#L26
    const barSectionHeight = Math.max(1, selectedPerspectiveOptions.length - paddingInner + paddingOuter * 2) * bandWidth / (1 - paddingInner)
    const yStop = barSectionHeight + xAxisTopHeight

    // UPDATE Y
    switch (perspectives.length) {
    case 1:
      yScale.range([xAxisTopHeight, yStop])
      break
    case 2:
      // offset for header translate in css file: .meanprofile__y-tick-header
      yScale.range([xAxisTopHeight - 10, yStop])
      break
    }

    yAxisElement.interrupt().selectAll('*').interrupt()

    let oldYAxisWidth = yAxisWidth
    yAxisReferenceElement.call(yAxis)

    yAxisReferenceElement.selectAll('.tick')
    .classed('meanprofile__y-tick', true)
    .classed('meanprofile__y-tick-header', function (d, i) {
      return d.split('|')[0] === 'HEADER'
    })

    yAxisWidth = Math.max(50, yAxisReferenceElement.node().getBoundingClientRect().width)

    if (!animateNextUpdate) {
      oldYAxisWidth = yAxisWidth
    }

    conditionalApplyTransition(yAxisElement, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + yAxisWidth + ', 0)')
      .call(yAxis)

    yAxisElement.selectAll('.tick')
      .classed('meanprofile__y-tick', true)
      .classed('meanprofile__y-tick-header', function (d, i) {
        return d.split('|')[0] === 'HEADER'
      })

    yAxisElement.selectAll('.y.axis text')
      .on('mouseover',
        function (opt) {
          const optSplit = opt.split('|')
          if (optSplit[0] === 'DATA') {
            const option = selectedOptionsDataMap[optSplit[1]]
            tooltipOverBar(option)
          }
        })
      .on('mousemove', tooltipBarMove)
      .on('mouseout', tooltipOut)
      .classed('meanprofile__y-tick', true)
      .classed('meanprofile__y-tick-header', function (d, i) {
        return d.split('|')[0] === 'HEADER'
      })

    // CALCULATE WIDTH
    const minBarLength = Math.max(300, xAxisTopDescription.node().getBBox().width, xAxisBottomDescription.node().getBBox().width)
    const chartNeededWidth = margin.left + margin.right + yAxisWidth + minBarLength

    // Check if vertical scroll is neededa
    const scrollNeeded = availableWidth < chartNeededWidth

    // Enable or disable scroll on the div containing the meanbars chart
    d3.select('.chart')
      .classed('chart-scroll', scrollNeeded)
      .style('width', function () { return scrollNeeded ? availableWidth + 'px' : null })

    // Update width of the chart, which may be bigger than the available space if scrolling is enabled
    width = scrollNeeded ? chartNeededWidth : availableWidth

    // SET MAIN ELEMENT WIDTH AND HEIGHT
    conditionalApplyTransition(chart, elementTransition, animateNextUpdate)
      .attr('width', width)
      .attr('height', yStop + margin.top + margin.bottom)

    width = width - margin.left - margin.right

    // UPDATE X SCALE
    xScale.range([0, width - yAxisWidth])

    // UPDATE X TOP
    xAxisTopElement.interrupt().selectAll('*').interrupt()

    conditionalApplyTransition(xAxisTopElement, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + yAxisWidth + ',' + xAxisTopHeight + ')')
      .call(xAxisTop)

    xAxisTopDescription.attr('transform', 'translate(' + (width - yAxisWidth) / 2 + ', -20)')

    // UPDATE X BOTTOM
    xAxisBottom.tickSizeInner(-(yStop - xAxisTopHeight))

    xAxisBottomElement.interrupt().selectAll('*').interrupt()

    conditionalApplyTransition(xAxisBottomElement, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + yAxisWidth + ',' + yStop + ')')
      .call(xAxisBottom)

    xAxisBottomDescription.attr('transform', 'translate(' + (width - yAxisWidth) / 2 + ', 28)')

    // BARS
    bars = chartG.selectAll('.bar')
      .data(
        selectedOptionsData, // data
        function (option) { // key function, mapping a specific DOM element to a specific option index
          switch (option.type) {
          case 'HEADER': return perspectives.slice(0, 1) + '-' + option.index
          case 'DATA': return perspectives.join(',') + '-' + option.index
          }
        }
      )

    // remove old bars
    bars.exit().remove()

    // add new bars
    bars.enter().append('g')
      .classed('bar', true)
      .attr('transform', function (option) { return 'translate(' + (oldYAxisWidth + 1) + ',' + yScale(option.type + '|' + option.index) + ')' })
      .append('rect')
        .classed('barrect', true)
        .attr('height', yScale.bandwidth())
        .style('fill', function (option) {
          return dax.profile.colorForValue(option.mean, questionReferenceValue, questionReferenceDirection)
        })
        .attr('width', function (option) { return animateNextUpdate && !option.nodata ? xScale(option.mean) + 1 : 0 })
        .on('mouseout', function (option) { tooltipOut() })
        .on('mouseover', function (option) { tooltipOverBar(option) })
        .on('mousemove', tooltipBarMove)

    // animate all bars into position
    bars = d3.selectAll('.bar')

    bars.interrupt().selectAll('*').interrupt()

    conditionalApplyTransition(bars, elementTransition, animateNextUpdate)
      .attr('transform', function (option) { return 'translate(' + (yAxisWidth + 1) + ',' + yScale(option.type + '|' + option.index) + ')' })

    conditionalApplyTransition(bars.select('.barrect'), elementTransition, animateNextUpdate)
      .style('fill', function (option) { return dax.profile.colorForValue(option.mean, questionReferenceValue, questionReferenceDirection) })
      .attr('height', yScale.bandwidth())
      .attr('width', function (option) {
        return option.nodata ? 0 : xScale(option.mean) + 1
      })

    // REFERENCE LINE
    const referenceXPosition = yAxisWidth + xScale(questionReferenceValue)
    conditionalApplyTransition(referenceLine, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + referenceXPosition + ',' + 0 + ')')
      .attr('y1', xAxisTopHeight + 5)
      .attr('y2', yStop - 5)
    referenceLine.raise()

    referenceLineMouseArea
      .attr('x', referenceXPosition - referenceLineHoverWidth / 2)
      .attr('y', xAxisTopHeight)
      .attr('height', yStop - xAxisTopHeight)
      .raise()
  }

  // Populate, position and show tooltip on mouse hover on bar
  function tooltipOverBar (option) {
    tooltipBody.style('opacity', 1)
    tooltipArrow.style('opacity', 1)

    // Set tooltip box text
    // TODO This relies on meanbars texts, rather than meanprofile texts. Merge or create as separate?
    const optionName = dax.data.getPerspectivesOptionTexts(perspectives, option.index).join(', ')
    let tooltipText = '<b>' + optionName + '</b><br>'
    if (option.nodata) {
      tooltipText += dax.text('meanbars_tooltip_fewRespondents', 10) + '<br>' // TODO hardcoded 10, should be read from settings generated by Daxplore Producer
      tooltipText += '<b>' + dax.text('meanbars_tooltip_missingData') + '</b>'
    } else {
      tooltipText += dax.text('meanbars_tooltip_mean', dax.common.integerFormat(option.mean)) + '<br>' +
      dax.text('meanbars_tooltip_respondents', option.count)
    }
    // Update tooltip position, color and visibility
    const chartTop = chart.node().getBoundingClientRect().top + window.pageYOffset + margin.top

    tooltipArrow
      .classed('meanprofile__tooltip-arrow--right', false)
      .classed('meanprofile__tooltip-arrow--up', true)
      .style('border-bottom-color', option.nodata ? '#DDD' : dax.profile.colorTooltipBackground(option.mean, questionReferenceValue, questionReferenceDirection))
      .style('border-left-color', null)
      .style('top', (chartTop + yScale(option.type + '|' + option.index) + yScale.bandwidth() + tooltipBarArrowDistance) + 'px')

    tooltipBody.html(tooltipText) // TODO construct elements via d3 instead of string->html

    const tooltipArrowBB = tooltipArrow.node().getBoundingClientRect()
    tooltipBody
      .style('background-color', option.nodata ? '#DDD' : dax.profile.colorTooltipBackground(option.mean, questionReferenceValue, questionReferenceDirection)) // TODO externalize no data color
      .style('top', (chartTop + yScale(option.type + '|' + option.index) + yScale.bandwidth() + tooltipBarArrowDistance + tooltipArrowBB.height) + 'px')

    bars.selectAll('.barrect')
      .style('fill', function (opt) {
        if (opt.index === option.index) {
          return dax.profile.colorHoverForValue(opt.mean, questionReferenceValue, questionReferenceDirection)
        }
        return dax.profile.colorForValue(opt.mean, questionReferenceValue, questionReferenceDirection)
      })

    yAxisElement.selectAll('.tick')
      .classed('meanprofile__y-axis--hover', function (opt) {
        return opt === option.index
      })

    tooltipBarMove()
  }

  // Update tooltip X position on bar
  function tooltipBarMove () {
    const tooltipBodyBB = tooltipBody.node().getBoundingClientRect()
    const tooltipArrowBB = tooltipArrow.node().getBoundingClientRect()
    let mouseX = d3.event.pageX
    if (tooltipBodyBB.width / 2 + mouseX > window.innerWidth) {
      mouseX = window.innerWidth - tooltipBodyBB.width / 2
    }
    tooltipBody.style('left', (mouseX - tooltipBodyBB.width / 2) + 'px')
    tooltipArrow.style('left', (mouseX - tooltipArrowBB.width / 2) + 'px')
  }

  // Populate, position and show tooltip on mouse hover on reference line
  function tooltipOverReferenceLine () {
    tooltipBody.style('opacity', 1)
    tooltipArrow.style('opacity', 1)

    const chartLeft = chart.node().getBoundingClientRect().left + window.pageXOffset + margin.left + yAxisWidth

    tooltipBody.html('')
    tooltipBody.append('span')
      .attr('class', 'meanprofile__reference-tooltip-header')
      .text(dax.text('meanbars_tooltip_referenceValue')) // TODO externalize as meanprofile
    tooltipBody.append('span')
      .text(dax.common.integerFormat(questionReferenceValue))

    const tooltipBodyBB = tooltipBody.node().getBoundingClientRect()
    const tooltipArrowBB = tooltipArrow.node().getBoundingClientRect()

    tooltipBody
      .style('background-color', dax.profile.colorTooltipBackground(0, 0))
      .style('left', (chartLeft + xScale(questionReferenceValue) - tooltipBodyBB.width - tooltipArrowBB.width - tooltipBarArrowDistance) + 'px')

    tooltipArrow
      .style('border-left-color', dax.profile.colorTooltipBackground(0, 0))
      .style('border-bottom-color', null)
      .classed('meanprofile__tooltip-arrow--right', true)
      .classed('meanprofile__tooltip-arrow--up', false)
      .style('left', (chartLeft + xScale(questionReferenceValue) - tooltipArrowBB.width - tooltipBarArrowDistance) + 'px')

    referenceLine.style('stroke', '#454545')
  }

  // Update tooltip X position on bar
  function tooltipReferenceLineMove () {
    const tooltipBodyBB = tooltipBody.node().getBoundingClientRect()
    const tooltipArrowBB = tooltipArrow.node().getBoundingClientRect()
    tooltipBody.style('top', (d3.event.pageY - tooltipBodyBB.height / 2) + 'px')
    tooltipArrow.style('top', (d3.event.pageY - tooltipArrowBB.height / 2) + 'px')
  }

  // Hide all tooltip components
  function tooltipOut () {
    tooltipBody.style('opacity', 0)
    tooltipArrow.style('opacity', 0)

    bars.selectAll('.barrect')
      .style('fill', function (opt) {
        return dax.profile.colorForValue(opt.mean, questionReferenceValue, questionReferenceDirection)
      })

    yAxisElement.selectAll('.tick')
      .classed('meanprofile__y-axis--hover', false)
  }

  // Helper
  function conditionalApplyTransition (selection, transition, useTransition) {
    return useTransition ? selection.transition(transition) : selection
  }

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
