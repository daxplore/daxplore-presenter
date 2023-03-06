(function (namespace) {
  namespace.index = namespace.index || {}
  const exports = namespace.index

  function populateIndexDOM (manifest, perspectiveIDs) {
    // d3.select('.profile-save-image')
    //   .text(dax.text('common.button.save_chart_as_image'))
    console.log(manifest)

    const languageNames = new Intl.DisplayNames(['en'], { type: 'language' })

    d3.select('#manifest-project')
      .text(manifest.projectName)

    const date = new Date(manifest.exportDate)
    d3.select('#manifest-export-date')
      .text(manifest.exportDate.split('T')[0] + ' ' + date.getHours() + ':' + date.getMinutes())

    d3.select('#manifest-locales')
      .text(
        manifest.locales.map(
          function (l) { return languageNames.of(l) + ' (' + l + ')' }
        ).join(', ')
      )

    const match = dax.common.hasMatchingDataFileVersions(manifest.dataPackageVersion)
      ? ' (👍 correct version)'
      : ' (❌ Incorrect version! Daxplore Presenter website data version is ' + dax.common.getSystemDataVersion() + '.)'

    d3.select('#manifest-package-version')
      .text(manifest.dataPackageVersion + match)

    // Populate profile chart links
    let linkDiv = d3.select('.profile-links')
    let links = linkDiv.selectAll('a')
      .data(perspectiveIDs, function (d) { return d })

    links.enter()
      .append('a')
      .attr('href', function (d) { return 'profile.html?perspective=' + d })
      .text(function (d) { return 'profile.html?perspective=' + d })

    // Populate radargraph chart links
    linkDiv = d3.select('.radargraph-links')
    links = linkDiv.selectAll('a')
      .data(perspectiveIDs, function (d) { return d })

    links.enter()
      .append('a')
      .attr('href', function (d) { return 'experimental/copsoq/radargraph.html?perspective=' + d })
      .text(function (d) { return 'experimental/copsoq/radargraph.html?perspective=' + d })

    // Populate profile-radargraph chart links
    linkDiv = d3.select('.profile-radargraph-links')
    links = linkDiv.selectAll('a')
      .data(perspectiveIDs, function (d) { return d })

    links.enter()
      .append('a')
      .attr('href', function (d) { return 'experimental/copsoq/profile-radargraph.html?perspective=' + d })
      .text(function (d) { return 'experimental/copsoq/profile-radargraph.html?perspective=' + d })
  }

  exports.initializeIndex =
    function () {
      // Download the manifest first, cache bust to always get newest version
      // The manifest can be used figure out if other files need to be cache busted
      axios.get('../../data/manifest.json?ver=' + new Date().toISOString())
        .then(function (manifestResponse) {
          const manifest = manifestResponse.data
          const manifestDate = manifest.exportDate
          // console.log(manifest)
          // Use Axios to download all needed metadata files from the server
          // Define functions for all metadata files to be downloaded
          function getPerspectives () { return axios.get('../../data/perspectives.json?ver=' + manifestDate) }
          function getQuestions () { return axios.get('../../data/questions.json?ver=' + manifestDate) }
          function getSettings () { return axios.get('../../data/settings.json?ver=' + manifestDate) }
          function getUsertexts () { return axios.get('../../data/usertexts.json?ver=' + manifestDate) }

          // Make a batch Axios request to download all metadata and data asynchronously
          axios.all([getPerspectives(), getQuestions(), getSettings(), getUsertexts()])
          .then(axios.spread(function (perspectivesResponse, questionsResponse, settingsResponse, usertextsResponse) {
            // Get the downloaded metadata
            const perspectives = perspectivesResponse.data
            const questions = questionsResponse.data
            const settings = settingsResponse.data
            const usertexts = usertextsResponse.data

            // The function logs the error as a side effect,
            // so if the versions don't match all we have to do here is exit
            // TODO communicate the error directly in the DOM?
            if (!dax.common.hasMatchingDataFileVersions(manifest.dataPackageVersion)) {
              return
            }

            // Initialize elements that depend on the metadata
            dax.settings.initializeResources(settings)
            dax.text.initializeResources(usertexts)

            const typeMap = {}
            for (let i = 0; i < questions.length; i++) {
              const q = questions[i]
              typeMap[q.column] = q.type
            }

            const perspectiveIDs = perspectives
              .map(function (persp) { return persp.q })
              .filter(function (persp) { return typeMap[persp] !== 'COMBINED_PERSPECTIVE' })

            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function (e) {
                populateIndexDOM(manifest, perspectiveIDs)
              })
            } else {
              populateIndexDOM(manifest, perspectiveIDs)
            }
          })).catch(function (error) {
            console.error(error)
          })
        }).catch(function (error) {
          console.error(error)
        })
    }
})(window.dax = window.dax || {})
