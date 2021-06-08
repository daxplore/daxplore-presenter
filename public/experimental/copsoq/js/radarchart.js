(function (namespace) {
  namespace.radarchart = namespace.radarchart || {}
  const exports = namespace.radarchart

  // SHARED CONSTANTS
  const TAU = 2 * Math.PI

  const outerAxisTextMargin = 0.06 // Measured in radius units
  const outerAxisTextMaxWidth = 0.8 // Measured in radius units
  const domainBottom = 0
  const domainTop = 100
  const axisXRingStepSize = 10
  const lowDataInterpolationStepCount = 50

  const referenceGreenFill = '#C5E1A5'
  const referenceYellowFill = '#FFF59D'
  const referenceRedFill = '#FFAB91'

  const axisColor = '#666'
  const axisCircleTextFontSize = 0.05 // Measured in radius units
  const axisStrokeWidth = 0.004 // Measured in radius units
  const outerTickFontSize = 13 // Measured in pixels
  const outerTickLineHeight = 1.3 // Factor of font size

  const dataPointColor = '#555'
  // const dataPointStrokeColor = '#666'
  // const dataPointStrokeWidth = 0.02 // Measured in radius units
  // const dataPointFillColor = '#666'
  // const dataPointFillOpacity = '0.0'

  const overlayTextWidth = 0.9 // Measured in radius units
  const overlayTextLineHeight = 1.05 // Factor of font size

  const margin = { top: 0, bottom: 0, left: 0, right: 0 }
  //
  // function myTransitionSettings (transition) {
  //   transition
  //       .duration(100)
  //       .delay(0)
  // }
  //
  // const elementTransition = d3.transition()
  //   .duration(3000)
  //   .ease(d3.easeLinear)

  // Helper
  function conditionalTransition (selection, applyTransition) {
    if (applyTransition) {
      const t = d3.transition().duration(300).ease(d3.easeLinear)
      return selection.transition(t)
    }
    return selection
  }

  // const DRAW_DATA_LINE = false

  // Alternative mod implementation, since % of negative numbers returns negative numbers in JS
  function mod (n, m) {
    return ((n % m) + m) % m
  }

  // Generates a radar chart, populating it into the element with the given element class name
  // Returns a radar chart object, that can be interacted with
  exports.createRadarChart =
    function (
      elementClassName,
      axisTextArray,
      referenceValueArray,
      goodDirectionInput,
      overlayTextArrayInput
    ) {
      if (axisTextArray.length !== referenceValueArray.length) {
        throw new Error('Invalid radar chart input data, different array lengths.')
      }
      const referenceData = referenceValueArray
      const axisText = axisTextArray
      const goodDirection = goodDirectionInput
      const overlayTextArray = overlayTextArrayInput

      // let animateNextUpdate = false
      const radarChart = {}

      const angleSlice = 2 * Math.PI / referenceData.length

      // CHART INSTANCE VARIABLES
      const chart = d3.selectAll(elementClassName)
      let radius = 250
      const radiusScale = d3.scaleLinear()
      const dataPointSymbol = d3.symbol().type(d3.symbolCircle)
      let displayModeMiniaturized = true
      let offsetLeft = 0
      let offsetTop = 0
      let highlightedDataPoint = 0

      let pointData = []
      let calculatedOverlayTextScaling
      let forcedOverlayTextScaling = null
      const hoverCallbackFunctions = []

      let selectedPerspectiveOption = 0
      let activeOverlayTransform = ''

      let perspectiveOptionText

      hoverCallbackFunctions.push(mouseoverHighlight)

      // LINE GENERATORS
      const yAxisLineGenerator = d3.line()

      const referenceLineGenerator = d3.lineRadial()
        .curve(d3.curveCatmullRomClosed.alpha(0))
        .radius(function (d) { return radiusScale(d) })

      const dataPointLineGenerator = d3.lineRadial()
        .curve(d3.curveLinearClosed)
        .radius(function (d) { return radiusScale(d) })

      // WHITE BACKGROUND BASE PLATE
      const baseBackgroundPlate = chart.append('circle')
        .style('fill', 'white')

      // RADAR CHART GROUP
      const radarGroup = chart.append('g')

      // RADIUS
      radiusScale
        .domain([domainBottom, domainTop])

      // BACKGROUND COLORED REFERENCES AREAS
      const baseReferenceCircle = radarGroup.append('circle')

      const midReferenceArea = radarGroup.append('path')
        .style('fill', referenceYellowFill)

      const centerReferenceArea = radarGroup.append('path')

      // AXIS RINGS
      const axisRingData = d3.range(domainBottom + axisXRingStepSize, domainTop + 1, axisXRingStepSize)

      radarGroup.selectAll('.circle-axis')
        .data(axisRingData).enter()
          .append('circle')
            .classed('circle-axis', true)
            .style('fill-opacity', '0')
            .style('stroke', axisColor)

      radarGroup.selectAll('.circle-axis-text')
        .data(axisRingData).enter()
        .append('text')
          .classed('circle-axis-text', true)
          .style('fill', '#444')
          .text(function (d) { return d }) // TODO externalize formatting

      // const dataPointLine = radarGroup.append('path')
      //   .style('fill', dataPointFillColor)
      //   .style('fill-opacity', dataPointFillOpacity)
      //   .style('stroke', dataPointStrokeColor)

      // OVERLAY TEXT
      const overlayTextElement = chart.append('text')
        .style('fill', 'black')
        .style('filter', 'drop-shadow(0 0 1px white) drop-shadow(0 0 1px white)')
        .attr('font-family', '"Varta", sans-serif')

      // INTERNAL FUNCTIONS

      // Reposition and redraw chart elements
      function updateChartElements (animate) {
        // INTERPOLATION
        // Interpolate values for 2 or less datapoints
        let referenceDataInterpolated = referenceData

        // let pointDataInterpolated = pointDataForOption
        // TODO kollapsa tomma datapunkter, eller rita inte ut dem?
        if (referenceData.length === 2) {
          // TODO do non-linear interpolation using smooth.js?
          const referenceStep = (referenceData[1] - referenceData[0]) / lowDataInterpolationStepCount
          // const dataStep = (pointDataForOption[1] - pointDataForOption[0]) / lowDataInterpolationStepCount
          referenceDataInterpolated = []
          // pointDataInterpolated = []
          for (let i = 0; i < lowDataInterpolationStepCount; i++) {
            referenceDataInterpolated.push(referenceData[0] + i * referenceStep)
            // pointDataInterpolated.push(pointDataForOption[0] + i * dataStep)
          }
          for (let i = 0; i < lowDataInterpolationStepCount; i++) {
            referenceDataInterpolated.push(referenceData[1] - i * referenceStep)
            // pointDataInterpolated.push(pointDataForOption[1] - i * dataStep)
          }
        } else if (referenceData.length === 1) {
          referenceDataInterpolated = []
          // pointDataInterpolated = []
          for (let i = 0; i < lowDataInterpolationStepCount * 2; i++) {
            referenceDataInterpolated.push(referenceData[0])
            // pointDataInterpolated.push(pointDataForOption[0])
          }
        }

        const angleSliceInterpolated = 2 * Math.PI / referenceDataInterpolated.length

        // RADIUS
        radiusScale
          .range([0, radius])

        // DATA SYMBOL
        dataPointSymbol
          .size(radius / 2) // TODO

        // LINE/AREA GENERATORS
        referenceLineGenerator
          .angle(function (d, i) { return i * angleSliceInterpolated })
        baseBackgroundPlate
          .attr('r', radius)
        baseReferenceCircle
          .attr('r', radius)
          .style('fill', goodDirection === 'HIGH' ? referenceGreenFill : referenceRedFill)
        midReferenceArea
          .attr('d', referenceLineGenerator(referenceDataInterpolated.map(function (d) { return d + 5 })))
        centerReferenceArea
          .style('fill', goodDirection === 'HIGH' ? referenceRedFill : referenceGreenFill)
          .attr('d', referenceLineGenerator(referenceDataInterpolated.map(function (d) { return d - 5 })))
        dataPointLineGenerator
          .angle(function (d, i) { return i * angleSliceInterpolated })

        // AXIS RINGS
        radarGroup.selectAll('.circle-axis')
          .style('stroke-width', axisStrokeWidth * radius)
          .attr('r', function (d) { return radiusScale(d) })

        radarGroup.selectAll('.circle-axis-text')
          .style('font-size', (radius * axisCircleTextFontSize) + 'px')
          .style('display', displayModeMiniaturized ? 'none' : '')
          .style('position', displayModeMiniaturized ? 'absolute' : '')
          .attr('transform',
            function (d) { return 'translate(' + (radius * axisCircleTextFontSize) / 8 + ',' + (-radiusScale(d - axisXRingStepSize / 2) + (radius * axisCircleTextFontSize) / 5) + ')' }
          )

        // LINE AXIS
        radarGroup.selectAll('.line-axis')
          .data(referenceData).enter()
          .append('path')
            .classed('line-axis', true)
            .style('stroke', axisColor)

        radarGroup.selectAll('.line-axis')
          .attr('d', function (d, i) { return yAxisLineGenerator([[0, 0], d3.pointRadial(i * angleSlice, radiusScale(domainTop))]) })
          .style('stroke-width', axisStrokeWidth * radius)

        // AXIS TEXT
        radarGroup.selectAll('.line-axis-text')
          .data(axisText).enter()
          .append('text')
            .classed('line-axis-text', true)
            .style('fill', '#444')
            .style('font-size', '13px')
            .style('font-weight', '700')

        radarGroup.selectAll('.line-axis-text')
          .style('display', displayModeMiniaturized ? 'none' : '')
          .style('position', displayModeMiniaturized ? 'absolute' : '')
          .each(function (text, i, nodes) { return addSvgTspansWithWordWrap(nodes[i], text, outerTickFontSize, outerTickLineHeight, outerAxisTextMaxWidth * radius) })

        radarGroup.selectAll('.line-axis-text')
          .attr('transform', function (d, i, nodes) {
            const textBBox = nodes[i].getBBox()
            const angle = 0.75 * TAU + i * angleSlice
            const coordinates = getTextCoordinates(radius, angle, textBBox.width, textBBox.height)
            // coordinates[1] += 10
            return 'translate(' + coordinates.join(',') + ')'
          })
          .on('mouseover', function (d, i, n) { return hoverCallbackFunctions.forEach(function (callback) { return callback(d, i, n) }) })
          .on('mouseout', mouseoutHighlight)

        // DATA POINTS
        updateDataPointPositions(animate)

        // OVERLAY TEXT
        overlayTextElement
          .style('font-size', radius + 'px')
          .style('display', displayModeMiniaturized ? '' : 'none')
          .style('position', displayModeMiniaturized ? '' : 'absolute')
          .attr('transform', '')

        const radarGroupBBox = radarGroup.node().getBBox()
        if (displayModeMiniaturized) {
          addSvgTspansFromArray(overlayTextElement.node(), overlayTextArray, 10, overlayTextLineHeight)
          const overlayTextBBox = overlayTextElement.node().getBBox()
          const targetTextWidth = overlayTextWidth * radius
          calculatedOverlayTextScaling = targetTextWidth / overlayTextBBox.width
          const textScaling = forcedOverlayTextScaling !== null ? forcedOverlayTextScaling : calculatedOverlayTextScaling
          const scaledTextHeight = overlayTextBBox.height * textScaling
          activeOverlayTransform = 'translate(' + (margin.left - radarGroupBBox.x) + ',' + (margin.right - radarGroupBBox.y) + ')' +
                      'translate(0,' + (overlayTextArray.length === 1 ? 0.2 * scaledTextHeight : 0) + ')' +
                      'scale(' + textScaling + ') '
          overlayTextElement
            .attr('transform', activeOverlayTransform)
        }

        // GROUP POSITIONING
        offsetLeft = margin.left - radarGroupBBox.x
        offsetTop = margin.right - radarGroupBBox.y
        baseBackgroundPlate
          .attr('transform', 'translate(' + offsetLeft + ',' + offsetTop + ')')
        radarGroup
          .attr('transform', 'translate(' + offsetLeft + ',' + offsetTop + ')')
          // .style('filter', displayModeMiniaturized ? 'blur(' + (0.02 * radius) + 'px)' : '')
          .style('opacity', displayModeMiniaturized ? 0.75 : 1)
        chart
          .attr('width', margin.left + margin.right + radarGroupBBox.width)
          .attr('height', margin.top + margin.bottom + radarGroupBBox.height)

        // APPLY STYLE
        chart.selectAll('text')
          .style('font-family', '"Varta", sans-serif')
      }

      function updateDataPointPositions (animate) {
        const pointDataForOption = pointData.map(function (subarray) { return subarray[selectedPerspectiveOption] })
        radarGroup.selectAll('.datapoint')
          .data(pointDataForOption).enter()
            .append('g')
              .classed('datapoint', true)
              .append('path')
                .classed('datapoint-symbol', true)
                .attr('d', dataPointSymbol)
                .attr('fill', dataPointColor)
                .on('mouseover', function (d, i, n) { return hoverCallbackFunctions.forEach(function (callback) { return callback(d, i, n) }) })
                .on('mouseout', mouseoutHighlight)
        radarGroup.selectAll('.datapoint-symbol')
          .attr('d', dataPointSymbol)
        radarGroup.selectAll('.datapoint')
          .style('display', function (d) { return d === -1 || isNaN(d) ? 'none' : '' })
        const dataPointElements = radarGroup.selectAll('.datapoint')

        conditionalTransition(dataPointElements, animate)
          .attr('transform', function (d, i) { return d === -1 || isNaN(d) ? '' : 'translate(' + d3.pointRadial(i * angleSlice, radiusScale(d)).join(',') + ')' })
      }

      // Add svg tspans to svg text element with word wrap
      function addSvgTspansWithWordWrap (svgTextElement, text, fontSize, lineHeight, maxWidth) {
        const textElement = d3.select(svgTextElement)
        const spaceWidth = textElement.append('tspan').text('\u00A0').node().getComputedTextLength() // unicode nbsp
        const words = text.split(/\s+/)
        const tspans = words.map(function (text) { return textElement.append('tspan').text(text) })
        const tspanLengths = tspans.map(function (tspan) { return tspan.node().getComputedTextLength() })
        let currentLine = 0
        let currentLineLength = 0
        const finalLines = []
        for (let i = 0; i < words.length; i++) {
          if (typeof finalLines[currentLine] === 'undefined') {
            finalLines[currentLine] = words[i]
            currentLineLength = tspanLengths[i]
          } else if (currentLineLength + spaceWidth + tspanLengths[i] <= maxWidth) {
            finalLines[currentLine] += ' ' + words[i]
            currentLineLength += spaceWidth + tspanLengths[i]
          } else {
            currentLine++
            finalLines[currentLine] = words[i]
            currentLineLength = tspanLengths[i]
          }
        }
        textElement.selectAll('*').remove()
        textElement.selectAll('.wordwrap')
          .data(finalLines).enter()
          .append('tspan')
            .classed('wordwrap', true)
            .style('font-size', fontSize + 'px')
            .text(function (d) { return d })
            .attr('x', 0)
            .attr('dy', function (d, i) { return fontSize + i * lineHeight })
      }

      function addSvgTspansFromArray (svgTextElement, textArray, fontSize, lineHeight) {
        const textElement = d3.select(svgTextElement)
        textElement.selectAll('*').remove()
        textElement.selectAll('.wordwrap')
          .data(textArray).enter()
          .append('tspan')
            .classed('wordwrap', true)
            .attr('text-align', 'center')
            .style('font-size', fontSize + 'px')
            .text(function (d) { return d })
            .attr('x', 0)
            .attr('dy', function (d, i) { return i * fontSize * lineHeight })
        textElement.selectAll('.wordwrap')
          .attr('dx', function (d, i, nodes) {
            return -(nodes[i].getBoundingClientRect().width / 2)
          })
      }

      function getTextCoordinates (textRadius, angle, width, height) {
        angle = mod(angle, TAU)
        width /= 2 * textRadius
        height /= 2 * textRadius
        let angleSign = 1
        if (angle <= 0.25 * TAU) { // Q1
          // default
        } else if (angle < 0.5 * TAU) { // Q2
          angleSign = -1
        } else if (angle <= 0.75 * TAU) { // Q3
        } else { // Q4
          angleSign = -1
        }

        const tanaQ1 = Math.tan(mod(angleSign * angle, 0.25 * TAU))
        const x = (height * tanaQ1 - width * Math.pow(tanaQ1, 2) +
        Math.sqrt(1 - Math.pow(height, 2) +
        2 * height * width * tanaQ1 + Math.pow(tanaQ1, 2) -
        Math.pow(width, 2) * Math.pow(tanaQ1, 2))) / (1 + Math.pow(tanaQ1, 2))

        const y = Math.sqrt(1 - Math.pow(x, 2))
        const rmx = x + width
        const rmy = y + height
        const unitRadius = Math.sqrt(Math.pow(rmx, 2) + Math.pow(rmy, 2))

        let rectMidX = Math.cos(angle) * unitRadius
        let rectMidY = Math.sin(angle) * unitRadius

        function getSign (x) { return ((x > 0) - (x < 0)) || +x }

        if (getSign(rectMidX + width) !== getSign(rectMidX - width)) {
          rectMidY = 1 + height
          rectMidY *= angle < TAU / 2 ? 1 : -1
          rectMidX = rectMidY / Math.tan(angle)
        } else if (getSign(rectMidY + height) !== getSign(rectMidY - height)) {
          rectMidX = 1 + width
          rectMidX *= angle > 0.25 * TAU && angle < 0.75 * TAU ? -1 : 1
          rectMidY = rectMidX * Math.tan(angle)
        }

        rectMidX += Math.cos(angle) * outerAxisTextMargin
        rectMidY += Math.sin(angle) * outerAxisTextMargin

        const rectCornerPixelX = (rectMidX - width) * textRadius
        const rectCornerPixelY = (rectMidY - height) * textRadius
        return [rectCornerPixelX, rectCornerPixelY]
      }

      function mouseoverHighlight (d, i, n) {
        if (displayModeMiniaturized) {
          return
        }
        highlightedDataPoint = i
        radarGroup.selectAll('.datapoint-symbol')
          .classed('datapoint-symbol--highlighted', function (d, i) { return highlightedDataPoint === i })
        radarGroup.selectAll('.line-axis-text')
          .classed('line-axis-text--highlighted', function (d, i) { return highlightedDataPoint === i })
      }

      function mouseoutHighlight (d, n, i) {
        if (displayModeMiniaturized) {
          return
        }
        highlightedDataPoint = -1
        radarGroup.selectAll('.datapoint-symbol')
          .classed('datapoint-symbol--highlighted', false)
        radarGroup.selectAll('.line-axis-text')
          .classed('line-axis-text--highlighted', false)
      }

      // ------------------------------------------------- //
      // --- EXPORTED FUNCTIONS FOR RADAR CHART OBJECT --- //
      // ------------------------------------------------- //

      radarChart.setData = function (pointDataArray, animate) {
        if (axisTextArray.length !== pointDataArray.length) {
          throw new Error('Invalid radar chart input data, different array lengths.')
        }
        pointData = pointDataArray
        updateDataPointPositions(animate)
      }

      radarChart.setWidth = function (width) {
        radius = width / 2
        updateChartElements(false)
      }

      radarChart.setDisplayModeFull = function () {
        displayModeMiniaturized = false
        updateChartElements(false)
      }

      radarChart.setDisplayModeMiniature = function () {
        displayModeMiniaturized = true
        updateChartElements(false)
      }

      radarChart.getCalculatedOverlayTextScaling = function () {
        return calculatedOverlayTextScaling
      }

      radarChart.setOverlayTextScaling = function (overlayTextScaling) {
        forcedOverlayTextScaling = overlayTextScaling
        updateChartElements(false)
      }

      radarChart.getCircleCenterOffsets = function () {
        const radarGroupBBox = radarGroup.node().getBBox()
        return { left: offsetLeft, top: offsetTop, right: radarGroupBBox.width - offsetLeft, bottom: radarGroupBBox.height - offsetTop }
      }

      radarChart.addHoverCallback = function (callbackFunction) {
        hoverCallbackFunctions.push(callbackFunction)
      }

      radarChart.setPerspectiveOption = function (perspectiveText, perspectiveOption, animate) {
        perspectiveOptionText = perspectiveText
        selectedPerspectiveOption = perspectiveOption
        updateChartElements(animate)
      }

      // Helper function to allow radargraph-panel to set overlay text size when saving as image
      radarChart.setOverlayFontScaling = function (scaling) {
        overlayTextElement
          .attr('transform', activeOverlayTransform + ' scale(' + scaling + ')')
      }

      radarChart.generateImage =
        function () {
          const doctype = '<?xml version="1.0" standalone="no"?>' +
            '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'

          const imageScaling = 2
          const svg = chart.node()

          const marginBefore = chart.style('margin') // copy existing margins
          chart.style('margin', 0) // remove margins

          const scaleTransform = ' scale(0.8)'
          const angleSlice = 2 * Math.PI / referenceData.length

          // SCALE DOWN, TO FIT TEXT INSIDE IMAGE BECAUSE IT'S TOO BIG IN IMAGE FOR SOME REASON
          // RESIZE BEFORE POSITIONING
          // radarGroup.selectAll('.line-axis-text')
          //   .attr('transform', scaleTransform)

          // TODO DUPLICATED POSITIONING CODE TO MAKE SCALE RESIZE WORK IN FF, TURN INTO FUNCTION
          // SCALE DOWN, TO FIT TEXT INSIDE IMAGE BECAUSE IT'S TOO BIG IN IMAGE FOR SOME REASON
          const leftAdjust = 20
          const widthAdjust = 40
          const widthBefore = chart.attr('width')
          chart.attr('width', imageScaling * (Number(widthBefore) + widthAdjust))
          const heightBefore = chart.attr('height')
          chart.attr('height', imageScaling * Number(heightBefore))
          chart.style('transform', 'scale(' + imageScaling + ')' +
            'translate(' + ((Number(widthBefore) + widthAdjust) / 2 + leftAdjust) + 'px,' + (Number(heightBefore) / 2) + 'px)')

          radarGroup.selectAll('.line-axis-text')
            .attr('transform', function (d, i, nodes) {
              const textBBox = nodes[i].getBBox()
              const angle = 0.75 * TAU + i * angleSlice
              const coordinates = getTextCoordinates(radius, angle, textBBox.width, textBBox.height)
              return 'translate(' + coordinates.join(',') + ')' + scaleTransform
            })

          // const allTexts = chart.selectAll('text')
          // .style('transform', (d, i, n) => d3.select(n[i]).style('transform').replace('none', '') + scaleTransform)
          // const transformBefore = chart.selectAll('text').style('transform')
          // console.log(transformBefore)

          const source = (new XMLSerializer()).serializeToString(svg)

          const blob = new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' })

          const url = window.URL.createObjectURL(blob)

          const imgSelection = d3.select('body').append('img')
            .style('visibility', 'hidden')

          const img = imgSelection.node()

          chart.style('margin', marginBefore) // restore margins
          // chart.style('transform', '')

          // TODO DUPLICATED POSITIONING CODE TO MAKE SCALE RESIZE WORK IN FF, TURN INTO FUNCTION
          // RESTORE SCALE
          chart.attr('width', widthBefore)
          chart.attr('height', heightBefore)
          chart.style('transform', '')
          radarGroup.selectAll('.line-axis-text')
            .attr('transform', function (d, i, nodes) {
              const textBBox = nodes[i].getBBox()
              const angle = 0.75 * TAU + i * angleSlice
              const coordinates = getTextCoordinates(radius, angle, textBBox.width, textBBox.height)
              return 'translate(' + coordinates.join(',') + ')'
            })

          img.onload = function () {
            const canvasChartSelection = d3.select('body').append('canvas')
              .attr('width', img.width)
              .attr('height', img.height)
              .style('visibility', 'hidden')
            const canvasChart = canvasChartSelection.node()

            const chartCtx = canvasChart.getContext('2d')
            chartCtx.drawImage(img, 0, 0)

            const headerText = perspectiveOptionText + ': ' + d3.select('.radar-chart-full-header').text()
            const headerFontSize = 16 * imageScaling
            const headerPaddingBottom = 10 * imageScaling
            const headerFont = 'bold ' + headerFontSize + 'px "Varta"'
            const headerHeight = headerFontSize + headerPaddingBottom

            const imgMargin = { top: 10 * imageScaling, right: 10 * imageScaling, bottom: 20 * imageScaling, left: 20 * imageScaling }

            const canvasCompleteSelection = d3.select('body').append('canvas')
              .style('visibility', 'hidden')

            const canvasComplete = canvasCompleteSelection.node()

            const ctx = canvasCompleteSelection.node().getContext('2d')

            ctx.font = headerFont
            const headerWidth = ctx.measureText(headerText).width
            const imgAdditionalWidth = Math.max(0, headerWidth - img.width)
            const completeWidth = imgMargin.left + img.width + imgAdditionalWidth + imgMargin.right
            const completeHeight = imgMargin.top + headerHeight + img.height + imgMargin.bottom
            const headerHorizontalShift = completeWidth / 2 - headerWidth / 2

            canvasCompleteSelection
              .attr('width', completeWidth + 'px')
              .attr('height', completeHeight + 'px')

            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, completeWidth, completeHeight)
            ctx.fillStyle = 'black'
            ctx.font = headerFont
            ctx.fillText(headerText, headerHorizontalShift, headerFontSize + imgMargin.top)
            const customDataChart = false // TODO custom chart should not be hardcoded
            let watermarkText = dax.text(customDataChart ? 'profile_user.image.watermark' : 'profile.image.watermark')

            const date = new Date()
            watermarkText = watermarkText.replace(
              '{date}',
              date.getFullYear() + '-' +
              ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
              ('0' + date.getDate()).slice(-2))
              .replace('Profildiagram', 'Radardiagram') // TODO externalize Radar as separate text

            const fileName = dax.text(customDataChart ? 'profile_user.chart_image.filename' : 'profile.image.filename')
              .replace('{option}', headerText)
              .replace('Profildiagram', 'Radardiagram') // TODO externalize Radar as separate text

            const sourceFontHeight = 11 * imageScaling
            ctx.font = sourceFontHeight + 'px "Varta"'
            ctx.fillStyle = '#555'
            ctx.fillText(watermarkText, 5, completeHeight - 5)

            ctx.drawImage(canvasChart, imgMargin.left + imgAdditionalWidth / 2, imgMargin.top + headerHeight)

            canvasComplete.toBlob(function (blob) {
              saveAs(blob, fileName + '.png')
            })

            imgSelection.remove()
            canvasChartSelection.remove()
            canvasCompleteSelection.remove()
          }

          img.src = url
        }

      // Return interactible chart object
      return radarChart
    }
})(window.dax = window.dax || {})
