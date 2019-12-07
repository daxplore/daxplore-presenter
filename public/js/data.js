(function (namespace) {
  namespace.data = namespace.data || {}
  const exports = namespace.data

  let questionData, questionMeta

  // Returns an object with values for mean (the mean value) and count (the number of respondents)
  exports.getMean = function (questionID, perspectiveID, perspectiveOptionIndex, timepoint) {
    timepoint = typeof timepoint !== 'undefined' ? timepoint : questionMeta[questionID].timepoints[0] // default to first defined timepoint
    const stat = questionData[questionID][perspectiveID].mean[timepoint]
    if (perspectiveOptionIndex === 'ALl_RESPONDENTS') {
      return { mean: stat.all, count: stat.allcount }
    }
    return { mean: stat.mean[perspectiveOptionIndex], count: stat.count[perspectiveOptionIndex] }
  }

  // Returns an array with the number of respondents for each question option
  exports.getFrequency = function (questionID, perspectiveID, perspectiveOptionIndex, timepoint) {
    timepoint = typeof timepoint !== 'undefined' ? timepoint : questionMeta[questionID].timepoints[0] // default to first defined timepoint
    const stat = questionData[questionID][perspectiveID].freq[timepoint]
    if (perspectiveOptionIndex === 'ALl_RESPONDENTS') {
      return stat.all
    }
    return stat[perspectiveOptionIndex]
  }

  exports.initializeResources = function (questionMetaInput, questionDataInput) {
    questionMeta = questionMetaInput
    questionData = questionDataInput
  }
})(window.dax = window.dax || {})
