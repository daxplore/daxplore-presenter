(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.meanprofile = namespace.chart.meanprofile || {}
  const exports = namespace.chart.meanprofile

  /** ** CHART TYPE AND INSTANCE VARIABLES ** **/

  // CONSTANTS
  const paddingInner = 0.3
  const paddingOuter = 0.3
  const tooltipBarArrowDistance = 7

  const referenceLineHoverWidth = 10 // width of the reference line mouseover area

  const xAxisTopHeight = 30
  const margin = { top: 0, right: 23, bottom: xAxisTopHeight + 2, left: 10 }
  const elementTransition = d3.transition().duration(300).ease(d3.easeLinear)

  // SIZE VARIABLES
  const saveImageWidth = 600
  let availableWidth = 600 // initial placeholder value
  let width = availableWidth
  let tallestChartSoFar = 0

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

  // BUTTONS
  let saveImageButton

  // STATE TRACKING
  let animateNextUpdate = false

  let questionID, perspectives, selectedPerspectiveOptions, questionReferenceValue, questionReferenceDirection
  let selectedOptionsData, selectedOptionsDataMap

  /** ** EXPORTED FUNCTIONS ** **/

  exports.initializeResources =
  function () {
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

    yAxisReferenceElement = chartG.append('g')
      .classed('y', true)
      .classed('axis', true)
      .style('opacity', 0)

    yAxisElement = chartG.append('g')
      .classed('y', true)
      .classed('axis', true)

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
      .text(dax.text('explorer.chart.mean_bar_vertical.x_axis_description'))

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
      .text(dax.text('explorer.chart.mean_bar_vertical.x_axis_description'))

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
    tooltipBody = chartContainer.append('div')
      .classed('meanprofile__tooltip-body', true)
      .style('opacity', 0)
    tooltipArrow = chartContainer.append('div')
      .classed('meanprofile__tooltip-arrow', true)
      .style('opacity', 0)

    // SAVE IMAGE BUTTON
    saveImageButton = d3.select('.chart-panel').append('div')
      .classed('dashed-button', true)
      .classed('meanprofile__save-image', true)
      .on('click', generateImage)
      .text(dax.text('common.button.save_chart_as_image'))
  }

  exports.populateChart =
  function (questionIDInput, perspectivesInput, selectedPerspectiveOptionsInput) {
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
    let firstOptionData = null
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
      if (firstOptionData === null) {
        firstOptionData = optionData
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

    // DESCRIPTION
    if (firstOptionData !== null && firstOptionData.type === 'DATA') {
      dax.explorer.setReferenceDescription(questionID, firstOptionData.mean)
    }
  }

  // Set the size available for the chart.
  // Updates the chart so it fits in the new size.
  exports.setSize =
  function (availableWidthInput) {
    animateNextUpdate = availableWidth === availableWidthInput
    availableWidth = availableWidthInput
    resizeAndPositionElements()
  }

  // Hide all meanbars chart elements
  // Called whenever the entire chart should be hidden, so that another chart type can be dislpayed
  exports.hide =
  function () {
    displayChartElements(false)
  }

  /** ** INTERNAL FUNCTIONS ** **/

  // Hide or show all top level elements: header, chart and legend
  function displayChartElements (show) {
    headerDiv.style('display', show ? null : 'none')
    chartContainer.style('display', show ? null : 'none')
    // legendDiv.style('display', show ? null : 'none')
    saveImageButton.style('display', show ? null : 'none')
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

    yAxisWidth = Math.max(50, yAxisReferenceElement.node().getBBox().width)

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
    chart
      .attr('width', width)

    // Skip animation if it would result in an iframe resize
    const newHeight = yStop + margin.top + margin.bottom
    const isSmaller = newHeight <= tallestChartSoFar
    tallestChartSoFar = Math.max(newHeight, tallestChartSoFar)
    conditionalApplyTransition(chart, elementTransition, animateNextUpdate && isSmaller)
      .attr('height', newHeight)

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
          return dax.colors.colorForValue(option.mean, questionReferenceValue, questionReferenceDirection)
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
      .style('fill', function (option) { return dax.colors.colorForValue(option.mean, questionReferenceValue, questionReferenceDirection) })
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

    updateStyles()
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
      const cutoff = dax.settings('export.statistics.group_cutoff')
      tooltipText += dax.text('explorer.chart.mean_bar_horizontal.tooltip.few_respondents', cutoff) + '<br>'
      tooltipText += '<b>' + dax.text('explorer.chart.mean_bar_horizontal.tooltip.missing_data') + '</b>'
    } else {
      tooltipText += '<span style="color:'
      tooltipText += dax.colors.colorTextForValue(option.mean, questionReferenceValue, questionReferenceDirection)
      tooltipText += ';font-weight:bold">' + dax.text('explorer.chart.mean_bar_horizontal.tooltip.mean', dax.common.integerFormat(option.mean)) + '</span>'
      tooltipText += '<br>'
      tooltipText += dax.text('explorer.chart.mean_bar_horizontal.tooltip.respondents', option.count)
    }

    tooltipArrow
      .classed('meanprofile__tooltip-arrow--right', false)
      .classed('meanprofile__tooltip-arrow--down', true)
      .style('border-bottom-color', option.nodata ? '#DDD' : dax.colors.colorTooltipBackground(option.mean, questionReferenceValue, questionReferenceDirection))
      .style('border-left-color', null)
      .style('top', (yScale(option.type + '|' + option.index) - tooltipBarArrowDistance) + 'px')

    tooltipBody.html(tooltipText) // TODO construct elements via d3 instead of string->html

    const tooltipArrowBB = tooltipArrow.node().getBoundingClientRect()

    bars.selectAll('.barrect')
      .style('fill', function (opt) {
        if (opt.index === option.index) {
          return dax.colors.colorHoverForValue(opt.mean, questionReferenceValue, questionReferenceDirection)
        }
        return dax.colors.colorForValue(opt.mean, questionReferenceValue, questionReferenceDirection)
      })

    yAxisElement.selectAll('.tick')
      .classed('meanprofile__y-axis--hover', function (opt) {
        const optSplit = opt.split('|')
        return optSplit[0] === 'DATA' && parseInt(optSplit[1]) === option.index
      })

    const tooltipBodyBB = tooltipBody.node().getBoundingClientRect()
    tooltipBody
      .style('top', (yScale(option.type + '|' + option.index) - tooltipBodyBB.height - tooltipBarArrowDistance + tooltipArrowBB.height / 2 - 2) + 'px')

    tooltipBarMove()
    if (option.type === 'DATA') {
      dax.explorer.setReferenceDescription(questionID, option.mean)
    }
  }

  // Update tooltip X position on bar
  function tooltipBarMove () {
    const tooltipBodyBB = tooltipBody.node().getBoundingClientRect()
    const tooltipArrowBB = tooltipArrow.node().getBoundingClientRect()
    const chartLeft = chart.node().getBoundingClientRect().left + window.pageXOffset
    let mouseX = d3.event.pageX - chartLeft
    if (mouseX - tooltipBodyBB.width / 2 < 0) {
      mouseX = tooltipBodyBB.width / 2
    }
    if (mouseX + tooltipBodyBB.width / 2 > width) {
      mouseX = width - tooltipBodyBB.width / 2
    }
    tooltipBody.style('left', (mouseX - tooltipBodyBB.width / 2) + 'px')
    tooltipArrow.style('left', (mouseX - tooltipArrowBB.width / 2) + 'px')
  }

  // Populate, position and show tooltip on mouse hover on reference line
  function tooltipOverReferenceLine () {
    tooltipBody.style('opacity', 1)
    tooltipArrow.style('opacity', 1)

    tooltipBody.html('')
    tooltipBody.append('span')
      .attr('class', 'meanprofile__reference-tooltip-header')
      .text(dax.text('explorer.chart.mean_bar_horizontal.tooltip.reference_value'))
    tooltipBody.append('span')
      .text(dax.common.integerFormat(questionReferenceValue))

    const tooltipBodyBB = tooltipBody.node().getBoundingClientRect()
    const tooltipArrowBB = tooltipArrow.node().getBoundingClientRect()
    const leftPosition = margin.left + yAxisWidth + xScale(questionReferenceValue) - tooltipBarArrowDistance

    tooltipBody
      .style('left', (leftPosition - tooltipBodyBB.width - tooltipArrowBB.width / 2 - 2) + 'px')

    tooltipArrow
      .style('border-bottom-color', null)
      .classed('meanprofile__tooltip-arrow--right', true)
      .classed('meanprofile__tooltip-arrow--down', false)
      .style('left', (leftPosition - tooltipArrowBB.width) + 'px')

    referenceLine.style('stroke', '#454545')
  }

  // Update tooltip X position on reference line
  function tooltipReferenceLineMove () {
    const tooltipBodyBB = tooltipBody.node().getBoundingClientRect()
    const tooltipArrowBB = tooltipArrow.node().getBoundingClientRect()
    const chartTop = chart.node().getBoundingClientRect().top + window.pageYOffset
    const mouseY = d3.event.pageY - chartTop + 5
    tooltipBody.style('top', (mouseY - tooltipBodyBB.height / 2) + 'px')
    tooltipArrow.style('top', (mouseY - tooltipArrowBB.height / 2 + 2) + 'px')
  }

  // Hide all tooltip components
  function tooltipOut () {
    tooltipBody.style('opacity', 0)
    tooltipArrow.style('opacity', 0)

    bars.selectAll('.barrect')
      .style('fill', function (opt) {
        return dax.colors.colorForValue(opt.mean, questionReferenceValue, questionReferenceDirection)
      })

    yAxisElement.selectAll('.tick')
      .classed('meanprofile__y-axis--hover', false)
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

  // Helper
  function conditionalApplyTransition (selection, transition, useTransition) {
    return useTransition ? selection.transition(transition) : selection
  }

  function generateImage () {
    const imageScaling = 2
    const leftAdjust = 10
    const widthAdjust = 10

    animateNextUpdate = false
    const initiaAvailablelWidth = availableWidth
    exports.setSize(saveImageWidth)

    const chartCopy = d3.select(chart.node().cloneNode(true))

    // Apply local font version
    chartCopy
      .append('defs')
      .append('style')
      .text(dax.fonts.getVartaBase64Definition())

    chartCopy.selectAll('text')
      .style('font-family', '"VartaBase64", "Varta", sans-serif')

    // Apply margins
    chartCopy.select('g').attr('transform', 'translate(' + (margin.left + leftAdjust) + ',' + margin.top + ')')

    const widthBefore = chartCopy.attr('width')
    chartCopy.attr('width', imageScaling * (Number(widthBefore) + widthAdjust))
    const heightBefore = chartCopy.attr('height')
    chartCopy.attr('height', imageScaling * Number(heightBefore))
    chartCopy.style('transform', 'scale(' + imageScaling + ')' +
      'translate(' + ((Number(widthBefore) + widthAdjust) / 2) + 'px,' + (Number(heightBefore) / 2) + 'px)')

    const doctype = '<?xml version="1.0" standalone="no"?>' +
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'

    const source = (new XMLSerializer()).serializeToString(chartCopy.node())
    const blob = new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const imgSelection = d3.select('body').append('img')
      .style('visibility', 'hidden')
      .style('border', '1px solid red')

    const img = imgSelection.node()

    img.onload = function () {
      const canvasChartSelection = d3.select('body').append('canvas')
        .attr('width', img.width)
        .attr('height', img.height)
        .style('visibility', 'hidden')

      const canvasChart = canvasChartSelection.node()

      const chartCtx = canvasChart.getContext('2d')
      chartCtx.drawImage(img, 0, 0)

      // const longText = dax.data.getQuestionFullText(questionID)
      // headerMain.text(shortText)
      // headerSub
      //   .text(longText)
      //   .style('display', longText === '' || shortText === longText ? 'none' : null)

      const headerText = dax.data.getQuestionShortText(questionID)
      const headerPaddingTop = 5 * imageScaling
      const headerFontSize = 16 * imageScaling
      const headerPaddingBottom = 10 * imageScaling
      const headerFont = 'bold ' + headerFontSize + 'px "Varta"'
      const headerHeight = headerPaddingTop + headerFontSize + headerPaddingBottom

      const imgMargin = { top: 1 * imageScaling, right: 10 * imageScaling, bottom: 20 * imageScaling, left: 10 * imageScaling }

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
      const barAreaWidth = completeWidth - yAxisSectionWidth - margin.right * imageScaling - imgMargin.right
      const headerHorizontalShift = yAxisSectionWidth + barAreaWidth / 2 - headerWidth / 2

      ctx.fillText(headerText, headerHorizontalShift, headerPaddingTop + headerFontSize + imgMargin.top)

      let watermarkText = dax.text('explorer.image.watermark')
      const date = new Date()
      watermarkText = watermarkText.replace(
        '{date}',
        date.getFullYear() + '-' +
        ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
        ('0' + date.getDate()).slice(-2))

      const fileName = dax.text('explorer.chart.mean_bar_vertical.image.filename')
        .replaceAll('{question}', headerText)
        .replaceAll('{perspective}', dax.data.getQuestionShortText(perspectives))
        .replaceAll('{date}',
          date.getFullYear() + '-' +
          ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
          ('0' + date.getDate()).slice(-2))

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
    exports.setSize(initiaAvailablelWidth)
  }
})(window.dax = window.dax || {})
