(function (namespace) {
  namespace.profile = namespace.profile || {}
  const exports = namespace.profile

  var meanReferences, shorttexts, descriptions, directions

  var colors = {}

  colors.good = '#509a5c'
  colors.average = '#c5c2bd'
  colors.bad = '#d13d40'

  colors.goodHover = 'hsl(95, 38%, 57%)'
  colors.averageHover = 'hsl(60, 0%, 51%)'
  colors.badHover = 'hsl( 5, 38%, 67%)'

  colors.goodText = 'hsl(95, 38%, 34%)'
  colors.averageText = 'hsl(60, 0%, 31%)'
  colors.badText = 'hsl( 5, 38%, 42%)'

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
    if (direction === 'LOW') {
      var diff = reference - value
    } else {
      diff = value - reference
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
    if (direction === 'LOW') {
      var diff = reference - value
    } else {
      diff = value - reference
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
    if (direction === 'LOW') {
      var diff = reference - value
    } else {
      diff = value - reference
    }

    if (diff < -5) {
      return colors.badText
    } else if (diff > 5) {
      return colors.goodText
    } else {
      return colors.averageText
    }
  }

  exports.setDescriptionShort =
  function (element, qID) {
    var shorttext = shorttexts[qID]
    var header = "<span class='description-header'>" + shorttext + '</span><br>'
    var description = descriptions[qID]
    element.html(header + description)
  }

  exports.setDescriptionFull =
  function (element, groupName, qID, mean) {
    var shorttext = shorttexts[qID]
    var description = descriptions[qID]
    var reference = meanReferences[qID]
    var direction = directions[qID]

    element.style('opacity', 1)

    var color = dax.profile.colorTextForValue(mean, reference, direction)
    // TODO externalize all text?
    var header = "<span class='description-header'>" + groupName + '</span><br><b>' + shorttext + ': ' + d3.format('d')(mean) + '</b><br>'
    // TODO externalize all text?
    var subheader = '<b>' + dax.text('listReferenceValue') + ': ' + d3.format('d')(reference) + '</b><br>' // TODO use new text ID format

    var trueDiff = mean - reference
    var diff = direction === 'LOW' ? reference - mean : trueDiff

    if (diff < -5) {
      var referenceComparison = dax.text('listReferenceWorse') // TODO use new text ID style
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
