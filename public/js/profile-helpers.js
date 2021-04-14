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
  function (element, headerText, qID, mean) {
    const shorttext = shorttexts[qID]
    const description = descriptions[qID]
    const reference = meanReferences[qID]
    const direction = directions[qID]

    const noData = mean === -1 || isNaN(mean)

    element.style('opacity', 1)

    const header = "<div class='description-header'>" + headerText + '</div>'

    if (noData) {
      const subheader = '<b>' + dax.text('explorer.freq.legend.missing_data') + '</b><br><br>' // TODO create more generic missing data text export
      element.html(header + subheader + description)
    } else {
      const color = dax.colors.colorTextForValue(mean, reference, direction)
      // TODO externalize all text?
      const subheader = '<b>' + shorttext + ': ' + d3.format('d')(mean) + '</b><br>' +
      '<b>' + dax.text('listReferenceValue') + ': ' + d3.format('d')(reference) + '</b><br>' // TODO use new text ID format

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
  }
})(window.dax = window.dax || {})
