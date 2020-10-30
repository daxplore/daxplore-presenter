(function (namespace) {
  namespace.colors = namespace.colors || {}
  const exports = namespace.colors

  // TODO export colors from producer
  const colors = {}

  colors.good = '#509a5c' // =  hsl(130, 32%, 46%)
  colors.average = '#c5c2bd' // = hsl(37, 6%, 76%)
  colors.bad = '#d13d40' // = hsl(359, 62%, 53%)

  colors.goodHover = 'hsl(130, 32%, 39%)'
  colors.averageHover = 'hsl(37, 6%, 66%)'
  colors.badHover = 'hsl(359, 62%, 43%)'

  colors.goodTooltipBackground = 'hsl(130, 32%, 56%)'
  colors.averageTooltipBackground = 'hsl(37, 6%, 86%)'
  colors.badTooltipBackground = 'hsl(359, 62%, 63%)'

  colors.goodText = 'hsl(95, 38%, 34%)'
  colors.averageText = 'hsl(60, 0%, 31%)'
  colors.badText = 'hsl(359, 62%, 53%)'

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
})(window.dax = window.dax || {})
