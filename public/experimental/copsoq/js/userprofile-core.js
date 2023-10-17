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

      // Make a batch Axios request to download all metadata and data asynchronously
      axios.all([getQuestions(), getSettings(), getUsertexts(), getListview()])
      .then(axios.spread(function (questionsResponse, settingsResponse, usertextsResponse, listviewResponse) {
        // Get the downloaded metadata
        const questions = questionsResponse.data
        // const settings = settingsResponse.data
        const usertexts = usertextsResponse.data
        const listview = listviewResponse.data

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
        dax.description.initializeHelpers(meanReferenceMap, shorttextMap, descriptionMap, directionMap, null)

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function (e) {
            populateUserProfileDOM(listview, meanReferenceMap, shorttextMap, descriptionMap, directionMap, titleRegexpMap)
          })
        } else {
          populateUserProfileDOM(listview, meanReferenceMap, shorttextMap, descriptionMap, directionMap, titleRegexpMap)
        }

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
  }
})(window.dax = window.dax || {})
