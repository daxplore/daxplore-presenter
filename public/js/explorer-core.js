(function (namespace) {
  namespace.explorer = namespace.explorer || {}
  const exports = namespace.explorer

  exports.initializeExplorer = function () {
    // Use Axios to download all needed metadata files from the server
    // Define functions for all metadata files to be downloaded
    function getGroups () { return axios.get('data/groups.json') }
    function getPerspectives () { return axios.get('data/perspectives.json') }
    function getQuestions () { return axios.get('data/questions.json') }
    function getSettings () { return axios.get('data/settings.json') }
    function getUsertexts () { return axios.get('data/usertexts.json') }

    // Make a batch Axios request to download all metadata asynchronously
    axios.all([getGroups(), getPerspectives(), getQuestions(), getSettings(), getUsertexts()])
    .then(axios.spread(function (groupsResponse, perspectivesResponse, questionsResponse, settingsResponse, usertextsResponse) {
      // Get the downloaded metadata
      let groups = groupsResponse.data
      let perspectives = perspectivesResponse.data
      let questions = questionsResponse.data
      let settings = settingsResponse.data
      let usertexts = usertextsResponse.data

      // Initialize elements that depend on the metadata
      daxplore.explorer.generateQuestionPicker(questions, groups, usertexts, settings)
      daxplore.explorer.generatePerspectivePicker(questions, perspectives, usertexts, settings)
      daxplore.explorer.generateChartPanel(questions, groups, null, null) // TODO fix constructor
    }))
  }
})(window.daxplore = window.daxplore || {})
