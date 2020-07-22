(function (namespace) {
  namespace.profile = namespace.profile || {}
  const exports = namespace.profile

  let meanReferences, shorttexts, descriptions, directions

  const colors = {}

  // TODO export colors to producer

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

  exports.initializeHelpers =
  function (
    referencesMap,
    shorttextsMap,
    descriptionsMap,
    directionsMap) {
    meanReferences = referencesMap
    shorttexts = shorttextsMap
    descriptions = descriptionsMap
    directions = directionsMap
  }

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
      return colors.badHover
    } else if (diff > 5) {
      return colors.goodHover
    } else {
      return colors.averageHover
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

  exports.setDescriptionShort =
  function (element, qID) {
    const shorttext = shorttexts[qID]
    const header = "<span class='description-header'>" + shorttext + '</span><br>'
    const description = descriptions[qID]
    element.html(header + description)
  }

  exports.setDescriptionFull =
  function (element, groupName, qID, mean) {
    const shorttext = shorttexts[qID]
    const description = descriptions[qID]
    const reference = meanReferences[qID]
    const direction = directions[qID]

    element.style('opacity', 1)

    const color = dax.profile.colorTextForValue(mean, reference, direction)
    // TODO externalize all text?
    const header = "<span class='description-header'>" + groupName + '</span><br><b>' + shorttext + ': ' + d3.format('d')(mean) + '</b><br>'
    // TODO externalize all text?
    const subheader = '<b>' + dax.text('listReferenceValue') + ': ' + d3.format('d')(reference) + '</b><br>' // TODO use new text ID format

    const trueDiff = mean - reference
    const diff = direction === 'LOW' ? reference - mean : trueDiff

    let referenceComparison
    if (diff < -5) {
      referenceComparison = dax.text('listReferenceWorse') // TODO use new text ID style
    } else if (diff > 5) {
      referenceComparison = dax.text('listReferenceBetter') // TODO use new text ID style
    } else {
      referenceComparison = dax.text('listReferenceComparable') // TODO use new text ID style
    }
    // TODO externalize all text?
    referenceComparison = '<span style="color: ' + color + '; font-weight: bold">' + referenceComparison + ': ' + d3.format('+d')(trueDiff) + '</span></b><br><br>'

    element.html(header + subheader + referenceComparison + description)
  }
})(window.dax = window.dax || {})
