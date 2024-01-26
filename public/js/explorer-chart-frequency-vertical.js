(function (namespace) {
  namespace.chart = namespace.chart || {}
  namespace.chart.frequencyVertical = namespace.chart.frequencyVertical || {}
  const exports = namespace.chart.frequencyVertical

  /** CHART TYPE AND INSTANCE VARIABLES **/

  // CONSTANTS
  const bandWidth = 27
  const paddingInner = 0.2
  const paddingOuter = 0.3
  const tooltipBarArrowDistance = 7
  const xAxisTopHeight = 10
  const margin = { top: 10, right: 25, bottom: 20, left: 10 }
  const missingDataColor = d3.hsl('#BBB') // TODO externalize to producer?
  const saveImageCanvasWidth = 900
  const elementTransition = d3.transition().duration(300).ease(d3.easeLinear)

  // SIZE VARIABLES
  let availableWidth = 600 // initial placeholder value
  let width = availableWidth

  // CHART RESOURCES
  // HEADER
  let headerDiv, headerMain, headerSub
  // SCALES AND AXISES
  // let xScale, xAxis, xAxisElement
  let xScale, xAxisScale
  let xAxisBottom, xAxisBottomElement, xAxisTop, xAxisTopElement
  let yScale, yAxis, yAxisElement, yAxisReferenceElement
  let yAxisWidth = 0
  let zScaleColor
  // CHART
  let chartContainer, chart, chartG
  // LEGEND
  let legendDiv, legendQuestionHeader, legendQuestionOptionTable, legendMissingData
  // BUTTONS
  let saveImageButton
  // TOOLTIP
  let tooltipArrow, tooltipBody

  // STATE TRACKING
  let animateNextUpdate = false
  let populateCount = 0

  // CURRENT FREQUENCY CHART
  let question, perspectives, data
  let selectedPerspectiveOptions, optionKeys
  let highlightedQuestionOption
  let hasMissingData

  /** EXPORTED FUNCTIONS **/

  // Constructor, used to initialize the chart type.
  // Run once when the page is loaded. Call populateChart in order to update the chart content.
  exports.initializeResources =
  function (primaryColors) {
    // INITIALIZE HEADER
    headerDiv = d3.select('.header-section').append('div')
      .attr('class', 'header-section__freq-vertical')
    headerMain = headerDiv.append('div')
      .attr('class', 'header-section__main')
    headerSub = headerDiv.append('div')
      .attr('class', 'header-section__sub')

    // INITIALIZE CHART
    // base div element
    chartContainer = d3.select('.chart').append('div')
      .attr('class', 'explorer-freq-vertical')

    // base svg element
    chart = chartContainer.append('svg')
      .attr('class', 'explorer-freq-vertical')

    // white background
    chart.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'white')

    // margin adjusted chart element
    chartG = chart.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    // x axis bottom
    xScale = d3.scaleLinear()
      .rangeRound([0, width - 2])
      .domain([0, 1])

    xAxisScale = d3.scaleLinear()
      .rangeRound([0, width])
      .domain([0, 1])

    xAxisBottom = d3.axisBottom(xAxisScale)
      .tickFormat(d3.format('.0%'))
      .tickSize(0)

    xAxisBottomElement = chartG.append('g')
      .attr('class', 'axis freq-vertical--x-axis')
      .call(xAxisBottom)

    xAxisTop = d3.axisTop(xAxisScale)
      .tickFormat(d3.format('.0%'))
      .tickSize(0)
      .tickSizeInner(0)

    xAxisTopElement = chartG.append('g')
      .attr('class', 'axis freq-vertical-x-axis')
      .call(xAxisTop)

    // y axis
    yScale = d3.scaleBand()
      .paddingInner(paddingInner)
      .paddingOuter(paddingOuter)

    yAxis = d3.axisLeft(yScale)
      .tickSize(5)
      .tickFormat(function (opt) {
        const optSplit = opt.split('|')
        switch (optSplit[0]) {
        case 'HEADER': return dax.data.getPerspectivesOptionTexts(perspectives.slice(0, 1), Number(optSplit[1]))
        case 'DATA': return dax.data.getPerspectivesOptionTexts(perspectives, optSplit[1]).slice(-1)
        }
      })

    yAxisReferenceElement = chartG.append('g')
      .attr('class', 'axis freq-vertical-y-axis')
      .style('opacity', 0)

    yAxisElement = chartG.append('g')
      .attr('class', 'axis freq-vertical-y-axis')

    // z axis, color coding
    zScaleColor = d3.scaleOrdinal().range(primaryColors)

    // INITIALIZE TOOLTIPS
    const mouseoverWrapper = d3.select('.chart-mouseover-wrapper')
    tooltipBody = mouseoverWrapper.append('div')
      .classed('freq-vertical__tooltip-body', true)
      .style('opacity', 0)
    tooltipArrow = mouseoverWrapper.append('div')
      .classed('freq-vertical__tooltip-arrow', true)
      .style('opacity', 0)

    // INITIALIZE LEGEND
    // top level freqs legend container
    legendDiv = d3.select('.legend').append('div')
      .attr('class', 'freq-vertical__legend')

    // legend for the question and selected options
    legendQuestionHeader = legendDiv.append('h4')
      .attr('class', 'legend__header')
    legendQuestionOptionTable = legendDiv.append('div')
    legendMissingData = legendDiv.append('div')
      .attr('class', 'legend__row')
      .style('margin-top', '15px')
      .on('mouseover', function () {
        setHorizontalHighlight('MISSING_DATA')
        legendOptionMouseOver('MISSING_DATA')
      })
      .on('mouseout', function () {
        legendOptionMouseOut()
        unsetHorizontalHighlight()
      })
    legendMissingData.append('div')
      .attr('class', 'legend__color-square')
      .style('background-color', missingDataColor)
    legendMissingData.append('div')
      .attr('class', 'legend__row-text')
      .text(dax.text('explorer.chart.frequency_bar_vertical.legend.missing_data'))
      .attr('title', dax.text('explorer.chart.frequency_bar_vertical.legend.missing_data'))

    // SAVE IMAGE BUTTON
    // TODO create general save button manager
    saveImageButton = d3.select('.save-button-wrapper').append('div')
      .classed('dashed-button', true)
      .classed('freq-vertical__save-image', true)
      .on('click', generateImage)
      .text(dax.text('common.button.save_chart_as_image'))
  }

  // Set new data to be displayed by the chart.
  // As a side effect, make this chart visible.
  exports.populateChart =
  function (questionID, perspectivesInput, selectedPerspectiveOptionsInput) {
    displayChartElements(true)

    // ARGUMENT
    question = questionID
    perspectives = perspectivesInput
    selectedPerspectiveOptions = selectedPerspectiveOptionsInput

    // ANIMATIONS
    populateCount++
    animateNextUpdate = populateCount > 1

    // DATA
    hasMissingData = false
    optionKeys = dax.data.getOptionTexts(question)
    optionKeys.push('MISSING_DATA')

    // Restructure the input data
    data = []
    let secondarySection = -1
    selectedPerspectiveOptions.forEach(function (option) {
      if (perspectives.length === 2) {
        const newSecondarySection = Math.floor(option / dax.data.getQuestionOptionCount(perspectives[1]))
        if (secondarySection !== newSecondarySection) {
          secondarySection = newSecondarySection
          data.push({
            index: secondarySection,
            nodata: true,
            type: 'HEADER',
            rowKey: 'HEADER|' + secondarySection,
          })
        }
      }
      const stat = dax.data.getFrequency(questionID, perspectives, option)
      const total = stat.length > 0 ? stat.reduce(function (a, b) { return a + b }) : 0
      const stackData = {
        index: option,
        total: total,
        type: 'DATA',
        rowKey: 'DATA|' + option,
      }
      if (total === 0) {
        hasMissingData = true
        stackData.MISSING_DATA = 1
      } else {
        for (let j = 0; j < optionKeys.length; j++) {
          stackData[optionKeys[j]] = total !== 0 ? stat[j] / total : 0
        }
      }
      data.push(stackData)
    })

    const rowKeys = data.map(function (opt) { return opt.rowKey })

    // UPDATE HEADER
    const shortText = dax.data.getQuestionShortText(question)
    const longText = dax.data.getQuestionFullText(question)
    headerMain.text(shortText)
    headerSub
      .text(longText)
      .style('display', longText === '' || shortText === longText ? 'none' : null)

    // UPDATE Y
    yScale.domain(rowKeys)
    yAxis.scale(yScale)

    // UPDATE Z
    zScaleColor.domain(optionKeys)

    // UPDATE OPTION COLUMN
    const rowData = d3.stack().keys(optionKeys)(data)
    const questionOptioncols = chartG.selectAll('.freq-vertical-optioncol')
      .data(
        rowData, // data
        function (option) { // key function, mapping a specific DOM element to a specific option index
          return option.key + ';' + option.index
        }
      )

    // Remove old rows
    questionOptioncols.exit().remove()

    // add new rows
    questionOptioncols.enter().append('g')
      .classed('freq-vertical-optioncol', true)
      .attr('transform', 'translate(1.5, 0)')

    const sections = chartG.selectAll('.freq-vertical-optioncol').selectAll('.freq-vertical-optioncol-section')
      .data(
        function (d) {
          return d.map(function (v) {
            return {
              start: v[0],
              end: (isNaN(v[1]) ? v[0] : v[1]),
              key: d.key,
              index: v.data.index,
              rowKey: v.data.rowKey,
            }
          })
        }, // data
        function (option) {
          return option.rowKey + '|' + option.index
        } // key function, mapping a specific DOM element to a specific option index
      )

    sections.enter().append('rect')
      .classed('freq-vertical-optioncol-section', true)
      .attr('x', function (d) { return xScale(d.start) })
      .attr('y', function (d) { return yScale(d.rowKey) })
      .attr('height', yScale.bandwidth())
      .attr('width', function (d) { return xScale(d.end) - xScale(d.start) })
      .attr('fill', function (d) { return barFillColor(d.key, 0) })
      .attr('stroke', function (d) { return barStrokeColor(d.key, 0) })
      .attr('stroke-width', 1)
      .on('mouseover', function (d) {
        tooltipOverBar(d)
        // Set selected options
        highlightedQuestionOption = d.key
        // highlightedPerspectiveOption = d.index
        // Update legend highlight
        legendOptionMouseOver(highlightedQuestionOption)

        // Update mouseover color filter
        d3.select(this)
          .style('filter', 'brightness(0.93)')

        // Hover effect on tick texts
        yAxisElement.selectAll('.tick')
          .classed('freq-vertical__y-tick--hover', function (opt) {
            const optSplit = opt.split('|')
            return optSplit[0] === 'DATA' && parseInt(optSplit[1]) === d.index
          })
      })
      .on('mouseout', function (d) {
        tooltipOut()
        // Reset color filter
        d3.select(this)
          .style('filter', null)
        // Deselect any legend options
        legendOptionMouseOut()
        yAxisElement.selectAll('.tick')
          .classed('freq-vertical__y-tick--hover', false)
      })
      .on('mousemove', tooltipBarMove)

    // remove old sections
    sections.exit().remove()

    // UPDATE LEGEND
    // Update legend title
    legendQuestionHeader
      .text(dax.data.getQuestionShortText(question))

    // Set new data for the legend
    const optioncols = legendQuestionOptionTable.selectAll('.legend__row')
      .data([].concat(dax.data.getOptionTexts(question)).reverse())

    // Remove old rows
    optioncols.exit().remove()

    // Add new rows
    const optionEnter = optioncols.enter()
      .append('div')
        .attr('class', 'legend__row')
        .on('mouseover', function (option) {
          setHorizontalHighlight(option)
          legendOptionMouseOver(option)
        })
        .on('mouseout', function () {
          unsetHorizontalHighlight()
          legendOptionMouseOut()
        })
    optionEnter.append('div')
      .attr('class', 'legend__color-square')
    optionEnter.append('div')
      .attr('class', 'legend__row-text')

    // Reselect rows and use single-select to propagate data join to contained items
    // update color and text for each row
    const rows = legendQuestionOptionTable.selectAll('.legend__row')
    rows.select('.legend__color-square')
      .style('background-color', zScaleColor)
    rows.select('.legend__row-text')
      .text(function (option) { return option })
      .style('font-style', function (option) { return option.nodata ? 'italic' : null })
      .attr('title', function (option) { return option })

    // Missing data option, show or hide
    legendMissingData.style('display', hasMissingData ? null : 'none')
  }

  // Set the size available for the chart.
  // Updates the chart so it fits in the new size.
  // As a side effect, enable horizontal scrolling if needed for the chart to fit the given room.
  exports.setSize =
  function (availableWidthInput) {
    availableWidth = availableWidthInput
    resizeAndPositionElements()
  }

  // Hide all frequency chart elements
  // Called whenever the entire chart should be hidden, so that another chart type can be dislpayed
  exports.hide =
  function () {
    displayChartElements(false)
  }

  /** INTERNAL FUNCTIONS **/

  // Hide or show all top level elements: header, chart and legend
  function displayChartElements (show) {
    headerDiv.style('display', show ? null : 'none')
    chartContainer.style('display', show ? null : 'none')
    legendDiv.style('display', show ? null : 'none')
    saveImageButton.style('display', show ? null : 'none')
  }

  // Update the size and position of all chart elements.
  // Called when the content or the size is updated.
  function resizeAndPositionElements () {
    // CALCULATE HEIGHT
    // rearranged equation from d3's source file band.js, ignoring the floor call
    // https://github.com/d3/d3-scale/blob/fd07dd8ceeaeaec612f675050ac134243b406f64/src/band.js#L26
    const barSectionHeight = Math.max(1, data.length - paddingInner + paddingOuter * 2) * bandWidth / (1 - paddingInner)
    const yStop = barSectionHeight + xAxisTopHeight

    let longestPerspectiveOptionTextLength = 0
    yAxisElement.selectAll('text')
      .each(function () {
        if (this.getBBox().width > longestPerspectiveOptionTextLength) {
          longestPerspectiveOptionTextLength = this.getBBox().width
        }
      })

    // UPDATE Y-AXIS
    yAxisElement.interrupt().selectAll('*').interrupt()

    yAxisReferenceElement.call(yAxis)

    yAxisReferenceElement.selectAll('.tick')
      .classed('freq-vertical__y-tick', true)
      .classed('freq-vertical__y-tick-header', function (d, i) {
        return d.split('|')[0] === 'HEADER'
      })

    yAxisWidth = Math.max(50, yAxisReferenceElement.node().getBBox().width)

    yScale
      .range([xAxisTopHeight, yStop])
      .align(perspectives.length === 2 ? 0 : 0.5)

    // Update the space available for the y axis
    conditionalApplyTransition(yAxisElement, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + yAxisWidth + ', 0)')
      .call(yAxis)

    yAxisElement.selectAll('.tick')
      .classed('freq-vertical__y-tick', true)
      .classed('freq-vertical__y-tick-header', function (d, i) {
        return d.split('|')[0] === 'HEADER'
      })

    const chartNeededWidth = margin.left + margin.right + yAxisWidth + 300
    // Check if vertical scroll is needed
    const scrollNeeded = availableWidth < chartNeededWidth

    // Enable or disable scroll on the div containing the frequency cchart
    d3.select('.chart')
      .classed('chart-scroll', scrollNeeded)
      .style('width', scrollNeeded ? availableWidth + 'px' : null)

    // SET MAIN ELEMENT WIDTH AND HEIGHT
    // Update width of the chart, which may be bigger than the available space if scrolling is enabled
    width = scrollNeeded ? chartNeededWidth : availableWidth
    width = width - margin.left - margin.right
    chart
      .attr('width', width + margin.left + margin.right)

    chart.attr('height', yStop + margin.top + margin.bottom)

    // Update bounding box definition for the chart
    // TODO clean up
    // const wrapperClientBB = d3.select('.chart').node().getBoundingClientRect()
    // chartBB = {
    //   height: wrapperClientBB.height,
    //   left: wrapperClientBB.left + window.scrollX,
    //   top: wrapperClientBB.top + window.scrollY,
    //   width: wrapperClientBB.width,
    // }

    // UPDATE X AXIS
    xScale.rangeRound([yAxisWidth, width - 2])
    xAxisScale.rangeRound([yAxisWidth, width])
    xAxisBottom.tickSizeInner(-(yStop - xAxisTopHeight))
    // xAxisBottomElement
    xAxisBottomElement.interrupt().selectAll('*').interrupt()
    conditionalApplyTransition(xAxisBottomElement, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + 0 + ',' + yStop + ')')
      .call(xAxisBottom)

    // xAxisTopElement
    xAxisTopElement.interrupt().selectAll('*').interrupt()
    conditionalApplyTransition(xAxisTopElement, elementTransition, animateNextUpdate)
      .attr('transform', 'translate(' + 0 + ',' + xAxisTopHeight + ')')
      .call(xAxisTop)

    // UPDATE BARS
    // Update size and position for each bar element
    const sections = chart.selectAll('.freq-vertical-optioncol-section')
    sections
      .attr('height', yScale.bandwidth())
    sections.interrupt().selectAll('*').interrupt()
    conditionalApplyTransition(sections, elementTransition, animateNextUpdate)
      .attr('x', function (d) { return xScale(d.start) })
      .attr('y', function (d) { return yScale(d.rowKey) })
      .attr('width', function (d) { return xScale(d.end) - xScale(d.start) })

    // UPDATE STYLES
    updateStyles()
  }

  function tooltipOverBar (option) {
    tooltipBody.style('opacity', 1)
    tooltipArrow.style('opacity', 1)

    const perspectiveOptionText = dax.data.getPerspectivesOptionTexts(perspectives, option.index).join(', ')
    let tooltipHtml
    if (option.key === 'MISSING_DATA') {
      const cutoff = dax.settings('export.statistics.group_cutoff')
      tooltipHtml = dax.text('explorer.chart.frequency_bar_vertical.tooltip.missing_data', cutoff, perspectiveOptionText)
    } else {
      const percentageText = dax.common.percentageFormat(option.end - option.start)
      const questionOptionText = option.key
      const color = barStrokeColor(option.key, 0).darker(0.7)
      tooltipHtml = dax.text('explorer.chart.frequency_bar_vertical.tooltip.response_percentage', percentageText, perspectiveOptionText, questionOptionText, color)
    }

    tooltipBody.html(tooltipHtml)

    tooltipArrow
      .style('border-left-color', null)
      .style('top', (yScale(option.rowKey) - tooltipBarArrowDistance) + 'px')

    const tooltipArrowBB = tooltipArrow.node().getBoundingClientRect()
    const tooltipBodyBB = tooltipBody.node().getBoundingClientRect()
    tooltipBody
      .style('top', (yScale(option.rowKey) - tooltipBodyBB.height - tooltipBarArrowDistance + tooltipArrowBB.height / 2 - 2) + 'px')
  }

  // Update tooltip X position on bar
  function tooltipBarMove () {
    const tooltipBodyBB = tooltipBody.node().getBoundingClientRect()
    const tooltipArrowBB = tooltipArrow.node().getBoundingClientRect()
    const chartLeft = chart.node().getBoundingClientRect().left + window.scrollX
    const mouseX = d3.event.pageX - chartLeft
    tooltipBody.style('left', (mouseX - tooltipBodyBB.width / 2) + 'px')
    tooltipArrow.style('left', (mouseX - tooltipArrowBB.width / 2) + 'px')
  }

  function tooltipOut () {
    tooltipBody.style('opacity', 0)
    tooltipArrow.style('opacity', 0)
  }

  function setHorizontalHighlight (option) {
    const rows = chart.selectAll('.freq-vertical-optioncol-section')
    rows
      .style('filter', function (d) {
        if (option === 'MISSING_DATA') {
          return d.key === option ? 'brightness(0.93)' : null
        }
        return d.key === option ? null : 'grayscale(1) brightness(1.2)'
      })
  }

  function unsetHorizontalHighlight () {
    const rows = chart.selectAll('.freq-vertical-optioncol-section')
    rows.style('filter', null)
  }

  function barFillColor (key) {
    return key === 'MISSING_DATA' ? missingDataColor : d3.hsl(zScaleColor(key))
  }

  function barStrokeColor (key) {
    return barFillColor(key).darker(0.8)
  }

  function updateStyles () {
    chartG.selectAll('.axis .domain')
      .style('visibility', 'hidden')

    chartG.selectAll('.axis path, .axis line')
      .style('fill', 'none')
      .style('stroke', '#bbb')
      .style('shape-rendering', 'geometricPrecision')

    chartG.selectAll('text')
      .style('fill', '#555')
      .style('font-size', '13px')
      .style('font-family', '"Varta", sans-serif')
      .style('cursor', 'default')

    chartG.selectAll('.freq-vertical__y-tick path, .freq-vertical__y-tick line')
      .style('visibility', 'hidden')

    chartG.selectAll('.freq-vertical__y-tick-header text')
      .style('fill', 'black')
      .style('font-size', '14px')
      .style('transform', 'translate(0, 6px)')
  }

  function legendOptionMouseOver (hoveredOption) {
    const rows = d3.selectAll('.freq-vertical__legend .legend__row')
    // Stop all current legend row animations
    rows.interrupt().selectAll('*').interrupt()
    // Fade non-selected options
    rows
      .style('opacity', function (option) { return hoveredOption === option ? 1 : 0.4 })

    legendMissingData
      .style('opacity', function (option) { return hoveredOption === 'MISSING_DATA' ? 1 : 0.4 })
  }

  function legendOptionMouseOut () {
    // Set all legend rows to visible again
    const rows = d3.selectAll('.freq-vertical__legend .legend__row')
    rows.style('opacity', 1)
  }

  // Helper
  function conditionalApplyTransition (selection, transition, useTransition) {
    return useTransition ? selection.transition(transition) : selection
  }

  // SAVE CHART AS IMAGE
  const imageScaling = 2 // TODO externalize
  function generateImage () {
    // The structure of these nested functions follow the same pattern
    // 1. Define image element
    // 2. Define the onload function
    // 3. Call other function to populate the image element with the actual image
    // 4. The onload function is called, doing the next image in sequence

    // Load header image
    const headerImg = new Image()
    headerImg.onload = function () {
      // Header image is loaded!
      // Load legend image:
      const legendImg = new Image()
      legendImg.onload = function () {
        // Legend image is loaded!
        // Load chart image
        const chartImg = new Image()
        chartImg.onload = function () {
          d3.select('body').node().append(chartImg)
          // Chart image is loaded!
          // Build and save the complete image
          composeAndSaveImage(headerImg, legendImg, chartImg)
        }
        generateChartImage(chartImg)
      }
      generateLegendImage(legendImg)
    }
    generateHeaderImage(headerImg)
  }

  // Takes an empty image element and loads an image of the header into it
  function generateHeaderImage (img) {
    // Add the temporary copy of the legend to the DOM
    const hiddenDiv = d3.select('body').append('div')
      .classed('hidden', true)
      .style('justify-content', 'center')
      .style('text-align', 'center')
      .style('white-space', 'nowrap')

    const headerClone = hiddenDiv
      .append(function () { return headerDiv.node().cloneNode(true) })
      .style('padding-left', '1000px')
      .style('padding-right', '1000px')
      .style('width', '1000px')

    headerClone.select('.header-section__freq-tooltip')
      .remove()

    const oldWidth = headerClone.node().offsetWidth
    const oldHeight = headerClone.node().offsetHeight
    const newWidth = oldWidth * imageScaling
    const newHeight = oldHeight * imageScaling

    // Adjust legend appearance
    const translateX = (newWidth - oldWidth) / 2
    const translateY = (newHeight - oldHeight) / 2
    headerClone
      .style('transform', 'translate(' + translateX + 'px,' + translateY + 'px) scale(' + imageScaling + ')')

    domtoimage.toPng(headerClone.node(), { bgcolor: 'white', width: newWidth, height: newHeight })
      .then(function (dataUrl) {
        img.src = dataUrl
      })['catch'](function (error) { // eslint-disable-line dot-notation
        if (error) { // TODO standard-js forces if(error) (see handle-callback-error)
          // TODO error handling: console.error('Failed to generate image', error)
          console.log(error)
        }
      })['finally'](function () { // eslint-disable-line dot-notation
        // Remove generated temporary elements
        hiddenDiv.remove()
      })
  }

  // Takes an empty image element and loads an image of the legend into it
  function generateLegendImage (img) {
    legendOptionMouseOut()

    // Add the temporary copy of the legend to the DOM
    const hiddenDiv = d3.select('body').append('div')
      .classed('hidden', true)

    const legendClone = hiddenDiv.append('div')
      .style('padding-top', (15 * imageScaling) + 'px')
      .style('padding-left', (0 * imageScaling) + 'px')

    // Reconstruct copy of legend from the DOM element, only keeping the relevant parts
    const questionHeaderCopy = legendQuestionHeader.node().cloneNode(true)
    d3.select(questionHeaderCopy).style('margin-top', '10px')
    legendClone.append(function () { return questionHeaderCopy })
    legendClone.append(function () { return legendQuestionOptionTable.node().cloneNode(true) })
    legendClone.selectAll('.legend__row-text')
      .style('max-width', 'inherit')
      .style('text-overflow', 'inherit')
      .style('padding-right', (15 * imageScaling) + 'px')

    const oldWidth = legendClone.node().offsetWidth
    const oldHeight = legendClone.node().offsetHeight
    const newWidth = oldWidth * imageScaling
    const newHeight = oldHeight * imageScaling

    // Adjust legend appearance
    const translateX = (newWidth - oldWidth) / 2
    const translateY = (newHeight - oldHeight) / 2
    legendClone
      .style('transform', 'translate(' + translateX + 'px,' + translateY + 'px) scale(' + imageScaling + ')')

    domtoimage.toPng(legendClone.node(), { bgcolor: 'white', width: newWidth, height: newHeight })
      .then(function (dataUrl) {
        img.src = dataUrl
      })['catch'](function (error) { // eslint-disable-line dot-notation
        if (error) { // TODO standard-js forces if(error) (see handle-callback-error)
          // TODO error handling: console.error('Failed to generate image', error)
          console.log(error)
        }
      })['finally'](function () { // eslint-disable-line dot-notation
        // Remove generated temporary elements
        hiddenDiv.remove()
      })
  }

  // Takes an empty image element and loads an image of the chart into it
  function generateChartImage (img) {
    unsetHorizontalHighlight()

    const leftAdjust = 10
    const widthAdjust = 10
    const initialAvailablelWidth = availableWidth
    // Set width of actual chart before making a copy
    exports.setSize(saveImageCanvasWidth)
    // Make copy of chart element
    const chartCopy = d3.select(chart.node().cloneNode(true))

    // Apply local font version
    chartCopy
      .append('defs')
      .append('style')
      .text(dax.fonts.getVartaBase64Definition())

    chartCopy.selectAll('text')
      .style('font-family', '"VartaBase64", "Varta", sans-serif')

    // Restore size of actual chart
    exports.setSize(initialAvailablelWidth)

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
    img.src = window.URL.createObjectURL(blob)
  }

  function composeAndSaveImage (headerImg, legendImg, chartImg) {
    const canvasChartSelection = d3.select('body').append('canvas')
      .classed('hidden', true)
      .attr('width', chartImg.width)
      .attr('height', chartImg.height)

    const imgMargin = { top: 20 * imageScaling, right: 20 * imageScaling, bottom: 20 * imageScaling, left: 0 * imageScaling }

    const completeWidth = imgMargin.left + chartImg.width + imgMargin.right + legendImg.width
    const completeHeight = imgMargin.top + headerImg.height + Math.max(chartImg.height, legendImg.height) + imgMargin.bottom
    const canvasCompleteSelection = d3.select('body').append('canvas')
      .attr('width', completeWidth + 'px')
      .attr('height', completeHeight + 'px')
      .style('visibility', 'hidden')

    const canvasComplete = canvasCompleteSelection.node()

    const ctx = canvasCompleteSelection.node().getContext('2d')

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, completeWidth, completeHeight)
    ctx.fillStyle = 'black'

    const lineSectionStart = margin.left + imgMargin.left + yAxisWidth * imageScaling
    const lineSectionEnd = chartImg.width - margin.right - imgMargin.right
    const lineSectionWidth = lineSectionEnd - lineSectionStart
    const headerHorizontalShift = lineSectionStart + lineSectionWidth / 2 - headerImg.width / 2

    // Draw header img to canvas
    ctx.drawImage(headerImg, headerHorizontalShift, imgMargin.top)

    // Draw chart img to canvas
    ctx.drawImage(chartImg, imgMargin.left, imgMargin.top + headerImg.height)

    // Draw legend img to canvas
    ctx.drawImage(legendImg, chartImg.width, imgMargin.top + headerImg.height + 100)

    let watermarkText = dax.text('explorer.image.watermark')
    const date = new Date()
    watermarkText = watermarkText.replace(
      '{date}',
      date.getFullYear() + '-' +
      ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
      ('0' + date.getDate()).slice(-2))

    const fileName = dax.text('explorer.chart.frequency_bar.image.filename')
      .replaceAll('{question}', dax.data.getQuestionShortText(question))
      .replaceAll('{perspective}', dax.data.getQuestionShortText(perspectives))
      .replaceAll('{date}',
        date.getFullYear() + '-' +
        ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
        ('0' + date.getDate()).slice(-2))

    const sourceFontHeight = 11 * imageScaling
    ctx.font = sourceFontHeight + 'px "Varta"'
    ctx.fillStyle = '#555'
    ctx.fillText(watermarkText, 5 * imageScaling, completeHeight - 5 * imageScaling)

    canvasComplete.toBlob(function (blob) {
      saveAs(blob, fileName + '.png')
    })

    canvasChartSelection.remove()
    canvasCompleteSelection.remove()
  }
})(window.dax = window.dax || {})
