(function (exports) {
  function populateProfileDOM (usertexts, qIDs, meanReferenceMap, shorttextMap, descriptionMap, directionMap, perspectiveOptions, means) {
    d3.select('.save-image')
      .text(usertexts.imageSaveButton)

    // TODO don't use .window?
    window.generateListChart(qIDs, meanReferenceMap, shorttextMap, usertexts, directionMap, 0)
    window.setChartData(perspectiveOptions, means)
  }

  exports.initializeProfile = function () {
    // Use Axios to download all needed metadata files from the server
    // Define functions for all metadata files to be downloaded
    function getQuestions () { return axios.get('data/questions.json') }
    function getSettings () { return axios.get('data/settings.json') }
    function getUsertexts () { return axios.get('data/usertexts.json') }
    function getListview () { return axios.get('data/listview.json') }

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const perspective = urlParams.get('perspective') // TODO handle unset perspective. Console or in page warning?
    const timepoint = urlParams.get('timepoint') != null ? urlParams.get('timepoint') : '0'

    // Make a batch Axios request to download all metadata and data asynchronously
    axios.all([getQuestions(), getSettings(), getUsertexts(), getListview()])
    .then(axios.spread(function (questionsResponse, settingsResponse, usertextsResponse, listviewResponse) {
      // Get the downloaded metadata
      const questions = questionsResponse.data
      // const settings = settingsResponse.data
      const usertexts = usertextsResponse.data
      const listview = listviewResponse.data

      // Get the data used in the listview
      function getQuestionData (questionID) { return axios.get('data/questions/' + questionID + '.json') }
      let variableRequests = listview.map(function (qID) { return getQuestionData(qID) })
      axios.all(variableRequests).then(function (responsesArray) {
        const qIDs = []
        const means = []
        responsesArray.forEach(function (response) {
          for (let i = 0; i < response.data.length; i++) {
            let d = response.data[i]
            if (d.p === perspective) {
              let qID = d.q
              qIDs.push(qID)
              means.push(d.mean[timepoint].mean)
              break
            }
          }
        })

        var perspectiveOptions = []
        var shorttextMap = {}
        var descriptionMap = {}
        var directionMap = {}
        var meanReferenceMap = {}

        for (let i = 0; i < questions.length; i++) {
          let q = questions[i]
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

        // TODO don't use .window?
        window.initiateHelpers(meanReferenceMap, shorttextMap, usertexts, descriptionMap, directionMap)

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
    // TODO don't use .window?
    window.updateSelectorOption(select.value)
  }
})(window)
