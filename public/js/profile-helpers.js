(function (namespace) {
  namespace.profile = namespace.profile || {}
  const exports = namespace.profile

  let meanReferences, shorttexts, descriptions, directions

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

    const color = dax.colors.colorTextForValue(mean, reference, direction)
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
