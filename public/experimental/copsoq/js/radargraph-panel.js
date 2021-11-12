(function (namespace) {
  namespace.radargraph = namespace.radargraph || {}
  const exports = namespace.radargraph

  const connectionLineColor = '#666'

  const margin = { top: 5, bottom: 5, left: 5, right: 5 }
  const miniRadarWidth = 200
  const graphMidSpacing = 50
  const graphFirstSpacing = 80 // 40
  const graphSecondSpacing = 120 // 80

  const fullRadarWidth = 350

  // Horizontal
  const positions = [
    [0, (miniRadarWidth + graphMidSpacing) / 2],
    [miniRadarWidth + graphFirstSpacing, 0],
    [miniRadarWidth + graphFirstSpacing, miniRadarWidth + graphMidSpacing],
    [2 * miniRadarWidth + graphFirstSpacing + graphSecondSpacing, 0],
    [2 * miniRadarWidth + graphFirstSpacing + graphSecondSpacing, miniRadarWidth + graphMidSpacing],
  ]

  const linkLine = [
    positions[3],
    positions[1],
    positions[0],
    positions[2],
    positions[4],
    positions[1],
  ]

  let selectedPerspectiveOption = 0
  let selectedNode = 0
  let chartNodes, fullCharts
  const fullChartMaxOffset = {}
  let fullCircleCenterOffsets

  let nodes
  let texts, goodDirections, referenceValues
  let qIDs, perspectiveOptions, values

  exports.initializeRadarGraph =
  function (radargraphData, questionsInput, qIDsInput) {
    const questions = questionsInput
    qIDs = qIDsInput
    nodes = radargraphData.nodes

    texts = nodes.map(function (node) {
      return node.qIDs.map(function (qid) {
        for (let i = 0; i < questions.length; i++) {
          if (questions[i].column === qid) {
            return questions[i].short
          }
        }
        throw new Error('Missing question ID in questions array:', qid)
      })
    })
    goodDirections = nodes.map(function (node) {
      return node.qIDs.map(function (qid) {
        for (let i = 0; i < questions.length; i++) {
          if (questions[i].column === qid) {
            return questions[i].gooddirection
          }
        }
        throw new Error('Missing question ID in questions array:', qid)
      })
    })
    referenceValues = nodes.map(function (node) {
      return node.qIDs.map(function (qid) {
        for (let i = 0; i < questions.length; i++) {
          if (questions[i].column === qid) {
            return questions[i].mean_reference
          }
        }
        throw new Error('Missing question ID in questions array:', qid)
      })
    })

    d3.select('#radar-graph')
      .attr('width', 3 * miniRadarWidth + graphFirstSpacing + graphSecondSpacing + margin.left + margin.right)
      .attr('height', 2 * miniRadarWidth + graphMidSpacing + margin.top + margin.bottom)

    d3.select('#radar-graph-group')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    d3.select('#radar-node-path')
      .attr('transform', 'translate(' + miniRadarWidth / 2 + ',' + miniRadarWidth / 2 + ')')
      .style('stroke-width', 3)
      .style('stroke', connectionLineColor)
      .style('fill-opacity', 0)
      .attr('d', d3.line()(linkLine))

    chartNodes = []
    fullCircleCenterOffsets = []
    fullCharts = []
    const overlayTextScaling = []
    for (let i = 0; i < 5; i++) {
      chartNodes[i] = dax.radarchart.createRadarChart('#radar-node-' + i, texts[i], referenceValues[i], goodDirections[i][0], nodes[i].overlayTextArray)
      chartNodes[i].setWidth(miniRadarWidth)
      overlayTextScaling.push(chartNodes[i].getCalculatedOverlayTextScaling())
      d3.select('#radar-node-' + i)
        .attr('transform', 'translate(' + positions[i].join(',') + ')')
        .style('filter', 'drop-shadow(0 0 1px black) drop-shadow(0 0 1px black)')

      // cycle through all charts to find sizes
      fullCharts[i] = dax.radarchart.createRadarChart('#radar-chart-full-' + i, texts[i], referenceValues[i], goodDirections[i][0], nodes[i].overlayTextArray)
      fullCharts[i].setDisplayModeFull()
      fullCharts[i].setWidth(fullRadarWidth)
      fullCircleCenterOffsets[i] = fullCharts[i].getCircleCenterOffsets()
      // fullCharts[i].addHoverCallback(function (d, i, n) { return setDescription(i) })
      fullCharts[i].setDisplayModeFull()
      fullCharts[i].setWidth(fullRadarWidth)
    }

    // Manually set functions due to IE11 issue with binding variable in loop
    d3.select('#radar-node-0').on('click', function () { setFullChart(0) })
    d3.select('#radar-node-1').on('click', function () { setFullChart(1) })
    d3.select('#radar-node-2').on('click', function () { setFullChart(2) })
    d3.select('#radar-node-3').on('click', function () { setFullChart(3) })
    d3.select('#radar-node-4').on('click', function () { setFullChart(4) })

    fullChartMaxOffset.left = fullCircleCenterOffsets.map(function (offsets) { return offsets.left }).reduce(function (a, b) { return Math.max(a, b) })
    fullChartMaxOffset.top = fullCircleCenterOffsets.map(function (offsets) { return offsets.top }).reduce(function (a, b) { return Math.max(a, b) })
    fullChartMaxOffset.right = fullCircleCenterOffsets.map(function (offsets) { return offsets.right }).reduce(function (a, b) { return Math.max(a, b) })
    fullChartMaxOffset.bottom = fullCircleCenterOffsets.map(function (offsets) { return offsets.bottom }).reduce(function (a, b) { return Math.max(a, b) })

    const minTextScale = overlayTextScaling.reduce(function (a, b) { return Math.min(a, b) })
    chartNodes.forEach(function (node) {
      return node.setOverlayTextScaling(minTextScale)
    })

    for (let i = 0; i < 5; i++) {
      d3.selectAll('#radar-chart-full-' + i)
        .style('margin-left', (fullChartMaxOffset.left - fullCircleCenterOffsets[i].left) + 'px')
        .style('margin-top', (fullChartMaxOffset.top - fullCircleCenterOffsets[i].top) + 'px')
        .style('margin-right', (fullChartMaxOffset.right - fullCircleCenterOffsets[i].right) + 'px')
        .style('margin-bottom', (fullChartMaxOffset.bottom - fullCircleCenterOffsets[i].bottom) + 'px')
    }
  }

  exports.setChartData =
  function (perspectiveOptionsInput, means) {
    perspectiveOptions = perspectiveOptionsInput
    values = nodes.map(function (node) {
      return node.qIDs.map(function (qID) {
        return means[qIDs.indexOf(qID)]
      })
    })
    for (let i = 0; i < 5; i++) {
      chartNodes[i].setData(values[i], false)
      chartNodes[i].setPerspectiveOption(perspectiveOptions[selectedPerspectiveOption], selectedPerspectiveOption, false)
      fullCharts[i].setData(values[i], false)
      fullCharts[i].setPerspectiveOption(perspectiveOptions[selectedPerspectiveOption], selectedPerspectiveOption, false)
    }

    setFullChart(0)
  }

  function setFullChart (nodeIndex) {
    selectedNode = nodeIndex
    d3.selectAll('.radar-chart-full')
      .classed('hidden', function (d, i) { return i === selectedNode ? '' : 'none' })
    d3.selectAll('.radar-node')
      .classed('radar-node--highlighted', function (d, i) { return i === nodeIndex })
    d3.select('.radar-chart-full-header')
      .text(nodes[nodeIndex].headerText)
      .style('margin-left', (Math.max(0, fullChartMaxOffset.left - fullChartMaxOffset.right) + 'px'))
      .style('margin-right', (Math.max(0, fullChartMaxOffset.right - fullChartMaxOffset.left) + 'px'))

    setDescription(selectedNode)
  }

  function appendScaleRow (element, node, i) {
    const mean = values[node][i][selectedPerspectiveOption]
    const reference = referenceValues[node][i]
    const diff = mean - reference
    const variableRow = element.append('div')
      .classed('radar-description-variable', true)
    variableRow.append('span')
      .text(texts[node][i] + ': ')
    variableRow.append('span')
      .text(d3.format('+d')(diff))
      .style('color', dax.colors.colorTextForValue(mean, referenceValues[node][i], goodDirections[node][i]))
      .style('font-weight', 'bold')
  }

  function setDescription (node) {
    const descriptionElement = d3.select('.radar-description')
    descriptionElement.html('')
    descriptionElement
      .append('h3')
      .classed('radar-description-header', true)
      .text(nodes[node].headerText)
    descriptionElement
      .append('div')
      .classed('radar-description-body', true)
      .text(nodes[node].descriptionText)

    const missing = []
    const better = []
    const average = []
    const worse = []
    for (let i = 0; i < values[node].length; i++) {
      const directionHigh = goodDirections[node][i] === 'HIGH'
      const mean = values[node][i][selectedPerspectiveOption]
      const reference = referenceValues[node][i]
      if (isNaN(mean)) {
        continue
      } else if (mean === -1) {
        missing.push(i)
      } else if (Math.abs(mean - reference) < 5) {
        average.push(i)
      } else if ((directionHigh && mean > reference) || (!directionHigh && mean < reference)) {
        better.push(i)
      } else {
        worse.push(i)
      }
    }

    if (better.length > 0) {
      descriptionElement
        .append('h4')
        .classed('radar-description-scale-variable-header', true)
        .text('Skalor med ett bättre resultat än referensvärdet:')
      better.forEach(function (i) {
        appendScaleRow(descriptionElement, node, i)
      })
    }

    if (worse.length > 0) {
      descriptionElement
        .append('h4')
        .classed('radar-description-scale-variable-header', true)
        .text('Skalor med ett sämre resultat än referensvärdet:')
      worse.forEach(function (i) {
        appendScaleRow(descriptionElement, node, i)
      })
    }

    if (average.length > 0) {
      descriptionElement
        .append('h4')
        .classed('radar-description-scale-variable-header', true)
        .text('Skalor som ligger ±5 poäng från referensvärdet:')
      average.forEach(function (i) {
        appendScaleRow(descriptionElement, node, i)
      })
    }

    if (missing.length > 0) {
      descriptionElement
        .append('h4')
        .classed('radar-description-scale-variable-header', true)
        .text('Skalor som saknar data:')
      missing.forEach(function (i) {
        descriptionElement.append('div')
          .classed('radar-description-variable', true)
          .text(texts[node][i])
      })
    }
  }

  exports.setPerspectiveOption = function (perspectiveOption) {
    selectedPerspectiveOption = perspectiveOption
    const perspectiveText = perspectiveOptions[selectedPerspectiveOption]
    chartNodes.forEach(function (node) { node.setPerspectiveOption(perspectiveText, perspectiveOption, true) })
    fullCharts.forEach(function (chart, i) { chart.setPerspectiveOption(perspectiveText, perspectiveOption, i === selectedNode) })
    setDescription(selectedNode)
  }

  exports.generateActiveRadarChartImage =
  function () {
    fullCharts[selectedNode].generateImage()
  }

  exports.generateRadarGraphImage =
  function () {
    const doctype = '<?xml version="1.0" standalone="no"?>' +
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'

    const imageScaling = 2
    const chart = d3.select('#radar-graph')
    const widthBefore = chart.attr('width')
    chart.attr('width', imageScaling * (Number(widthBefore)))
    const heightBefore = chart.attr('height')
    chart.attr('height', imageScaling * Number(heightBefore))
    chart.style('transform', 'scale(' + imageScaling + ')' +
      'translate(' + ((Number(widthBefore)) / 2) + 'px,' + (Number(heightBefore) / 2) + 'px)')

    chartNodes.forEach(function (node) { return node.setOverlayFontScaling(0.65) })
    const svg = chart.node()
    const source = (new XMLSerializer()).serializeToString(svg)
    const blob = new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const imgSelection = d3.select('body').append('img')
      .style('visibility', 'hidden')
    const img = imgSelection.node()

    // RESTORE SCALE
    chart.attr('width', widthBefore)
    chart.attr('height', heightBefore)
    chart.style('transform', '')
    chartNodes.forEach(function (node) { return node.setOverlayFontScaling(1) })

    img.onload = function () {
      const canvasChartSelection = d3.select('body').append('canvas')
        .attr('width', img.width)
        .attr('height', img.height)
        .style('visibility', 'hidden')
      const canvasChart = canvasChartSelection.node()

      const chartCtx = canvasChart.getContext('2d')
      chartCtx.drawImage(img, 0, 0)

      const headerText = perspectiveOptions[selectedPerspectiveOption]
      const headerPaddingTop = 0 * imageScaling
      const headerFontSize = 16 * imageScaling
      const headerPaddingBottom = 20 * imageScaling
      const headerFont = 'bold ' + headerFontSize + 'px "Varta"'
      const headerHeight = headerPaddingTop + headerFontSize + headerPaddingBottom

      const imgMargin = { top: 10 * imageScaling, right: 20 * imageScaling, bottom: 20 * imageScaling, left: 10 * imageScaling }

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
      const headerHorizontalShift = 30 + img.width / 2 - headerWidth / 2

      ctx.fillText(headerText, headerHorizontalShift, headerPaddingTop + headerFontSize + imgMargin.top)
      const CUSTOM_DATA_CHART = false // TODO custom chart should not be hardcoded
      let watermarkText = dax.text(CUSTOM_DATA_CHART ? 'user_profile.image.watermark' : 'profile.chart.mean_bar_vertical.image.watermark')

      const date = new Date()
      watermarkText = watermarkText.replace(
        '{date}',
        date.getFullYear() + '-' +
        ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
        ('0' + date.getDate()).slice(-2))
        .replace('Profildiagram', 'Radarmodell') // TODO externalize Radar as separate text

      const fileName = dax.text(CUSTOM_DATA_CHART ? 'user_profile.chart.mean_bar_vertical.image.filename' : 'profile.image.filename')
        .replace('Profildiagram', 'Radarmodell')// TODO externalize Radar as separate text
        .replace('{option}', headerText)

      const sourceFontHeight = 11 * imageScaling
      ctx.font = sourceFontHeight + 'px "Varta"'
      ctx.fillStyle = '#555'
      ctx.fillText(watermarkText, 5, completeHeight - 8)

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
