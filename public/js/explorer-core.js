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

  let defaultHash = ''

  // When the explorer is in an iframe it will disable hash updating history, by default.
  // If the URL paramater ?history=on is set, enable hash/history updates.
  const historyEnabled = getURLParameter('history') === 'on'

  // Handle messages from outside the iframe
  function receiveMessage (event) {
    // Do manual origin check. Not secure, but prevents accidentally picking up other events.
    if (!(event.data && event.data.source === 'DAXPLORE')) {
      return
    }
    if (typeof event.data.hash === 'string') {
      updateFromHash(event.data.hash)
    }
  }

  function onHashUpdate () {
    updateFromHash(window.location.hash)
  }

  function updateFromHash (hash) {
    const newHash = hash.slice(1)
    if (currentHash === newHash || typeof newHash !== 'string') {
      return
    }
    currentHash = hash.slice(1)
    if (currentHash.length === 0) {
      // On setting an empty hash, fall back to the location hash
      // This will restore the chart to the initial iframe hash on recieving an empty hash
      currentHash = window.location.hash
    }
    // Get query definition string from hash
    // Parse the query definition into a (potentially empty or partially empty) query object
    const queryDefinition = dax.querydefinition.parseString(currentHash)
    dax.explorer.questionSetQueryDefinition(queryDefinition.question)
    const totalSelected = queryDefinition.flags.indexOf('TOTAL') !== -1
    dax.explorer.perspectiveSetQueryDefinition(queryDefinition.perspective, queryDefinition.perspectiveSecondary, queryDefinition.perspectiveOptions, totalSelected)

    dax.explorer.selectionUpdateCallback(false)
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

      const shorttextMap = {}
      const descriptionMap = {}
      const directionMap = {}
      const meanReferenceMap = {}

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        questionMap[q.column] = q
        dichselectedMap[q.column] = q.dichselected
        optionsMap[q.column] = q.options
        timepointsMap[q.column] = q.timepoints
        shorttextMap[q.column] = q.short
        descriptionMap[q.column] = unescape(q.description)
        if ('gooddirection' in q) {
          directionMap[q.column] = q.gooddirection
        }
        if (q.use_mean_reference) {
          meanReferenceMap[q.column] = q.mean_reference
        }
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
        dax.profile.initializeHelpers(meanReferenceMap, shorttextMap, descriptionMap, directionMap)
        dax.settings.initializeResources(settings)
        dax.data.initializeResources(groups, perspectives, questionMap, questionData)
        dax.explorer.generateQuestionPicker(questions, groups, settings)
        dax.explorer.generatePerspectivePicker(settings)
        dax.explorer.generateChartPanel(questions, groups, null, null, dichselectedMap, optionsMap, timepointsMap) // TODO fix constructor

        defaultHash = getCurrentStateHash()

        onHashUpdate()
        window.addEventListener('message', receiveMessage, false)
        window.addEventListener('hashchange', onHashUpdate, false)

        // Send height changes to parent window, so it can update iframe size
        if (window.ResizeObserver) {
          const outerElement = document.querySelector('.daxplore-explorer')
          const resizeObserver = new ResizeObserver(function (entries) {
            for (let i = 0; i < entries.length; i++) {
              if (entries[i].target === outerElement) {
                if (entries[i].contentRect.height > maxHeight) {
                  maxHeight = entries[i].contentRect.height
                  if (window.self !== window.top) {
                    parent.postMessage({ source: 'DAXPLORE', height: maxHeight }, '*')
                  }
                }
                break
              }
            }
          })
          resizeObserver.observe(outerElement)
        }
      }).catch(function (error) {
        console.error(error)
      })
    })).catch(function (error) {
      console.error(error)
    })
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

  // Helper function for URL search params. Replace with URLSearchParams when IE11 support is dropped.
  function getURLParameter (name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null
  }

  function getCurrentStateHash () {
    const question = dax.explorer.getSelectedQuestion()
    const perspective = dax.explorer.getSelectedPerspectives()
    const perspectiveOptions = dax.explorer.getSelectedPerspectiveOptions()
    // TODO handle all flags
    // const totalSelected = dax.explorer.isPerspectiveTotalSelected()
    // TODO temporary hack, should be handled by tab component
    let tab = dax.explorer.getSelectedTab()
    if (questionMap[question].displaytypes.indexOf(tab) === -1) {
      tab = questionMap[question].displaytypes[0]
    }

    return dax.querydefinition.encodeString(question, perspective, perspectiveOptions, [tab])
  }

  // Called by all other elements whenever their state is updated in a way that
  // will update the page state as a whole
  exports.selectionUpdateCallback =
  function (sendPostMessage) {
    const question = dax.explorer.getSelectedQuestion()
    const perspective = dax.explorer.getSelectedPerspectives()
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

    const queryHash = getCurrentStateHash()
    // If the new hash represents the default state and the hash is empty, it doens't need to be
    // changed since the empty hash already represents the default state.
    if (queryHash === defaultHash && window.location.hash === '') {
      return
    }

    // Only update if the hash hash changed
    if (currentHash === queryHash) {
      return
    }

    currentHash = queryHash
    // If in an iframe, only update the hash if the history is explicitly enabled
    if (window.self === window.top || historyEnabled) {
      // Set the hash of this window.
      // If this is in an iframe, whit will create a new history state in the surrounding page as well.
      window.location.hash = queryHash
    }

    // Send a message to iframe parent to allow the outer page to update window hash
    if (sendPostMessage && window.self !== window.top) {
      parent.postMessage({ source: 'DAXPLORE', hash: queryHash }, '*')
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
      d3.select('.description-left').node().getBoundingClientRect().height)
    if (height > maxHeight) {
      maxHeight = height
      if (window.self !== window.top) {
        parent.postMessage({ source: 'DAXPLORE', height: maxHeight }, '*')
      }
    }
  }
})(window.dax = window.dax || {})
