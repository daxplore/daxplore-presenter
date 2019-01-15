(function (namespace) {
  namespace.explorer = namespace.explorer || {}
  const exports = namespace.explorer

  var groups, perspectives, questions, settings, usertexts
  const questionData = {}
  const questionMap = {}
  const dichselectedMap = {}
  const optionsMap = {}
  const timepointsMap = {}

  function updateFromHash () {
    // Get query definition string from hash
    let queryDefinition = daxplore.querydefinition.parseString(window.location.hash.slice(1))
    // Parse the query definition into a (potentially empty or partially empty) query object
    daxplore.explorer.questionSetQueryDefinition(queryDefinition.question)
    let totalSelected = queryDefinition.flags.indexOf('TOTAL') !== -1
    daxplore.explorer.perspectiveSetQueryDefinition(queryDefinition.perspective, queryDefinition.perspectiveOptions, totalSelected)
    daxplore.explorer.selectionUpdateCallback()
  }

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

        updateFromHash()
        window.addEventListener('hashchange', updateFromHash, false)
      })
    }))
  }

  function dichotomizedSubtitle (optionTexts) {
    let optCount = optionTexts.length
    if (optCount === 0) { return '' }

    let subStart = usertexts.dichotomizedSubtitleStart
    let subEnd = usertexts.dichotomizedSubtitleEnd

    if (optionTexts.length === 1) {
      return subStart + optionTexts[0] + subEnd
    }

    let subSeparator = usertexts.dichotomizedSubtitleSeparator
    let subOr = usertexts.dichotomizedSubtitleOr

    let sub = subStart
    sub += optionTexts.slice(0, optCount - 1).join(subSeparator)
    sub += subOr + optionTexts[optCount - 1] + subEnd

    return sub
  }

  // TODO move to separate file?
  function setDecription (questionID, perspectiveID) {
    let html = ''

    let questionDescription = questionMap[questionID].description
    if (questionDescription !== null && questionDescription !== undefined && questionDescription.trim().length > 0) {
      let title = questionMap[questionID].short
      html += '<b>' + title + '</b><p>' + questionDescription + '</p>'
    }

    let perspectiveDescription = questionMap[perspectiveID].description
    if (perspectiveDescription !== null && perspectiveDescription !== undefined && perspectiveDescription.trim().length > 0) {
      if (html.length > 0) {
        html += '<hr>'
      }
      let title = questionMap[perspectiveID].short
      html += '<b>' + title + '</b><p>' + perspectiveDescription + '</p>'
    }

    d3.select('.description-panel')
      .html(html)
      .style('display', html.length > 0 ? null : 'none')
  }

  // Called by all other elements whenever their state is updated in a way that
  // will update the page state as a whole
  exports.selectionUpdateCallback = function () {
    const question = daxplore.explorer.getSelectedQuestion()
    const perspective = daxplore.explorer.getSelectedPerspective()
    const perspectiveOptions = daxplore.explorer.getSelectedPerspectiveOptions()
    // const totalSelected = daxplore.explorer.isPerspectiveTotalSelected()
    // TODO temporary hack, should be handled by tab component
    let tab = daxplore.explorer.getSelectedTab()
    if (questionMap[question].displaytypes.indexOf(tab) === -1) {
      tab = questionMap[question].displaytypes[0]
    }
    // console.log(question, perspective, perspectiveOptions, totalSelected, tab)
    const stat = questionData[question][perspective]

    // TODO move to separate function/file/namespace?
    // TODO handle all flags
    let queryHash = daxplore.querydefinition.encodeString(question, perspective, perspectiveOptions, [tab])
    if (window.location.hash !== queryHash) {
      // Set the hash of this window
      window.location.hash = queryHash
      // Send a message to parents that hold this page in an iframe to allow the outer page to update it's window hash
      parent.postMessage(queryHash, '*')
    }

    let dichSubtitle = ''
    if (tab === 'DICHOTOMIZED') {
      let optionTexts = questionMap[question].options
      let usedDichTexts = []
      dichselectedMap[question].forEach(function (i) {
        usedDichTexts.push(optionTexts[i])
      })
      dichSubtitle = dichotomizedSubtitle(usedDichTexts)
    }
    setDecription(question, perspective)
    daxplore.explorer.chartSetQueryDefinition(tab, 'TIMEPOINTS_ONE', stat, perspectiveOptions, dichSubtitle)
  }
})(window.daxplore = window.daxplore || {})
