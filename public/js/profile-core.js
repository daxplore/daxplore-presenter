(function (namespace) {
  namespace.profile = namespace.profile || {}
  const exports = namespace.profile

  function populateProfileDOM (perspectiveID, qIDs, meanReferenceMap, shorttextMap, descriptionMap, directionMap, perspectiveOptions, means) {
    d3.select('.profile-save-image')
      .text(dax.text('common.button.save_chart_as_image'))

    dax.profile.generateListChart(qIDs, meanReferenceMap, shorttextMap, directionMap, 0, false)
    dax.profile.setChartData(perspectiveOptions, means)
  }

  exports.initializeProfile =
  function () {
    // Download the manifest first, cache bust to always get newest version
    // The manifest can be used figure out if other files need to be cache busted
    axios.get('data/manifest.json?ver=' + new Date().toISOString())
    .then(function (manifestResponse) {
      const manifest = manifestResponse.data
      const manifestDate = manifest.exportDate
      // Use Axios to download all needed metadata files from the server
      // Define functions for all metadata files to be downloaded
      function getQuestions () { return axios.get('data/questions.json?ver=' + manifestDate) }
      function getPerspectives () { return axios.get('data/perspectives.json?ver=' + manifestDate) }
      function getSettings () { return axios.get('data/settings.json?ver=' + manifestDate) }
      function getUsertexts () { return axios.get('data/usertexts.json?ver=' + manifestDate) }
      function getListview () { return axios.get('data/listview.json?ver=' + manifestDate) }

      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const perspectiveID = urlParams.get('perspective')
      const timepoint = urlParams.get('timepoint') != null ? urlParams.get('timepoint') : '0'

      // Make a batch Axios request to download all metadata and data asynchronously
      axios.all([getQuestions(), getPerspectives(), getSettings(), getUsertexts(), getListview()])
      .then(axios.spread(function (questionsResponse, perspectivesResponse, settingsResponse, usertextsResponse, listviewResponse) {
        // Get the downloaded metadata
        const questions = questionsResponse.data
        const perspectives = perspectivesResponse.data
        // const settings = settingsResponse.data
        const usertexts = usertextsResponse.data
        const listview = listviewResponse.data

        // Validate the perspective URL parameter
        // In case of problems, give feedback directed at the person setting up the presentation
        let isValidPerspective = false
        for (let i = 0; i < perspectives.length; i++) {
          if (perspectives[i].q === perspectiveID) {
            isValidPerspective = true
            break
          }
        }
        // TODO communicate the error directly in the DOM?
        if (!isValidPerspective) {
          // const location = new URL(window.location.href)
          if (perspectiveID === null || typeof perspectiveID === 'undefined' || perspectiveID.length === 0) {
            // TODO find IE compatible way to do this
            // location.search = 'perspective=' + perspectives[0]
            dax.common.logError('The URL must contain the perspective parameter, for example: ?perspective=' + perspectives[0].q) //, location.href)
          } else {
            dax.common.logError('The used perspective URL paremter is not supported: ?perspective=' + perspectiveID)
          }
          dax.common.logError('Suggested fix: Use one of the perspectives defined in', new URL('data/perspectives.json', window.location.href).href)
          return
        }

        // TODO validate timepoint url parameter

        // The function logs the error as a side effect,
        // so if the versions don't match all we have to do here is exit
        // TODO communicate the error directly in the DOM?
        if (!dax.common.hasMatchingDataFileVersions(manifest.dataPackageVersion)) {
          return
        }

        // TODO do data parsing as a Promise, to prevent blocking of the rest of the data download?
        let perspectiveOptions = []
        const shorttextMap = {}
        const descriptionMap = {}
        const directionMap = {}
        const meanReferenceMap = {}

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i]
          shorttextMap[q.column] = q.short
          descriptionMap[q.column] = unescape(q.description)

          if ('gooddirection' in q) {
            directionMap[q.column] = q.gooddirection
          }

          if (q.column === perspectiveID) {
            perspectiveOptions = q.options
          }

          if (q.use_mean_reference) {
            meanReferenceMap[q.column] = q.mean_reference
          }
        }

        dax.text.initializeResources(usertexts)
        dax.profile.initializeHelpers(meanReferenceMap, shorttextMap, descriptionMap, directionMap)

        // Get the data used in the listview
        function getQuestionData (questionID) { return axios.get('data/questions/' + questionID + '.json?ver=' + manifestDate) }
        const variableRequests = listview.map(function (qID) { return getQuestionData(qID) })
        axios.all(variableRequests).then(function (responsesArray) {
          const qIDs = []
          const means = []
          responsesArray.forEach(function (response) {
            for (let i = 0; i < response.data.length; i++) {
              const d = response.data[i]
              if (d.p.length === 1 && d.p[0] === perspectiveID) {
                const qID = d.q
                qIDs.push(qID)
                means.push(d.mean[timepoint].mean)
                break
              }
            }
          })

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function (e) {
              populateProfileDOM(perspectiveID, qIDs, meanReferenceMap, shorttextMap, descriptionMap, directionMap, perspectiveOptions, means)
            })
          } else {
            populateProfileDOM(perspectiveID, qIDs, meanReferenceMap, shorttextMap, descriptionMap, directionMap, perspectiveOptions, means)
          }
        }).catch(function (error) {
          console.error(error)
        })
      })).catch(function (error) {
        console.error(error)
      })
    })
  }

  exports.headerChange =
  function (select) {
    dax.profile.setPerspectiveOption(select.value)
  }
})(window.dax = window.dax || {})
