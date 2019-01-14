(function (namespace) {
  namespace.explorer = namespace.explorer || {}
  const exports = namespace.explorer

  var groups, perspectives, questions, settings, usertexts
  const questionData = {}
  const questionMap = {}
  const dichselectedMap = {}
  const optionsMap = {}
  const timepointsMap = {}

  exports.initializeExplorer = function () {
    // Get initial query definition from hash
    let queryDefinition = daxplore.querydefinition.parseString(window.location.hash.slice(1))
    // console.log(queryDefinition)

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
      groups = groupsResponse.data
      perspectives = perspectivesResponse.data
      questions = questionsResponse.data
      settings = settingsResponse.data
      usertexts = usertextsResponse.data

      for (var i = 0; i < questions.length; i++) {
        var q = questions[i]
        questionMap[q.column] = q
        dichselectedMap[q.column] = q.dichselected
        optionsMap[q.column] = q.options
        timepointsMap[q.column] = q.timepoints
      }

      // Download all question data
      // TODO download at the same time as other data (only get groups.json first) and/or on demand
      function getQuestionData (questionID) { return axios.get('data/questions/' + questionID + '.json') }
      let variableRequests = []
      for (let i = 0; i < groups.length; i++) {
        for (let j = 0; j < groups[i].questions.length; j++) {
          variableRequests.push(getQuestionData(groups[i].questions[j]))
        }
      }

      axios.all(variableRequests).then(function (responsesArray) {
        responsesArray.forEach(function (response) {
          for (let i = 0; i < response.data.length; i++) {
            let question = response.data[i].q
            let perspective = response.data[i].p
            if (i === 0) {
              questionData[question] = {}
            }
            questionData[question][perspective] = response.data[i]
          }
        })

        // Initialize elements that depend on the metadata
        daxplore.explorer.generateQuestionPicker(questions, groups, usertexts, settings)
        daxplore.explorer.generatePerspectivePicker(questions, perspectives, usertexts, settings)
        daxplore.explorer.generateChartPanel(questions, groups, null, null, usertexts, dichselectedMap, optionsMap, timepointsMap) // TODO fix constructor

        daxplore.explorer.questionSetQueryDefinition(queryDefinition.question)
        let totalSelected = queryDefinition.flags.indexOf('TOTAL') !== -1
        daxplore.explorer.perspectiveSetQueryDefinition(queryDefinition.perspective, queryDefinition.perspectiveOptions, totalSelected)

        // TODO don't use hardcoded chart type and timepoint enum
        const stat = questionData[queryDefinition.question][queryDefinition.perspective]
        daxplore.explorer.chartSetQueryDefinition('DICHOTOMIZED', 'TIMEPOINTS_ONE', stat, queryDefinition.perspectiveOptions, 'TODO')
      })
    }))
  }

  // Called by all other elements whenever their state is updated in a way that
  // will update the page state as a whole
  exports.selectionUpdateCallback = function () {
    const question = daxplore.explorer.getSelectedQuestion()
    const perspective = daxplore.explorer.getSelectedPerspective()
    const perspectiveOptions = daxplore.explorer.getSelectedPerspectiveOptions()
    const totalSelected = daxplore.explorer.isPerspectiveTotalSelected()
    const tab = daxplore.explorer.getSelectedTab()
    // console.log(question, perspective, perspectiveOptions, totalSelected, tab)
    const stat = questionData[question][perspective]
    daxplore.explorer.chartSetQueryDefinition(tab, 'TIMEPOINTS_ONE', stat, perspectiveOptions, 'TODO')
  }
})(window.daxplore = window.daxplore || {})
