(function (exports) {
  function populateUserProfileDOM (qIDs, usertexts, meanReferenceMap, shorttextMap, descriptionMap, directionMap) {
    d3.select('.save-image')
      .text(usertexts.imageSaveButton)

    // TODO don't use .window?
    window.generateUserPasteSection()

    // TODO don't use .window?
    window.generateGrid(qIDs, meanReferenceMap, shorttextMap, usertexts, directionMap)

    // TODO don't use .window?
    window.generateListChart(qIDs, meanReferenceMap, shorttextMap, usertexts, directionMap, 0)

    window.addGridUpdateCallback(function (names, means) {
      window.setChartData(names, means)
    })
  }

  exports.initializeUserProfile = function () {
    // Use Axios to download all needed metadata files from the server
    // Define functions for all metadata files to be downloaded
    function getQuestions () { return axios.get('data/questions.json') }
    function getSettings () { return axios.get('data/settings.json') }
    function getUsertexts () { return axios.get('data/usertexts.json') }
    function getListview () { return axios.get('data/listview.json') }

    // Make a batch Axios request to download all metadata and data asynchronously
    axios.all([getQuestions(), getSettings(), getUsertexts(), getListview()])
    .then(axios.spread(function (questionsResponse, settingsResponse, usertextsResponse, listviewResponse) {
      // Get the downloaded metadata
      const questions = questionsResponse.data
      // const settings = settingsResponse.data
      const usertexts = usertextsResponse.data
      const listview = listviewResponse.data

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

      // TODO don't use .window?
      window.initiateHelpers(meanReferenceMap, shorttextMap, usertexts, descriptionMap, directionMap)

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
    // TODO don't use .window?
    window.updateSelectorOption(select.value)
  }
})(window)
