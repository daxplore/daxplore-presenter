(function (namespace) {
  namespace.profile = namespace.profile || {}
  const exports = namespace.profile

  function populateProfileDOM (usertexts, qIDs, meanReferenceMap, shorttextMap, descriptionMap, directionMap, perspectiveOptions, means) {
    d3.select('.save-image')
      .text(usertexts.imageSaveButton)

    dax.profile.generateListChart(qIDs, meanReferenceMap, shorttextMap, usertexts, directionMap, 0)
    dax.profile.setChartData(perspectiveOptions, means)
  }

  exports.initializeProfile = function () {
    // Use Axios to download all needed metadata files from the server
    // Define functions for all metadata files to be downloaded
    function getQuestions () { return axios.get('data/questions.json') }
    function getPerspectives () { return axios.get('data/perspectives.json') }
    function getSettings () { return axios.get('data/settings.json') }
    function getUsertexts () { return axios.get('data/usertexts.json') }
    function getListview () { return axios.get('data/listview.json') }
    function getManifest () { return axios.get('data/manifest.json') }

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const perspective = urlParams.get('perspective')
    const timepoint = urlParams.get('timepoint') != null ? urlParams.get('timepoint') : '0'

    // Make a batch Axios request to download all metadata and data asynchronously
    axios.all([getQuestions(), getPerspectives(), getSettings(), getUsertexts(), getListview(), getManifest()])
    .then(axios.spread(function (questionsResponse, perspectivesResponse, settingsResponse, usertextsResponse, listviewResponse, manifestResponse) {
      // Get the downloaded metadata
      const questions = questionsResponse.data
      const perspectives = perspectivesResponse.data
      // const settings = settingsResponse.data
      const usertexts = usertextsResponse.data
      const listview = listviewResponse.data
      const manifest = manifestResponse.data

      // Validate the perspective URL parameter
      // In case of problems, give feedback directed at the person setting up the presentation
      // TODO communicate the error directly in the DOM?
      if (perspectives.indexOf(perspective) === -1) {
        // const location = new URL(window.location.href)
        if (perspective === null || typeof perspective === 'undefined' || perspective.length === 0) {
          // TODO find IE compatible way to do this
          // location.search = 'perspective=' + perspectives[0]
          dax.common.logError('The URL must contain the perspective parameter, for example: ?perspective=' + perspectives[0]) //, location.href)
        } else {
          dax.common.logError('The used perspective URL paremter is not supported: ?perspective=' + perspective)
        }
        dax.common.logError('Suggested fix: Use one of the perspectives defined in', new URL('data/perspectives.json', window.location.href).href)
        return
      }

      // TODO validate timepoint url parameter

      // The function logs the error as a side effect,
      // so if the versions don't match all we have to do here is exit
      // TODO communicate the error directly in the DOM?
      if (!dax.common.hasMatchingDataFileVersions(manifest.dataPackageVersion)) {
        return
      }

      // TODO do data parsing as a Promise, to prevent blocking of the rest of the data download?
      var perspectiveOptions = []
      const shorttextMap = {}
      const descriptionMap = {}
      const directionMap = {}
      const meanReferenceMap = {}

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        shorttextMap[q.column] = q.short
        descriptionMap[q.column] = unescape(q.description)

        if ('gooddirection' in q) {
          directionMap[q.column] = q.gooddirection
        }

        if (q.column === perspective) {
          perspectiveOptions = q.options
        }

        if (q.use_mean_reference) {
          meanReferenceMap[q.column] = q.mean_reference
        }
      }

      dax.profile.initializeHelpers(meanReferenceMap, shorttextMap, usertexts, descriptionMap, directionMap)

      // Get the data used in the listview
      function getQuestionData (questionID) { return axios.get('data/questions/' + questionID + '.json') }
      const variableRequests = listview.map(function (qID) { return getQuestionData(qID) })
      axios.all(variableRequests).then(function (responsesArray) {
        const qIDs = []
        const means = []
        responsesArray.forEach(function (response) {
          for (let i = 0; i < response.data.length; i++) {
            const d = response.data[i]
            if (d.p === perspective) {
              const qID = d.q
              qIDs.push(qID)
              means.push(d.mean[timepoint].mean)
              break
            }
          }
        })

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function (e) {
            populateProfileDOM(usertexts, qIDs, meanReferenceMap, shorttextMap, descriptionMap, directionMap, perspectiveOptions, means)
          })
        } else {
          populateProfileDOM(usertexts, qIDs, meanReferenceMap, shorttextMap, descriptionMap, directionMap, perspectiveOptions, means)
        }
      })
    }))
  }

  exports.headerChange = function (select) {
    dax.profile.updateSelectorOption(select.value)
  }
})(window.dax = window.dax || {})
