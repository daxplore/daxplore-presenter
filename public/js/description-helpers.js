// Helper functions for generating description texts
(function (namespace) {
  namespace.description = namespace.description || {}
  const exports = namespace.description

  let meanReferences, shorttexts, descriptions, directions, questions

  exports.initializeHelpers =
  function (
    referencesMap,
    shorttextsMap,
    descriptionsMap,
    directionsMap,
    questionMap) { // question input is required for explorer but not used in profile charts
    meanReferences = referencesMap
    shorttexts = shorttextsMap
    descriptions = descriptionsMap
    directions = directionsMap
    questions = questionMap
  }

  exports.getStandardDescription = function (questionID, perspectiveIDs) {
    // TODO construct from elements instead of raw html
    let html = ''

    const questionDescription = questions[questionID].description
    if (questionDescription !== null && questionDescription !== undefined && questionDescription.trim().length > 0) {
      const title = questions[questionID].short
      html += '<div class="description-panel__question"><b>' + title + '</b><p>' + questionDescription + '</p></div>'
    }

    if (perspectiveIDs.length === 0) {
      return html
    }

    html += '<div class="description-panel__perspectives">'
    perspectiveIDs.forEach(function (perspectiveID) {
      const perspectiveDescription = questions[perspectiveID].description
      if (perspectiveDescription !== null && perspectiveDescription !== undefined && perspectiveDescription.trim().length > 0) {
        // if (html.length > 0) {
        //   html += '<hr>'
        // }
        const title = questions[perspectiveID].short
        html += '<div class="description-panel__perspective"><b>' + title + '</b><p>' + perspectiveDescription + '</p></div>'
      }
    })

    html += '</div>'

    return html
  }

  // Returns a formatted HTML string containing a short profile description
  exports.getProfileDescriptionShort =
  function (qID) {
    const shorttext = shorttexts[qID]
    const header = "<span class='description-header'>" + shorttext + '</span><br>'
    const description = descriptions[qID]
    return header + description
  }

  // Returns a formatted HTML string containing a full profile description
  exports.getProfileDescriptionFull =
  function (headerText, qID, mean) {
    headerText = headerText.replace(/\//g, '/\u200b')
    const shorttext = shorttexts[qID]
    const description = descriptions[qID]
    const reference = meanReferences[qID]
    const direction = directions[qID]

    const noData = mean === -1 || isNaN(mean)

    const header = "<div class='description-header'>" + headerText + '</div>'

    if (noData) {
      const subheader = '<b>' + dax.text('explorer.chart.frequency_bar.legend.missing_data') + '</b><br><br>' // TODO create more generic missing data text export
      return header + subheader + description
    }

    const color = dax.colors.colorTextForValue(mean, reference, direction)
    // TODO externalize all text?
    const subheader = '<b>' + shorttext + ': ' + d3.format('d')(mean) + '</b><br>' +
    '<b>' + dax.text('profile.reference.value') + ': ' + d3.format('d')(reference) + '</b><br>'

    const trueDiff = mean - reference
    const diff = direction === 'LOW' ? reference - mean : trueDiff

    let referenceComparison
    if (diff < -5) {
      referenceComparison = dax.text('profile.reference.worse')
    } else if (diff > 5) {
      referenceComparison = dax.text('profile.reference.better')
    } else {
      referenceComparison = dax.text('profile.reference.comparable')
    }
    // TODO externalize all text?
    referenceComparison = '<span style="color: ' + color + '; font-weight: bold">' + referenceComparison + ': ' + d3.format('+d')(trueDiff) + '</span></b><br><br>'

    return header + subheader + referenceComparison + description
  }
})(window.dax = window.dax || {})
