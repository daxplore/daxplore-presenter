(function (namespace) {
  namespace.radargraph = namespace.radargraph || {}
  const exports = namespace.radargraph

  function populateRadarDOM (radargraphData, questions, qIDs, perspectiveOptions, means) {
    d3.select('.radargraph-save-image')
      .text(dax.text('common.button.save_chart_as_image'))
    d3.select('.radarchart-save-image')
      .text(dax.text('common.button.save_chart_as_image'))
    dax.radargraph.initializeRadarGraph(radargraphData, questions, qIDs)
    dax.radargraph.setChartData(perspectiveOptions, means)
  }

  function initializeHeaderSelect (perspectiveOptions) {
    const headerSelect = d3.select('.header-select')
    const options = headerSelect.selectAll('option')
      .data(perspectiveOptions, function (d) { return d })

    options.exit().remove()

    options.enter()
      .append('option')
        .text(function (d) { return d })
        .attr('value', function (d, i) { return i })
  }

  function updateHeaderSelectPosition (animate) {
    const headerSelectDiv = d3.select('.header-select-div')

    const radarSvgBounds = d3.select('#radar-graph').node().getBoundingClientRect()
    const selectWidth = d3.select('.header-select').node().getBoundingClientRect().width

    headerSelectDiv.interrupt()

    conditionalTransition(headerSelectDiv, animate)
      .style('margin-left', radarSvgBounds.x + radarSvgBounds.width / 2 - selectWidth / 2 + 'px')
  }

  // Helper
  function conditionalTransition (selection, applyTransition) {
    if (applyTransition) {
      const t = d3.transition().duration(300).ease(d3.easeLinear)
      return selection.transition(t)
    }
    return selection
  }

  exports.initialize =
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
      function getPerspectives () { return axios.get('../../data/perspectives.json?ver=' + manifestDate) }
      function getSettings () { return axios.get('../../data/settings.json?ver=' + manifestDate) }
      function getUsertexts () { return axios.get('../../data/usertexts.json?ver=' + manifestDate) }
      function getListview () { return axios.get('../../data/listview.json?ver=' + manifestDate) }
      function getRadargraph () { return axios.get('../../data/radargraph.json?ver=' + manifestDate) }

      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const perspectiveID = urlParams.get('perspective')
      const timepoint = urlParams.get('timepoint') != null ? urlParams.get('timepoint') : '0'

      // Make a batch Axios request to download all metadata and data asynchronously
      axios.all([getQuestions(), getPerspectives(), getSettings(), getUsertexts(), getListview(), getRadargraph()])
      .then(axios.spread(function (questionsResponse, perspectivesResponse, settingsResponse, usertextsResponse, listviewResponse, radargraphResponse) {
        // Get the downloaded metadata
        const questions = questionsResponse.data
        const perspectives = perspectivesResponse.data
        const settings = settingsResponse.data
        const usertexts = usertextsResponse.data
        const listview = listviewResponse.data
        const radargraphData = radargraphResponse.data

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
          if (perspectiveID === null || typeof perspectiveID === 'undefined' || perspectiveID.length === 0) {
            // TODO find IE11 compatible way to do this
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

        // Initialize elements that depend on the metadata
        dax.settings.initializeResources(settings)
        dax.text.initializeResources(usertexts)
        dax.description.initializeHelpers(meanReferenceMap, shorttextMap, descriptionMap, directionMap, null)
        initializeHeaderSelect(perspectiveOptions)

        // Get the data used in the listview
        function getQuestionData (questionID) { return axios.get('../../data/questions/' + questionID + '.json?ver=' + manifestDate) }
        const variableRequests = listview.map(function (qID) { return getQuestionData(qID) })
        axios.all(variableRequests).then(function (responsesArray) {
          const qIDs = []
          const means = []
          const meanAllMap = {}
          responsesArray.forEach(function (response) {
            for (let i = 0; i < response.data.length; i++) {
              const d = response.data[i]
              if (d.p.length === 1 && d.p[0] === perspectiveID) {
                const qID = d.q
                meanAllMap[qID] = d.mean[timepoint].mean
                qIDs.push(qID)
                means.push(d.mean[timepoint].mean)
                break
              }
            }
          })

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function (e) {
              populateRadarDOM(radargraphData, questions, qIDs, perspectiveOptions, means)
              updateHeaderSelectPosition(false)
            })
          } else {
            populateRadarDOM(radargraphData, questions, qIDs, perspectiveOptions, means)
            updateHeaderSelectPosition(false)
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
    updateHeaderSelectPosition(true)
    dax.radargraph.setPerspectiveOption(Number(select.value))
  }
})(window.dax = window.dax || {})
