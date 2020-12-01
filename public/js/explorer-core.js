(function (namespace) {
  namespace.explorer = namespace.explorer || {}
  const exports = namespace.explorer

  let groups, perspectives, questions, settings

  let currentHash = null

  const questionData = {}
  const questionMap = {}
  const dichselectedMap = {}
  const optionsMap = {}
  const timepointsMap = {}

  let maxHeight = -1

  function onHashUpdate () {
    if (currentHash === window.location.hash.slice(1)) {
      return
    }
    currentHash = window.location.hash.slice(1)
    if (currentHash !== null && typeof currentHash === 'string' && currentHash.length !== 0) {
      // Get query definition string from hash
      // Parse the query definition into a (potentially empty or partially empty) query object
      const queryDefinition = dax.querydefinition.parseString(currentHash)
      dax.explorer.questionSetQueryDefinition(queryDefinition.question)
      const totalSelected = queryDefinition.flags.indexOf('TOTAL') !== -1
      dax.explorer.perspectiveSetQueryDefinition(queryDefinition.perspective, queryDefinition.perspectiveSecondary, queryDefinition.perspectiveOptions, totalSelected)
    }
    dax.explorer.selectionUpdateCallback()
  }

  exports.initializeExplorer =
  function () {
    // Use Axios to download all needed metadata files from the server
    // Define functions for all metadata files to be downloaded
    function getGroups () { return axios.get('data/groups.json') }
    function getPerspectives () { return axios.get('data/perspectives.json') }
    function getQuestions () { return axios.get('data/questions.json') }
    function getSettings () { return axios.get('data/settings.json') }
    function getUsertexts () { return axios.get('data/usertexts.json') }
    function getManifest () { return axios.get('data/manifest.json') }

    // Make a batch Axios request to download all metadata asynchronously
    axios.all([getGroups(), getPerspectives(), getQuestions(), getSettings(), getUsertexts(), getManifest()])
    .then(axios.spread(function (groupsResponse, perspectivesResponse, questionsResponse, settingsResponse, usertextsResponse, manifestResponse) {
      // Get the downloaded metadata
      groups = groupsResponse.data
      perspectives = perspectivesResponse.data
      questions = questionsResponse.data
      settings = settingsResponse.data
      const usertexts = usertextsResponse.data
      const manifest = manifestResponse.data

      // The function logs the error as a side effect,
      // so if the versions don't match all we have to do here is exit
      // TODO communicate the error directly in the DOM?
      if (!dax.common.hasMatchingDataFileVersions(manifest.dataPackageVersion)) {
        return
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        questionMap[q.column] = q
        dichselectedMap[q.column] = q.dichselected
        optionsMap[q.column] = q.options
        timepointsMap[q.column] = q.timepoints
      }

      // Download all question data
      // TODO download at the same time as other data (only get groups.json first) and/or on demand
      function getQuestionData (questionID) { return axios.get('data/questions/' + questionID + '.json') }
      const variableRequests = []
      for (let i = 0; i < groups.length; i++) {
        for (let j = 0; j < groups[i].questions.length; j++) {
          variableRequests.push(getQuestionData(groups[i].questions[j]))
        }
      }

      axios.all(variableRequests).then(function (responsesArray) {
        responsesArray.forEach(function (response) {
          for (let i = 0; i < response.data.length; i++) {
            const question = response.data[i].q
            const perspective = response.data[i].p
            if (i === 0) {
              questionData[question] = {}
            }
            questionData[question][perspective] = response.data[i]
          }
        })

        // Initialize elements that depend on the metadata
        dax.text.initializeResources(usertexts)
        dax.settings.initializeResources(settings)
        dax.data.initializeResources(groups, perspectives, questionMap, questionData)
        dax.explorer.generateQuestionPicker(questions, groups, settings)
        dax.explorer.generatePerspectivePicker(settings)
        dax.explorer.generateChartPanel(questions, groups, null, null, dichselectedMap, optionsMap, timepointsMap) // TODO fix constructor

        onHashUpdate()
        window.addEventListener('hashchange', onHashUpdate, false)

        // Send height changes to parent window, so it can update iframe size
        if (window.ResizeObserver) {
          const outerElement = document.querySelector('.daxplore-explorer')
          const resizeObserver = new ResizeObserver(function (entries) {
            for (let i = 0; i < entries.length; i++) {
              if (entries[i].target === outerElement) {
                if (entries[i].contentRect.height > maxHeight) {
                  maxHeight = entries[i].contentRect.height
                  parent.postMessage({ height: maxHeight }, '*')
                }
                break
              }
            }
          })
          resizeObserver.observe(outerElement)
        }
      })
    }))
  }

  function dichotomizedSubtitle (optionTexts) {
    const optCount = optionTexts.length
    if (optCount === 0) { return '' }

    const subStart = dax.text('dichotomizedSubtitleStart') // TODO use new text ID style
    const subEnd = dax.text('dichotomizedSubtitleEnd') // TODO use new text ID style

    if (optionTexts.length === 1) {
      return subStart + optionTexts[0] + subEnd
    }

    const subSeparator = dax.text('dichotomizedSubtitleSeparator') // TODO use new text ID style
    const subOr = dax.text('dichotomizedSubtitleOr') // TODO use new text ID style

    let sub = subStart
    sub += optionTexts.slice(0, optCount - 1).join(subSeparator)
    sub += subOr + optionTexts[optCount - 1] + subEnd

    return sub
  }

  // TODO move to separate file?
  function setDescription (questionID, perspectives) {
    // TODO construct from elements instead of raw html
    let html = ''

    const questionDescription = questionMap[questionID].description
    if (questionDescription !== null && questionDescription !== undefined && questionDescription.trim().length > 0) {
      const title = questionMap[questionID].short
      html += '<b>' + title + '</b><p>' + questionDescription + '</p>'
    }

    perspectives.forEach(function (perspectiveID) {
      const perspectiveDescription = questionMap[perspectiveID].description
      if (perspectiveDescription !== null && perspectiveDescription !== undefined && perspectiveDescription.trim().length > 0) {
        if (html.length > 0) {
          html += '<hr>'
        }
        const title = questionMap[perspectiveID].short
        html += '<b>' + title + '</b><p>' + perspectiveDescription + '</p>'
      }
    })

    d3.select('.description-panel')
      .html(html)
      .style('display', html.length > 0 ? 'inherit' : 'none')

    dax.chart.meanbars.setHeaderDescriptionHTML(html)
  }

  // Called by all other elements whenever their state is updated in a way that
  // will update the page state as a whole
  exports.selectionUpdateCallback =
  function () {
    const question = dax.explorer.getSelectedQuestion()
    const perspective = dax.explorer.getSelectedPerspectives()
    const perspectiveOptions = dax.explorer.getSelectedPerspectiveOptions()
    const perspectiveOptionsCombined = dax.explorer.getSelectedPerspectiveOptionsCombined()
    // const totalSelected = dax.explorer.isPerspectiveTotalSelected()

    // TODO temporary hack, should be handled by tab component
    let tab = dax.explorer.getSelectedTab()
    if (questionMap[question].displaytypes.indexOf(tab) === -1) {
      tab = questionMap[question].displaytypes[0]
    }

    // TODO dich subtitle should be handled by a dich subsystem
    let dichSubtitle = ''
    if (tab === 'DICH') {
      const optionTexts = questionMap[question].options
      const usedDichTexts = []
      dichselectedMap[question].forEach(function (i) {
        usedDichTexts.push(optionTexts[i])
      })
      dichSubtitle = dichotomizedSubtitle(usedDichTexts)
    }
    setDescription(question, perspective)
    dax.explorer.chartSetQueryDefinition(tab, 'TIMEPOINTS_ONE', question, perspective, perspectiveOptionsCombined, dichSubtitle)

    // TODO move to separate function/file/namespace?
    // TODO handle all flags
    const queryHash = dax.querydefinition.encodeString(question, perspective, perspectiveOptions, [tab])
    if (currentHash !== queryHash) {
      currentHash = queryHash
      // Set the hash of this window
      window.location.hash = queryHash
      // Send a message to iframe parent to allow the outer page to update window hash
      parent.postMessage({ hash: queryHash }, '*')
    }

    // Hack used as a backup in browsers that don't support ResizeObserver
    if (!window.ResizeObserver) {
      postUpdateHeightToParent()
      setTimeout(postUpdateHeightToParent, 1)
      setTimeout(postUpdateHeightToParent, 100)
    }
  }

  // Update function used as a backup in browsers that don't support ResizeObserver
  function postUpdateHeightToParent () {
    const height = Math.max(
      d3.select('.daxplore-explorer').node().getBoundingClientRect().height,
      d3.select('.question-panel').node().getBoundingClientRect().height +
      d3.select('.description-left').node().getBoundingClientRect().height
    )
    if (height > maxHeight) {
      maxHeight = height
      parent.postMessage({ height: maxHeight }, '*')
    }
  }
})(window.dax = window.dax || {})
