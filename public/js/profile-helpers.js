(function (namespace) {
  namespace.profile = namespace.profile || {}
  const exports = namespace.profile

  var meanReferences, shorttexts, usertexts, descriptions, directions

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
    usertextsMap,
    descriptionsMap,
    directionsMap) {
    meanReferences = referencesMap
    shorttexts = shorttextsMap
    usertexts = usertextsMap
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
  function (element, qiD) {
    var shorttext = shorttexts[qiD]
    var header = "<span class='description-header'>" + shorttext + '</span><br>'
    var description = descriptions[qiD]
    element.html(header + description)
  }

  exports.setDescriptionFull =
  function (element, groupName, qiD, mean) {
    var shorttext = shorttexts[qiD]
    var description = descriptions[qiD]
    var reference = meanReferences[qiD]
    var direction = directions[qiD]

    element.transition()
      .duration(0)
        .style('opacity', 1)

    var color = daxplore.profile.colorTextForValue(mean, reference, direction)
    var header = "<span class='description-header'>" + groupName + '</span><br><b>' + shorttext + ': ' + d3.format('d')(mean) + '</b><br>'
    var subheader = '<b>' + usertexts.listReferenceValue + ': ' + d3.format('d')(reference) + '</b><br>'

    var trueDiff = mean - reference
    var diff = direction === 'LOW' ? reference - mean : trueDiff

    if (diff < -5) {
      var referenceComparison = usertexts.listReferenceWorse
    } else if (diff > 5) {
      referenceComparison = usertexts.listReferenceBetter
    } else {
      referenceComparison = usertexts.listReferenceComparable
    }

    referenceComparison = '<span style="color: ' + color + '; font-weight: bold">' + referenceComparison + ': ' + d3.format('+d')(trueDiff) + '</span></b><br><br>'

    element.html(header + subheader + referenceComparison + description)
  }
})(window.daxplore = window.daxplore || {})
