(function (namespace) {
  namespace.userprofile = namespace.userprofile || {}
  const exports = namespace.userprofile

  let maxHeight = -1

  function populateUserProfileDOM (qIDs, meanReferenceMap, shorttextMap, descriptionMap, directionMap, titleRegexpMap) {
    d3.select('.user-paste-data-header-text')
      .text(dax.text('user_profile.paste_data.header'))

    d3.select('.user-paste-data-description')
      .text(dax.text('user_profile.paste_data.instruction'))

    d3.select('.user-paste-data-submit-explanation')
      .text(dax.text('user_profile.paste_data.submit.explanation'))

    d3.select('.user-paste-data-submit-button')
      .text(dax.text('user_profile.paste_data.submit.button'))

    d3.select('.user-paste-data-error-log-header-text')
      .text(dax.text('user_profile.paste_data.error_log.header'))

    d3.select('.user-paste-data-error-text-number-bounds-errors')
      .text(dax.text('user_profile.paste_data.error_log.header.number_bounds'))

    d3.select('.user-paste-data-error-text-no-number-errors')
      .text(dax.text('user_profile.paste_data.error_log.header.no_number'))

    d3.select('.user-paste-data-error-text-no-row-errors')
      .text(dax.text('user_profile.paste_data.error_log.header.no_row'))

    d3.select('.profile-save-image')
      .text(dax.text('common.button.save_chart_as_image'))

    dax.userprofile.generateUserPasteSection()

    dax.userprofile.generateGrid(qIDs, meanReferenceMap, shorttextMap, directionMap, titleRegexpMap)

    dax.profile.generateListChart(qIDs, meanReferenceMap, shorttextMap, directionMap, 0, true)

    dax.userprofile.addGridUpdateCallback(function (names, means) {
      dax.profile.setChartData(names, means)
    })
  }

  function populateRadarDOM (radargraphData, questions, qIDs) {
    d3.select('.radargraph-save-image')
      .text(dax.text('common.button.save_chart_as_image'))
    d3.select('.radarchart-save-image')
      .text(dax.text('common.button.save_chart_as_image'))
    dax.radargraph.initializeRadarGraph(radargraphData, questions, qIDs, true)
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
    // Download the manifest first, cache bust to always get newest version
    // The manifest can be used figure out if other files need to be cache busted
    axios.get('../../data/manifest.json?ver=' + new Date().toISOString())
    .then(function (manifestResponse) {
      const manifest = manifestResponse.data
      const manifestDate = manifest.exportDate
      // Use Axios to download all needed metadata files from the server
      // Define functions for all metadata files to be downloaded
      function getQuestions () { return axios.get('../../data/questions.json?ver=' + manifestDate) }
      function getSettings () { return axios.get('../../data/settings.json?ver=' + manifestDate) }
      function getUsertexts () { return axios.get('../../data/usertexts.json?ver=' + manifestDate) }
      function getListview () { return axios.get('../../data/listview.json?ver=' + manifestDate) }
      function getRadargraph () { return axios.get('../../data/radargraph.json?ver=' + manifestDate) }

      // Make a batch Axios request to download all metadata and data asynchronously
      axios.all([getQuestions(), getSettings(), getUsertexts(), getListview(), getRadargraph()])
      .then(axios.spread(function (questionsResponse, settingsResponse, usertextsResponse, listviewResponse, radargraphResponse) {
        // Get the downloaded metadata
        const questions = questionsResponse.data
        const settings = settingsResponse.data
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

        // Initialize elements that depend on the metadata
        dax.settings.initializeResources(settings)
        dax.text.initializeResources(usertexts)
        dax.description.initializeHelpers(meanReferenceMap, shorttextMap, descriptionMap, directionMap, null)

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function (e) {
            populateUserProfileDOM(listview, meanReferenceMap, shorttextMap, descriptionMap, directionMap, titleRegexpMap)
            populateRadarDOM(radargraphData, questions, [])
          })
        } else {
          populateUserProfileDOM(listview, meanReferenceMap, shorttextMap, descriptionMap, directionMap, titleRegexpMap)
          populateRadarDOM(radargraphData, questions, listview)
        }

        dax.userprofile.addGridUpdateCallback(function (names, means) {
          let maxReferenceDiff = dax.settings('listview.max_reference_diff')
          // Calculate max mean-to-value difference to get the radar +/- interval
          for (let i = 0; i < means.length; i++) {
            const reference = meanReferenceMap[listview[i]]
            for (let j = 0; j < means[i].length; j++) {
              if (Number.isNaN(means[i][j])) { continue }
              const diff = Math.abs(means[i][j] - reference)
              maxReferenceDiff = Math.max(diff, maxReferenceDiff)
            }
          }
          // dax.radargraph.setDomainRange(maxReferenceDiff)
          dax.radargraph.setChartData(names, means, maxReferenceDiff)
        })

        // Send height changes to parent window, so it can update iframe size
        if (window.ResizeObserver) {
          const outerElement = document.querySelector('.userprofile-wrapper')
          const resizeObserver = new ResizeObserver(function (entries) {
            for (let i = 0; i < entries.length; i++) {
              if (entries[i].target === outerElement) {
                if (entries[i].contentRect.height > maxHeight) {
                  maxHeight = entries[i].contentRect.height
                  parent.postMessage({ source: 'DAXPLORE_USERPROFILE', height: maxHeight }, '*')
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
    })
  }

  exports.headerChange =
  function (select, animateUpdate) {
    dax.profile.setPerspectiveOption(select.value)
    dax.radargraph.setPerspectiveOption(select.value)
  }
})(window.dax = window.dax || {})
