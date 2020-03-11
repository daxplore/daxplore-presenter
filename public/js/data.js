(function (namespace) {
  namespace.data = namespace.data || {}
  const exports = namespace.data

  let groups, perspectives, questionData, questionMeta

  // DATA
  // Returns an object with values for mean (the mean value) and count (the number of respondents)
  exports.getMean = function (questionID, perspectiveID, perspectiveOptionIndex, timepoint) {
    const perspectiveOption = getQuestionOptionDefinition(perspectiveID, perspectiveOptionIndex)
    timepoint = typeof timepoint !== 'undefined' ? timepoint : questionMeta[questionID].timepoints[0] // default to first defined timepoint
    const stat = questionData[questionID][perspectiveOption.dataQuestion].mean[timepoint]
    if (perspectiveOptionIndex === 'ALL_RESPONDENTS') {
      return { mean: stat.all, count: stat.allcount }
    }
    return { mean: stat.mean[perspectiveOption.dataOption], count: stat.count[perspectiveOption.dataOption] }
  }

  // Returns an array with the number of respondents for each question option
  exports.getFrequency = function (questionID, perspectiveID, perspectiveOptionIndex, timepoint) {
    timepoint = typeof timepoint !== 'undefined' ? timepoint : questionMeta[questionID].timepoints[0] // default to first defined timepoint
    const stat = questionData[questionID][perspectiveID].freq[timepoint]
    if (perspectiveOptionIndex === 'ALL_RESPONDENTS') {
      return stat.all
    }
    return stat[perspectiveOptionIndex]
  }

  // META

  exports.getQuestionShortText = function (questionID) {
    return questionMeta[questionID].short
  }

  exports.isCombinedPerspective = function (questionID) {
    return questionMeta[questionID].type === 'COMBINED_PERSPECTIVE'
  }

  exports.hasPerspectiveOptionChildren = function (questionID, optionIndex) {
    return questionMeta[questionID].type === 'COMBINED_PERSPECTIVE' &&
    typeof questionMeta[questionID].optionsFlat[optionIndex].opts !== 'undefined' &&
    questionMeta[questionID].optionsFlat[optionIndex].opts.length > 0
  }

  function getQuestionOptionDefinition (questionID, optionIndex) {
    if (dax.data.isCombinedPerspective(questionID)) {
      return questionMeta[questionID].optionsFlat[optionIndex]
    }
    return questionMeta[questionID].options[optionIndex]
  }

  exports.getQuestionOptionCount = function (questionID) {
    if (!questionMeta[questionID].options) {
      return 0
    }
    if (dax.data.isCombinedPerspective(questionID)) {
      return questionMeta[questionID].optionsFlat.length
    }
    return questionMeta[questionID].options.length
  }

  exports.getTopLevelQuestionOptionCount = function (questionID) {
    if (!dax.data.isCombinedPerspective(questionID)) {
      return exports.getQuestionOptionCount(questionID)
    }
    return questionMeta[questionID].options.length
  }

  exports.getQuestionOptionText = function (questionID, optionIndex) {
    if (dax.data.isCombinedPerspective(questionID)) {
      return questionMeta[questionID].optionsFlat[optionIndex].text
    }
    return questionMeta[questionID].options[optionIndex].text
  }

  exports.getPerspectiveOptionParent = function (questionID, optionIndex) {
    if (dax.data.isCombinedPerspective(questionID)) {
      return questionMeta[questionID].optionsFlat[optionIndex].parent
    }
    return -1
  }

  exports.getPerspectiveOptionFirstChild = function (questionID, optionIndex) {
    if (dax.data.isCombinedPerspective(questionID) && dax.data.hasPerspectiveOptionChildren(questionID, optionIndex)) {
      return questionMeta[questionID].optionsFlat[optionIndex].opts[0].index
    }
    return -1
  }

  exports.initializeResources = function (groupsInput, perspectivesInput, questionMetaInput, questionDataInput) {
    groups = groupsInput
    perspectives = perspectivesInput
    questionMeta = questionMetaInput
    questionData = questionDataInput
    //
    Object.keys(questionMeta).forEach(questionID => {
      const qm = questionMeta[questionID]
      if (qm.type !== 'COMBINED_PERSPECTIVE') {
        const options = []
        qm.options.forEach((opt, i) => {
          options.push({ text: opt, dataQuestion: qm.column, dataOption: i })
        })
        qm.options = options
      }
    })
    // Add a flattened version of combined perspective option list
    perspectives.forEach(perspective => {
      const qm = questionMeta[perspective]
      if (qm.type === 'COMBINED_PERSPECTIVE') {
        let toFlatten = qm.options
        toFlatten.forEach(opt => {
          opt.depth = 0
          opt.index = opt.o
        })
        const optionsFlat = []
        let index = toFlatten.length
        while (toFlatten.length > 0) {
          const current = toFlatten[0]
          current.dataQuestion = current.q
          delete current.q
          current.dataOption = current.o
          delete current.o
          current.text = questionMeta[current.dataQuestion].options[current.dataOption].text
          toFlatten = toFlatten.slice(1)
          optionsFlat.push(current)
          if (current.opts) {
            current.opts.forEach(opt => {
              opt.depth = current.depth + 1
              opt.parent = current.index
              opt.index = index
              index++
            })
            toFlatten = [...toFlatten, ...current.opts]
          }
        }
        qm.optionsFlat = optionsFlat
      }
    })
  }

  exports.getPerspectiveOptionTreeDepth = function (questionID, perspectiveOptionIndex) {
    const question = questionMeta[questionID]
    if (question.type !== 'COMBINED_PERSPECTIVE') {
      return 0
    }
    return question.optionsFlat[perspectiveOptionIndex].depth
  }
})(window.dax = window.dax || {})
