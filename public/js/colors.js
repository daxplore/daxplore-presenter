(function (namespace) {
  namespace.colors = namespace.colors || {}
  const exports = namespace.colors

  // TODO export colors from producer
  const colors = {}

  // colors.good = '#C5E1A5'
  // colors.average = '#FFF59D'
  // colors.bad = '#FFAB91'
  colors.good = '#B8E18A'
  colors.average = '#FFF59D'
  colors.bad = '#FF9675'

  colors.goodHover = '#A1C579'
  colors.averageHover = '#EFE699'
  colors.badHover = '#DF8366'

  colors.goodText = '#356400'
  colors.averageText = '#655900'
  colors.badText = '#a82800'

  // TODO REMOVE
  colors.goodTooltipBackground = 'hsl(130, 32%, 56%)'
  colors.averageTooltipBackground = 'hsl(37, 6%, 86%)'
  colors.badTooltipBackground = 'hsl(359, 62%, 63%)'

  exports.colorForValue =
  function (value, reference, direction) {
    let diff = value - reference // HIGH
    if (direction === 'LOW') {
      diff = reference - value
    }

    if (diff < -5) {
      return colors.bad
    } else if (diff > 5) {
      return colors.good
    } else {
      return colors.average
    }
  }

  exports.colorHoverForValue =
  function (value, reference, direction) {
    let diff = value - reference // HIGH
    if (direction === 'LOW') {
      diff = reference - value
    }

    if (diff < -5) {
      return colors.badHover
    } else if (diff > 5) {
      return colors.goodHover
    } else {
      return colors.averageHover
    }
  }

  exports.colorTextForValue =
  function (value, reference, direction) {
    let diff = value - reference // HIGH
    if (direction === 'LOW') {
      diff = reference - value
    }

    if (diff < -5) {
      return colors.badText
    } else if (diff > 5) {
      return colors.goodText
    } else {
      return colors.averageText
    }
  }

  exports.colorTooltipBackground =
  function (value, reference, direction) {
    let diff = value - reference // HIGH
    if (direction === 'LOW') {
      diff = reference - value
    }

    if (diff < -5) {
      return colors.badTooltipBackground
    } else if (diff > 5) {
      return colors.goodTooltipBackground
    } else {
      return colors.averageTooltipBackground
    }
  }

  // PATTERNS
  /**
   * Add a stripe defs pattern to a d3 svg selection (a chart) and
   * return a string url reference to the pattern.
   * @param {*} chartSelection A d3 selection containing the chart.
   * @param {*} backgroundColor A d3 color for the background (thick stripes).
   * @param {*} stripeColor A d3 color for the stripes (thin stripes).
   * @returns A string with an url to the pattern: "url(#stripes-000000-FFFFFF)"
   */
  exports.createSvgStripePatternURL =
  function (chartSelection, backgroundColor, stripeColor) {
    const key = 'stripes-' + backgroundColor.hex().slice(1) + '-' + stripeColor.hex().slice(1)

    // generate pattern
    if (!chartSelection.node().getElementById(key)) {
      let defs = chartSelection.select('defs')
      if (defs.empty()) {
        defs = chartSelection.append('defs')
      }
      // generate stripes: https://svg-stripe-generator.web.app/
      const pattern = defs.append('pattern')
        .attr('id', key)
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', '7.5')
        .attr('height', '7.5')
        .attr('patternTransform', 'rotate(45)')
      // background
      pattern.append('rect')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('fill', backgroundColor)
      // stripe lines
      pattern.append('line')
        .attr('x1', '0')
        .attr('y1', '0')
        .attr('x2', '0')
        .attr('y2', '7.5')
        .attr('stroke', stripeColor)
        .attr('stroke-width', 5)
    }

    // Return an url to the pattern
    return 'url(#' + key + ')'
  }
})(window.dax = window.dax || {})
