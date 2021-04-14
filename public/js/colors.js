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
})(window.dax = window.dax || {})
