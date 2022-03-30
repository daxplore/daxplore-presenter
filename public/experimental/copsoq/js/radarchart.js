(function (namespace) {
  namespace.radarchart = namespace.radarchart || {}
  const exports = namespace.radarchart

  // SHARED CONSTANTS
  const TAU = 2 * Math.PI

  const outerAxisTextMargin = 0.06 // Measured in radius units
  const outerAxisTextMaxWidth = 0.8 // Measured in radius units
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

  const headerTextWidth = 0.9 // Measured in radius units
  // const overlayTextLineHeight = 1.05 // Factor of font size

  const margin = { top: 0, bottom: 0, left: 10, right: 10 }

  // Helper
  function conditionalTransition (selection, applyTransition) {
    if (applyTransition) {
      const t = d3.transition().duration(300).ease(d3.easeLinear)
      return selection.transition(t)
    }
    return selection
  }

  // Alternative mod implementation, since % of negative numbers returns negative numbers in JS
  function mod (n, m) {
    return ((n % m) + m) % m
  }

  // Generates a radar chart, populating it into the element with the given element class name
  // Returns a radar chart object, that can be interacted with
  exports.createRadarChart =
    function (
      elementClassName,
      headerText,
      axisTextArray,
      referenceValueArray,
      goodDirectionInput,
      domainRangeInput
    ) {
      if (axisTextArray.length !== referenceValueArray.length) {
        throw new Error('Invalid radar chart input data, different array lengths.')
      }
      const referenceData = referenceValueArray
      const axisTexts = axisTextArray
      const goodDirection = goodDirectionInput
      // Round domain up to closest step size
      let axisXRingStepSize = domainRangeInput > 50 ? 10 : 5
      let domainRange = Math.ceil(domainRangeInput / axisXRingStepSize) * axisXRingStepSize
      const radarChart = {}

      const angleSlice = 2 * Math.PI / referenceData.length

      // CHART INSTANCE VARIABLES
      const chart = d3.select(elementClassName)
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
        .style('filter', displayModeMiniaturized ? 'drop-shadow(0 0 1px black) drop-shadow(0 0 1px black)' : '')
        .classed('radar-node-background', true)

      // RADAR CHART GROUP
      const radarGroup = chart.append('g')

      // RADIUS
      radiusScale
        .domain([-domainRange, domainRange])

      // BACKGROUND COLORED REFERENCES AREAS
      const baseReferenceCircle = radarGroup.append('circle')

      const midReferenceArea = radarGroup.append('circle')
        .style('fill', referenceYellowFill)

      const centerReferenceArea = radarGroup.append('circle')

      // AXIS RINGS
      const axisRingData = d3.range(-domainRange + axisXRingStepSize, domainRange + 1, axisXRingStepSize)

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
          .text(function (d) {
            const dd = goodDirection === 'HIGH' ? d : (d - axisXRingStepSize)
            return (dd === 0 ? '± ' : (dd < 0 ? '- ' : '+ ')) + Math.abs(dd)
          }) // TODO externalize formatting

      // OVERLAY TEXT
      const overlayTextElement = chart.append('text')
        .style('fill', 'black')
        // .style('filter', 'drop-shadow(0 0 1px white) drop-shadow(0 0 1px white)')
        .attr('font-family', '"Varta", sans-serif')
        .style('text-anchor', 'middle')
        .text(displayModeMiniaturized ? headerText : '')
        // .style('font-size', 10 + 'px')

      // INTERNAL FUNCTIONS

      // Reposition and redraw chart elements
      function updateChartElements (animate) {
        // INTERPOLATION
        // Interpolate values for 2 or less datapoints
        let referenceDataInterpolated = referenceData

        radiusScale
          .domain([-domainRange, domainRange])

        // let pointDataInterpolated = pointDataForOption
        // TODO collapse empty datapoints or don't draw th
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

        // AXIS RINGS
        const axisRingData = d3.range(-domainRange + axisXRingStepSize, domainRange + 1, axisXRingStepSize)

        radarGroup.selectAll('.circle-axis').remove()
        radarGroup.selectAll('.circle-axis')
          .data(axisRingData).enter()
            .append('circle')
              .classed('circle-axis', true)
              .style('fill-opacity', '0')
              .style('stroke', axisColor)

        radarGroup.selectAll('.circle-axis-text').remove()
        radarGroup.selectAll('.circle-axis-text')
          .data(axisRingData).enter()
            .append('text')
              .classed('circle-axis-text', true)
              .style('fill', '#444')
              .text(function (d) {
                const dd = goodDirection === 'HIGH' ? d : (d - axisXRingStepSize)
                return (dd === 0 ? '± ' : (dd < 0 ? '- ' : '+ ')) + Math.abs(dd)
              }) // TODO externalize formatting

        // LINE/AREA GENERATORS
        referenceLineGenerator
          .angle(function (d, i) { return i * angleSliceInterpolated })
        baseBackgroundPlate
          .attr('r', radius)
        baseReferenceCircle
          .attr('r', radius)
          .style('fill', referenceGreenFill)
        midReferenceArea
          .attr('r', radiusScale(5))
        centerReferenceArea
          .attr('r', radiusScale(-5))
          .style('fill', referenceRedFill)
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
            function (d) {
              const goodHigh = goodDirection === 'HIGH'
              return 'translate(' +
              (radius * (axisCircleTextFontSize + 0.03)) / 8 + ',' +
              (-radiusScale((goodHigh ? 1 : -1) * (d - axisXRingStepSize / 2 - (goodDirection === 'HIGH'))) + (radius * axisCircleTextFontSize) / 5) +
               ')'
            }
          )

        // LINE AXIS
        radarGroup.selectAll('.line-axis')
          .data(referenceData).enter()
          .append('path')
            .classed('line-axis', true)
            .style('stroke', axisColor)

        radarGroup.selectAll('.line-axis')
          .attr('d', function (d, i) { return yAxisLineGenerator([[0, 0], d3.pointRadial(i * angleSlice, radiusScale(domainRange))]) })
          .style('stroke-width', axisStrokeWidth * radius)

        // AXIS TEXT
        radarGroup.selectAll('.line-axis-text')
          .data(axisTexts).enter()
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
            return 'translate(' + coordinates.join(',') + ')'
          })
          .on('mouseover', function (d, i, n) { return hoverCallbackFunctions.forEach(function (callback) { return callback(d, i, n) }) })
          .on('mouseout', mouseoutHighlight)

        // DATA POINTS
        updateDataPointPositions(animate)

        // HEADER TEXT
        overlayTextElement
          .style('font-size', radius + 'px')
          .style('display', displayModeMiniaturized ? '' : 'none')
          .style('position', displayModeMiniaturized ? '' : 'absolute')
          .attr('transform', '')

        const radarGroupBBox = radarGroup.node().getBBox()
        if (displayModeMiniaturized) {
          overlayTextElement // .append('tspan')
            .text(headerText)
            // .style('font-size', 20 + 'px')
          // addSvgTspansFromArray(overlayTextElement.node(), overlayTextArray, 10, overlayTextLineHeight)
          const overlayTextBBox = overlayTextElement.node().getBBox()
          const targetTextWidth = 1.5 * headerTextWidth * radius
          calculatedOverlayTextScaling = targetTextWidth / overlayTextBBox.width
          const textScaling = forcedOverlayTextScaling !== null ? forcedOverlayTextScaling : calculatedOverlayTextScaling
          const scaledTextHeight = overlayTextBBox.height * textScaling
          activeOverlayTransform =
                    'translate(' + (radarGroupBBox.width / 2 + margin.left) + ',' + (radarGroupBBox.height + scaledTextHeight + margin.top) + ')' +
                    // 'translate(' + (margin.left - radarGroupBBox.x) + ',' + (margin.right - radarGroupBBox.y) + ')' +
                    // 'translate(0,' + scaledTextHeight + ')' +
                    'scale(' + textScaling + ') '
          overlayTextElement
            .attr('transform', activeOverlayTransform)
        }

        // GROUP POSITIONING
        offsetLeft = margin.left - radarGroupBBox.x
        offsetTop = margin.top - radarGroupBBox.y
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
        let pointDataForOption = pointData.map(function (subarray) { return subarray[selectedPerspectiveOption] })
        pointDataForOption = pointDataForOption.map(function (n, i) {
          return goodDirection === 'HIGH' ? n - referenceData[i] : referenceData[i] - n
        })
        radarGroup.selectAll('.datapoint')
          .data(pointDataForOption).enter()
            .append('g')
              .classed('datapoint', true)
              .append('path')
                .classed('datapoint-symbol', true)
                .attr('d', dataPointSymbol)
                .attr('fill', dataPointColor)
                // .attr('fill', function (d, i, n) {
                //   return dax.colors.colorTextForValue(d, referenceData[i], goodDirection)
                // })
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

      // function addSvgTspansFromArray (svgTextElement, textArray, fontSize, lineHeight) {
      //   const textElement = d3.select(svgTextElement)
      //   textElement.selectAll('*').remove()
      //   textElement.selectAll('.wordwrap')
      //     .data(textArray).enter()
      //     .append('tspan')
      //       .classed('wordwrap', true)
      //       .attr('text-align', 'center')
      //       .style('font-size', fontSize + 'px')
      //       .text(function (d) { return d })
      //       .attr('x', 0)
      //       .attr('dy', function (d, i) { return i * fontSize * lineHeight })
      //   textElement.selectAll('.wordwrap')
      //     .attr('dx', function (d, i, nodes) {
      //       return -(nodes[i].getBoundingClientRect().width / 2)
      //     })
      // }

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

        const rectCornerPixelX = rectMidX * textRadius
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

      // Domain range argument is optional
      radarChart.setData = function (pointDataArray, animate, domainRangeInput) {
        if (!isNaN(domainRangeInput) && typeof domainRangeInput !== 'undefined') {
          axisXRingStepSize = domainRangeInput > 50 ? 10 : 5
          domainRange = Math.ceil(domainRangeInput / axisXRingStepSize) * axisXRingStepSize
        }
        if (axisTextArray.length !== pointDataArray.length) {
          throw new Error('Invalid radar chart input data, different array lengths.')
        }
        pointData = pointDataArray
        updateDataPointPositions(animate)
        // updateChartElements(a)
      }

      radarChart.setWidth = function (width) {
        radius = width / 2 - Math.max(margin.top + margin.bottom, margin.left + margin.bottom)
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

      const imageScaling = 2 // TODO externalize
      radarChart.generateImage =
        function () {
          const doctype = '<?xml version="1.0" standalone="no"?>' +
            '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'

          // Copy existing chart
          const chartCopy = d3.select(chart.node().cloneNode(true))
          const radarGroupCopy = chartCopy.select('g')
          const svg = chartCopy.node()

          // Extract text and then remove axis tspans
          const axisTextsSplit = []
          let textSelection = radarGroupCopy.select('.line-axis-text')
          while (!textSelection.empty()) {
            const textRows = []
            let tspanSelection = textSelection.select('tspan')
            while (!tspanSelection.empty()) {
              textRows.push(tspanSelection.text())
              tspanSelection.remove()
              tspanSelection = textSelection.select('tspan')
            }
            axisTextsSplit.push(textRows)
            textSelection.remove()
            textSelection = radarGroupCopy.select('.line-axis-text')
          }

          // Adjust chart element css
          chartCopy.style('margin', 0)

          // Scale the copied element baed on the imageScaling constant
          const widthBefore = chartCopy.attr('width')
          chartCopy.attr('width', imageScaling * (Number(widthBefore)))
          const heightBefore = chartCopy.attr('height')
          chartCopy.attr('height', imageScaling * Number(heightBefore))
          chartCopy.style('transform', 'scale(' + imageScaling + ')' +
            'translate(' + ((Number(widthBefore)) / 2) + 'px,' + (Number(heightBefore) / 2) + 'px)')

          // Define SVG and generate blob
          const source = (new XMLSerializer()).serializeToString(svg)
          const blob = new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' })
          const url = window.URL.createObjectURL(blob)
          const imgSelection = d3.select('body').append('img')
            .style('visibility', 'hidden')
          const img = imgSelection.node()

          // On image load function
          img.onload = function () {
            // Generate initial chart canvas
            const canvasChartSelection = d3.select('body').append('canvas')
              .attr('width', img.width)
              .attr('height', img.height)
              .style('visibility', 'hidden')
            const canvasChart = canvasChartSelection.node()
            const chartCtx = canvasChart.getContext('2d')

            // Draw image to canvas
            chartCtx.drawImage(img, 0, 0)

            // Define image header text
            const imageHeaderText = perspectiveOptionText + ': ' + d3.select('.radar-chart-full-header').text()
            const imageHeaderFontSize = 16 * imageScaling
            const imageHeaderPaddingBottom = 10 * imageScaling
            const imageHeaderFont = 'bold ' + imageHeaderFontSize + 'px "Varta"'
            const imageHeaderHeight = imageHeaderFontSize + imageHeaderPaddingBottom

            // Define image margins
            const imgMargin = {
              top: 10 * imageScaling,
              right: 20 * imageScaling,
              bottom: 20 * imageScaling,
              left: 20 * imageScaling,
            }

            // Define composite canvas
            const canvasCompleteSelection = d3.select('body').append('canvas')
              .style('visibility', 'hidden')
            const canvasComplete = canvasCompleteSelection.node()
            const ctx = canvasCompleteSelection.node().getContext('2d')

            // Set header font
            ctx.font = imageHeaderFont

            // Calculate header width
            const headerWidth = ctx.measureText(imageHeaderText).width

            // Calculate needed height and width for final image
            const imgAdditionalWidth = Math.max(0, headerWidth - img.width)
            const completeWidth = imgMargin.left + img.width + imgAdditionalWidth + imgMargin.right
            const completeHeight = imgMargin.top + imageHeaderHeight + img.height + imgMargin.bottom
            const imageHeaderHorizontalShift = completeWidth / 2 - headerWidth / 2
            canvasCompleteSelection
              .attr('width', completeWidth + 'px')
              .attr('height', completeHeight + 'px')

            // Fill white background
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, completeWidth, completeHeight)

            // Draw header text
            ctx.fillStyle = 'black'
            ctx.font = imageHeaderFont
            ctx.fillText(imageHeaderText, imageHeaderHorizontalShift, imageHeaderFontSize + imgMargin.top)

            // Define watermark text
            const customDataChart = false // TODO should not be hardcoded, userprofile should set to true
            let watermarkText = dax.text(customDataChart ? 'user_profile.image.watermark' : 'profile.chart.mean_bar_vertical.image.watermark')

            const date = new Date()
            watermarkText = watermarkText.replace(
              '{date}',
              date.getFullYear() + '-' +
              ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
              ('0' + date.getDate()).slice(-2))
              .replace('Profildiagram', 'Radardiagram') // TODO externalize Radar as separate text

            // Define filename
            const fileName = dax.text(customDataChart ? 'user_profile.chart.mean_bar_vertical.image.filename' : 'profile.image.filename')
              .replace('{option}', imageHeaderText)
              .replace('Profildiagram', 'Radardiagram') // TODO externalize Radar as separate text

            // Draw watermark text
            const sourceFontHeight = 11 * imageScaling
            ctx.font = sourceFontHeight + 'px "Varta"'
            ctx.fillStyle = '#555'
            ctx.fillText(watermarkText, 5, completeHeight - 8)

            // Draw image canvas to composite canvas
            const imgDrawX = imgMargin.left + imgAdditionalWidth / 2
            const imgDrawY = imgMargin.top + imageHeaderHeight
            ctx.drawImage(canvasChart, imgDrawX, imgDrawY)

            // Manually redraw text
            const axisTextFontHeight = 15 * imageScaling
            const textBoxHeightEstimation = axisTextFontHeight * 0.7
            ctx.font = axisTextFontHeight + 'px "Varta"'
            ctx.fillStyle = '#000'
            const lineSpacing = 5 * imageScaling
            const angleSlice = 2 * Math.PI / referenceData.length
            axisTextsSplit.forEach(function (textArray, i) {
              const angle = 0.75 * TAU + i * angleSlice
              var maxTextWidth = textArray.reduce(function (acc, t) {
                return Math.max(acc, ctx.measureText(t).width)
              }, 0)
              const heightEstimation = textArray.length * textBoxHeightEstimation + (textArray.length - 1) * lineSpacing
              const coordinates = getTextCoordinates(radius * imageScaling, angle, maxTextWidth, heightEstimation)
              textArray.forEach(function (text, j) {
                const x = coordinates[0] + imgDrawX + offsetLeft * imageScaling - ctx.measureText(text).width / 2
                const y = coordinates[1] + imgDrawY + offsetTop * imageScaling + textBoxHeightEstimation * (j + 1) + lineSpacing * j
                ctx.fillText(text, x, y)
              })
            })

            // Generate image download for user
            canvasComplete.toBlob(function (blob) {
              saveAs(blob, fileName + '.png')
            })

            // Clean up
            imgSelection.remove()
            canvasChartSelection.remove()
            canvasCompleteSelection.remove()
          }

          // Set image content, triggering the onload function
          img.src = url
        }

      // Return interactible chart object
      return radarChart
    }
})(window.dax = window.dax || {})
