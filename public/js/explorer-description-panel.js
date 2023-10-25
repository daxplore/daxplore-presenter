(function (namespace) {
  namespace.explorer = namespace.explorer || {}
  const exports = namespace.explorer

  let descriptionPanel

  exports.initializeDescriptionPanel =
  function () {
    // Hide all description panels by default
    d3.selectAll('.description-panel__button')
      .style('display', 'none')
    d3.selectAll('.description-panel')
      .style('display', 'none')

    // Select the description panel chosen in the settings
    const descriptionPosition = dax.settings('explorer.description.position')
    switch (descriptionPosition) {
    case 'BOTTOM': descriptionPanel = d3.select('.description-panel.description-bottom'); break
    case 'LEFT': descriptionPanel = d3.select('.description-panel.description-left'); break
    case 'HEADER':
      descriptionPanel = d3.select('.description-panel.description-header')
      d3.select('.description-panel__button.description-header')
        .style('display', 'inherit')
      break
    default: console.warn('Unknown description position: ' + descriptionPosition)
    }

    // Display the chosen description panel
    descriptionPanel
      .style('display', 'inherit')
  }

  exports.setStandardDescription =
  function (questionID, perspectiveIDs) {
    const html = dax.description.getStandardDescription(questionID, perspectiveIDs)
    descriptionPanel
      .html(html)
      .style('display', html.length > 0 ? null : 'none')
  }

  exports.setReferenceDescription =
  function (questionID, mean) {
    // Add a zero-width space after slashes to encourage linebreaks after slashes
    const header = dax.data.getQuestionShortText(questionID).replace(/\//g, '/&#8203;')
    const html = dax.description.getProfileDescriptionFull(header, questionID, mean)
    descriptionPanel
      .html(html)
      .style('display', html.length > 0 ? null : 'none')
  }
})(window.dax = window.dax || {})
