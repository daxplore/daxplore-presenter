(function (namespace) {
  namespace.userprofile = namespace.userprofile || {}
  const exports = namespace.userprofile

  let maxHeight = -1

  function populateUserProfileDOM (qIDs, meanReferenceMap, shorttextMap, descriptionMap, directionMap, titleRegexpMap) {
    d3.select('.user-paste-data-header-text')
      .text(dax.text('userProfileHeaderText')) // TODO use new text ID style

    d3.select('.user-paste-data-description')
      .text(dax.text('userProfilePasteDataDescription')) // TODO use new text ID style

    d3.select('.user-paste-data-submit-explanation')
      .text(dax.text('userProfilePasteDataSubmitExplanation')) // TODO use new text ID style

    d3.select('.user-paste-data-submit-button')
      .text(dax.text('userPasteDataSubmitButton')) // TODO use new text ID style

    d3.select('.user-paste-data-error-log-header-text')
      .text(dax.text('userProfilePasteDataErrorLogHeader')) // TODO use new text ID style

    d3.select('.user-paste-data-error-text-number-bounds-errors')
      .text(dax.text('userPasteDataErrorTextNumberBoundsErrors')) // TODO use new text ID style

    d3.select('.user-paste-data-error-text-no-number-errors')
      .text(dax.text('userPasteDataErrorTextNoNumberErrors')) // TODO use new text ID style

    d3.select('.user-paste-data-error-text-no-row-errors')
      .text(dax.text('userPasteDataErrorTextNoRowErrors')) // TODO use new text ID style

    d3.select('.profile-save-image')
      .text(dax.text('imageSaveButton')) // TODO use new text ID style

    dax.userprofile.generateUserPasteSection()

    dax.userprofile.generateGrid(qIDs, meanReferenceMap, shorttextMap, directionMap, titleRegexpMap)

    dax.profile.generateListChart(qIDs, meanReferenceMap, shorttextMap, directionMap, 0, true)

    dax.userprofile.addGridUpdateCallback(function (names, means) {
      dax.profile.setChartData(names, means)
    })
  }

  function populateRadarDOM (radargraphData, questions, qIDs) {
    d3.select('.radargraph-save-image')
      .text(dax.text('imageSaveButton'))
    d3.select('.radarchart-save-image')
      .text(dax.text('imageSaveButton'))
    dax.radargraph.initializeRadarGraph(radargraphData, questions, qIDs)
    dax.userprofile.addGridUpdateCallback(function (names, means) {
      dax.radargraph.setChartData(names, means)
    })
  }

  function onTabClick () {
    const classes = this.classList
    let tab
    for (let i = 0; i < classes.length; i++) {
      if (classes[i] === 'profile') {
        tab = 'profile'
        break
      } else if (classes[i] === 'radar') {
        tab = 'radar'
        break
      }
    }

    if (typeof tab !== 'undefined') {
      d3.selectAll('.chart-tab')
        .classed('chart-tab-selected', false)
      d3.select('.chart-tab.' + tab)
        .classed('chart-tab-selected', true)

      d3.select('.profile-chart-row')
        .classed('hidden', tab !== 'profile')
      d3.select('.radar-main')
        .classed('hidden', tab !== 'radar')
    }
  }

  exports.initializeUserProfile =
  function () {
    // Use Axios to download all needed metadata files from the server
    // Define functions for all metadata files to be downloaded
    function getQuestions () { return axios.get('../../data/questions.json') }
    function getSettings () { return axios.get('../../data/settings.json') }
    function getUsertexts () { return axios.get('../../data/usertexts.json') }
    function getListview () { return axios.get('../../data/listview.json') }
    function getManifest () { return axios.get('../../data/manifest.json') }
    function getRadargraph () { return axios.get('../../data/radargraph.json') }

    // Make a batch Axios request to download all metadata and data asynchronously
    axios.all([getQuestions(), getSettings(), getUsertexts(), getListview(), getManifest(), getRadargraph()])
    .then(axios.spread(function (questionsResponse, settingsResponse, usertextsResponse, listviewResponse, manifestResponse, radargraphResponse) {
      // Get the downloaded metadata
      const questions = questionsResponse.data
      // const settings = settingsResponse.data
      const usertexts = usertextsResponse.data
      const listview = listviewResponse.data
      const manifest = manifestResponse.data
      const radargraphData = radargraphResponse.data

      // The function logs the error as a side effect,
      // so if the versions don't match all we have to do here is exit
      // TODO communicate the error directly in the DOM?
      if (!dax.common.hasMatchingDataFileVersions(manifest.dataPackageVersion)) {
        return
      }

      // Add click events to the tabs
      d3.selectAll('.chart-tab')
        .on('click', onTabClick)

      // Set chart tab names
      d3.select('.chart-tab.profile')
        .text('Profildiagram') // TODO externalize
      d3.select('.chart-tab.radar')
        .text('Radardiagram') // TODO externalize

      const shorttextMap = {}
      const descriptionMap = {}
      const directionMap = {}
      const meanReferenceMap = {}
      const titleRegexpMap = {}

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        shorttextMap[q.column] = q.short
        descriptionMap[q.column] = unescape(q.description)

        if ('gooddirection' in q) {
          directionMap[q.column] = q.gooddirection
        }

        if (q.use_mean_reference) {
          meanReferenceMap[q.column] = q.mean_reference
        }

        if (q.titlematchregex) {
          titleRegexpMap[q.column] = q.titlematchregex
        }
      }

      dax.text.initializeResources(usertexts)
      dax.profile.initializeHelpers(meanReferenceMap, shorttextMap, descriptionMap, directionMap)

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function (e) {
          populateUserProfileDOM(listview, meanReferenceMap, shorttextMap, descriptionMap, directionMap, titleRegexpMap)
          populateRadarDOM(radargraphData, questions, [])
        })
      } else {
        populateUserProfileDOM(listview, meanReferenceMap, shorttextMap, descriptionMap, directionMap, titleRegexpMap)
        populateRadarDOM(radargraphData, questions, listview)
      }

      // Send height changes to parent window, so it can update iframe size
      if (window.ResizeObserver) {
        const outerElement = document.querySelector('.userprofile-wrapper')
        const resizeObserver = new ResizeObserver(function (entries) {
          for (let i = 0; i < entries.length; i++) {
            if (entries[i].target === outerElement) {
              if (entries[i].contentRect.height > maxHeight) {
                maxHeight = entries[i].contentRect.height
                parent.postMessage({ source: 'DAXPLORE', height: maxHeight }, '*')
              }
              break
            }
          }
        })
        resizeObserver.observe(outerElement)
      }
    })).catch(function (error) {
      console.error(error)
    })
  }

  exports.headerChange =
  function (select, animateUpdate) {
    dax.profile.setPerspectiveOption(select.value)
    dax.radargraph.setPerspectiveOption(select.value)
  }
})(window.dax = window.dax || {})
