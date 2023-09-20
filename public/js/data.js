(function (namespace) {
  namespace.data = namespace.data || {}
  const exports = namespace.data

  let perspectives, questionData, questionMeta
  // let groups

  // DATA
  // Returns an object with values for mean (the mean value) and count (the number of respondents)
  exports.getMean =
  function (questionID, perspectives, combinedPerspectiveOptionIndex, timepoint) {
    timepoint = typeof timepoint !== 'undefined' ? timepoint : questionMeta[questionID].timepoints[0] // default to first defined timepoint
    let dataItem, dataIndex
    if (perspectives.length === 1) {
      const perspective1Option = getQuestionOptionDefinition(perspectives[0], combinedPerspectiveOptionIndex)
      dataItem = questionData[questionID][perspective1Option.dataQuestion]
      dataIndex = perspective1Option.dataOption
    } else {
      const p1OptionCount = exports.getQuestionOptionCount(perspectives[0])
      const p2OptionCount = exports.getQuestionOptionCount(perspectives[1])
      const p1Index = Math.floor(combinedPerspectiveOptionIndex / p2OptionCount)
      const p2Index = combinedPerspectiveOptionIndex % p2OptionCount
      const perspective1Option = getQuestionOptionDefinition(perspectives[0], p1Index)
      const perspective2Option = getQuestionOptionDefinition(perspectives[1], p2Index)
      const dataPerspectives = [perspective1Option.dataQuestion, perspective2Option.dataQuestion]
      dataItem = questionData[questionID][dataPerspectives]
      if (typeof dataItem !== 'undefined') {
        dataIndex = perspective1Option.dataOption * p2OptionCount + perspective2Option.dataOption
      } else {
        // Perspective combination missing, assume the reverse perspective order exists in the data file
        dataPerspectives.reverse()
        dataItem = questionData[questionID][dataPerspectives]
        dataIndex = perspective2Option.dataOption * p1OptionCount + perspective1Option.dataOption
      }
    }
    const stat = dataItem.mean[timepoint]
    if (combinedPerspectiveOptionIndex === 'ALL_RESPONDENTS') {
      return { mean: stat.all, count: stat.allcount }
    }
    return { mean: stat.mean[dataIndex], count: stat.count[dataIndex] }
  }

  // Returns an array with the number of respondents for each question option
  exports.getFrequency =
  function (questionID, perspectiveID, perspectiveOptionIndex, timepoint) {
    const perspectiveOption = getQuestionOptionDefinition(perspectiveID, perspectiveOptionIndex)
    timepoint = typeof timepoint !== 'undefined' ? timepoint : questionMeta[questionID].timepoints[0] // default to first defined timepoint
    const stat = questionData[questionID][perspectiveOption.dataQuestion].freq[timepoint]
    if (perspectiveOptionIndex === 'ALL_RESPONDENTS') {
      return stat.all
    }
    return stat[perspectiveOption.dataOption]
  }

  // META

  exports.getQuestionShortText =
  function (questionID) {
    if (Array.isArray(questionID)) {
      return questionID.map(function (subQuestionID) {
        return exports.getQuestionShortText(subQuestionID)
      }).join(', ')
    }
    return questionMeta[questionID].short.trim()
  }

  exports.getQuestionFullText =
  function (questionID) {
    return questionMeta[questionID].text.trim()
  }

  exports.isCombinedPerspective =
  function (questionID) {
    return questionMeta[questionID].type === 'COMBINED_PERSPECTIVE'
  }

  exports.getQuestionDescription =
  function (questionID) {
    return questionMeta[questionID].description
  }

  exports.hasPerspectiveOptionChildren =
  function (questionID, optionIndex) {
    return questionMeta[questionID].type === 'COMBINED_PERSPECTIVE' &&
    typeof questionMeta[questionID].optionsFlat[optionIndex].opts !== 'undefined' &&
    questionMeta[questionID].optionsFlat[optionIndex].opts.length > 0
  }

  exports.getPerspectiveOptionChildCount =
  function (questionID, optionIndex) {
    if (!dax.data.hasPerspectiveOptionChildren(questionID, optionIndex)) {
      return 0
    }
    return questionMeta[questionID].optionsFlat[optionIndex].opts.length
  }

  function getQuestionOptionDefinition (questionID, optionIndex) {
    if (dax.data.isCombinedPerspective(questionID)) {
      return questionMeta[questionID].optionsFlat[optionIndex]
    }
    return questionMeta[questionID].options[optionIndex]
  }

  exports.getQuestionOptionCount =
  function (questionID) {
    if (!questionMeta[questionID].options) {
      return 0
    }
    if (dax.data.isCombinedPerspective(questionID)) {
      return questionMeta[questionID].optionsFlat.length
    }
    return questionMeta[questionID].options.length
  }

  exports.getOptionTexts =
  function (questionID) {
    return dax.data.getPerspectiveOptionIndicesColumnOrder(questionID).map(function (i) {
      return dax.data.getQuestionOptionText(questionID, i)
    })
  }

  exports.getTimepoints =
  function (questionID) {
    return questionMeta[questionID].timepoints
  }

  exports.getTopLevelQuestionOptionCount =
  function (questionID) {
    if (!dax.data.isCombinedPerspective(questionID)) {
      return exports.getQuestionOptionCount(questionID)
    }
    return questionMeta[questionID].options.length
  }

  exports.getQuestionOptionText =
  function (questionID, optionIndex) {
    if (dax.data.isCombinedPerspective(questionID)) {
      return questionMeta[questionID].optionsFlat[optionIndex].text
    }
    return questionMeta[questionID].options[optionIndex].text
  }

  exports.getPerspectivesOptionTexts =
  function (perspectives, optionIndex) {
    switch (perspectives.length) {
    case 1:
      return [exports.getQuestionOptionText(perspectives[0], optionIndex)]
    case 2: {
      const p2OptionCount = exports.getQuestionOptionCount(perspectives[1])
      const p1Index = Math.floor(optionIndex / p2OptionCount)
      const p2Index = optionIndex % p2OptionCount
      return [
        exports.getQuestionOptionText(perspectives[0], p1Index),
        exports.getQuestionOptionText(perspectives[1], p2Index),
      ]
    }
    }
    throw Error('Invalid perspecvies array', perspectives)
  }

  exports.getExplorerPrimaryPerspectiveIDs =
  function () {
    const perspectiveIDs = []
    for (let i = 0; i < perspectives.length; i++) {
      if (perspectives[i].explorerPerspective) {
        perspectiveIDs.push(perspectives[i].q)
      }
    }
    return perspectiveIDs
  }

  exports.isExplorerPrimaryPerspective =
  function (perspectiveID) {
    for (let i = 0; i < perspectives.length; i++) {
      if (perspectives[i].q === perspectiveID) {
        return perspectives[i].explorerPerspective
      }
    }
    return false
  }

  exports.getExplorerSecondaryPerspectiveIDs =
  function () {
    const perspectiveIDs = []
    for (let i = 0; i < perspectives.length; i++) {
      if (perspectives[i].secondary) {
        perspectiveIDs.push(perspectives[i].q)
      }
    }
    return perspectiveIDs
  }

  exports.isExplorerSecondaryPerspective =
  function (perspectiveID) {
    for (let i = 0; i < perspectives.length; i++) {
      if (perspectives[i].q === perspectiveID) {
        return perspectives[i].secondary
      }
    }
    return false
  }

  exports.getPerspectiveOptionIndicesColumnOrder =
  function (questionID) {
    const optionCount = dax.data.getQuestionOptionCount(questionID)
    return Array.apply(null, Array(optionCount)).map(function (_, i) { return i })
  }

  exports.getPerspectiveOptionIndicesNestedOrder =
  function (questionID) {
    if (!dax.data.isCombinedPerspective(questionID)) {
      return dax.data.getPerspectiveOptionIndicesColumnOrder(questionID)
    }
    const optionTraverser = function (optionList, currentOption) {
      optionList.push(currentOption.index)
      if (currentOption.opts) {
        currentOption.opts.forEach(function (childOption) { return optionTraverser(optionList, childOption) })
      }
      return optionList
    }
    return questionMeta[questionID].options.reduce(optionTraverser, [])
  }

  exports.getPerspectiveOptionParent =
  function (questionID, optionIndex) {
    if (dax.data.isCombinedPerspective(questionID)) {
      return questionMeta[questionID].optionsFlat[optionIndex].parent
    }
    return -1
  }

  exports.getPerspectiveOptionFirstChild =
  function (questionID, optionIndex) {
    if (dax.data.isCombinedPerspective(questionID) && dax.data.hasPerspectiveOptionChildren(questionID, optionIndex)) {
      return questionMeta[questionID].optionsFlat[optionIndex].opts[0].index
    }
    return -1
  }

  exports.useMeanReference =
  function (questionID) {
    return questionMeta[questionID].mean_reference
  }

  exports.getMeanReference =
  function (questionID) {
    return questionMeta[questionID].mean_reference
  }

  exports.getMeanReferenceDirection =
  function (questionID) {
    return questionMeta[questionID].gooddirection
  }

  exports.getDichSelected =
  function (questionID) {
    return questionMeta[questionID].dichselected
  }

  exports.initializeResources =
  function (
    groupsInput,
    perspectivesInput,
    questionMetaInput,
    questionDataInput,
  ) {
    // groups = groupsInput
    perspectives = perspectivesInput
    questionMeta = questionMetaInput
    questionData = questionDataInput

    Object.keys(questionMeta).forEach(function (questionID) {
      const qm = questionMeta[questionID]
      if (qm.type !== 'COMBINED_PERSPECTIVE') {
        const options = []
        qm.options.forEach(function (opt, i) {
          options.push({ text: opt, dataQuestion: qm.column, dataOption: i })
        })
        qm.options = options
      }
    })
    // Add a flattened version of combined perspective option list
    perspectives.forEach(function (perspective) {
      const perspectiveID = perspective.q
      const qm = questionMeta[perspectiveID]
      if (qm.type === 'COMBINED_PERSPECTIVE') {
        let toFlatten = qm.options
        toFlatten.forEach(function (opt) {
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
            current.opts.forEach(function (opt) {
              opt.depth = current.depth + 1
              opt.parent = current.index
              opt.index = index
              index++
            })
            toFlatten = toFlatten.concat(current.opts)
          }
        }
        qm.optionsFlat = optionsFlat
      }
    })
  }

  exports.getPerspectiveOptionTreeDepth =
  function (questionID, perspectiveOptionIndex) {
    const question = questionMeta[questionID]
    if (question.type !== 'COMBINED_PERSPECTIVE') {
      return 0
    }
    return question.optionsFlat[perspectiveOptionIndex].depth
  }

  exports.hasTimepoint =
  function (questionID, timepoint) {
    return questionMeta[questionID].timepoints.indexOf(timepoint) !== -1
  }

  exports.isAllSingleTimepoint =
  function () {
    const keys = Object.keys(questionMeta)
    for (let i = 0; i < keys.length; i++) {
      if (questionMeta[keys[i]].timepoints.length > 1) {
        return false
      }
    }
    return true
  }
})(window.dax = window.dax || {})
