(function (namespace) {
  namespace.userprofile = namespace.userprofile || {}
  const exports = namespace.userprofile

  function populateUserProfileDOM (qIDs, usertexts, meanReferenceMap, shorttextMap, descriptionMap, directionMap) {
    d3.select('.user-paste-data-header-text')
      .text(usertexts.userProfileHeaderText)

    d3.select('.user-paste-data-description')
      .text(usertexts.userProfilePasteDataDescription)

    d3.select('.user-paste-data-submit-explanation')
      .text(usertexts.userProfilePasteDataSubmitExplanation)

    d3.select('.user-paste-data-submit-button')
      .text(usertexts.userPasteDataSubmitButton)

    d3.select('.user-paste-data-error-log-header-text')
      .text(usertexts.UserProfilePasteDataErrorLogHeader)

    d3.select('.user-paste-data-error-text-number-bounds-errors')
      .text(usertexts.userPasteDataErrorTextNumberBoundsErrors)

    d3.select('.user-paste-data-error-text-no-number-errors')
      .text(usertexts.userPasteDataErrorTextNoNumberErrors)

    d3.select('.user-paste-data-error-text-no-row-errors')
      .text(usertexts.userPasteDataErrorTextNoRowErrors)

    d3.select('.save-image')
      .text(usertexts.imageSaveButton)

    dax.userprofile.generateUserPasteSection()

    dax.userprofile.generateGrid(qIDs, meanReferenceMap, shorttextMap, usertexts, directionMap)

    dax.profile.generateListChart(qIDs, meanReferenceMap, shorttextMap, usertexts, directionMap, 0)

    dax.userprofile.addGridUpdateCallback(function (names, means) {
      dax.profile.setChartData(names, means)
    })
  }

  exports.initializeUserProfile = function () {
    // Use Axios to download all needed metadata files from the server
    // Define functions for all metadata files to be downloaded
    function getQuestions () { return axios.get('data/questions.json') }
    function getSettings () { return axios.get('data/settings.json') }
    function getUsertexts () { return axios.get('data/usertexts.json') }
    function getListview () { return axios.get('data/listview.json') }
    function getManifest () { return axios.get('data/manifest.json') }

    // Make a batch Axios request to download all metadata and data asynchronously
    axios.all([getQuestions(), getSettings(), getUsertexts(), getListview(), getManifest()])
    .then(axios.spread(function (questionsResponse, settingsResponse, usertextsResponse, listviewResponse, manifestResponse) {
      // Get the downloaded metadata
      const questions = questionsResponse.data
      // const settings = settingsResponse.data
      const usertexts = usertextsResponse.data
      const listview = listviewResponse.data
      const manifest = manifestResponse.data

      // The function logs the error as a side effect,
      // so if the versions don't match all we have to do here is exit
      // TODO communicate the error directly in the DOM?
      if (!dax.common.hasMatchingDataFileVersions(manifest.dataPackageVersion)) {
        return
      }

      var shorttextMap = {}
      var descriptionMap = {}
      var directionMap = {}
      var meanReferenceMap = {}

      for (let i = 0; i < questions.length; i++) {
        var q = questions[i]
        shorttextMap[q.column] = q.short
        descriptionMap[q.column] = unescape(q.description)

        if ('gooddirection' in q) {
          directionMap[q.column] = q.gooddirection
        }

        if (q.use_mean_reference) {
          meanReferenceMap[q.column] = q.mean_reference
        }
      }

      dax.profile.initializeHelpers(meanReferenceMap, shorttextMap, usertexts, descriptionMap, directionMap)

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function (e) {
          populateUserProfileDOM(listview, usertexts, meanReferenceMap, shorttextMap, descriptionMap, directionMap)
        })
      } else {
        populateUserProfileDOM(listview, usertexts, meanReferenceMap, shorttextMap, descriptionMap, directionMap)
      }
    }))
  }

  exports.headerChange = function (select) {
    dax.profile.updateSelectorOption(select.value)
  }
})(window.dax = window.dax || {})
