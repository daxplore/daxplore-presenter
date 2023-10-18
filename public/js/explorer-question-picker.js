(function (namespace) {
  namespace.explorer = namespace.explorer || {}
  const exports = namespace.explorer

  // TODO unused: let initialized = false
  let openGroup = -1

  const elementTransition = d3.transition()
    .duration(100)
    .ease(d3.easeLinear)

  let questions, groups
  const questionIDs = new Set()
  const shorttextMap = []
  const groupMap = []
  let selectedQuestion

  exports.generateQuestionPicker =
  function (questionsInput, groupsInput) {
    questions = questionsInput
    groups = groupsInput

    selectedQuestion = groups[0].questions[0]
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      questionIDs.add(q.column)
      shorttextMap[q.column] = q.short
    }

    for (let i = 0; i < groups.length; i++) {
      const gqs = groups[i].questions
      for (let q = 0; q < gqs.length; q++) {
        groupMap[gqs[q]] = i
      }
    }

    d3.select('.question-header').text(dax.text('explorer.question_picker.section_header'))

    const sections = d3.select('.question-picker')
      .selectAll('.question-section')
      .classed('no-select', true)
      .data(groups)
      .enter()
        .append('div')
          .classed('question-section', true)
          .attr('class', function (d) { return 'question-section-' + d.type })

    const headers = sections.append('div')
      .classed('question-section-header', true)
      .on('click', function (d, i) {
        if (openGroup === i) {
          openGroup = -1
        } else {
          openGroup = i
        }
        updateTree(true)
      })

    headers.append('div')
      .classed('question-section-header-text', true)
      .text(function (d) { return d.name })

    // TODO unused: let headerArrows =
    headers.append('div')
      .classed('question-group-arrow-wrapper', true)
      .append('div')
      .classed('question-group-arrow', true)

    const sectionQuestions = sections.append('div')
      .classed('question-section-questions', true)
      .style('height', '0px')

    const sectionQuestionsInput = sectionQuestions.append('div')
      .classed('question-section-questions-inner', true)

    sectionQuestionsInput.selectAll('.question-question')
      .data(function (d) { return d.questions })
      .enter()
        .append('div')
        .classed('question-question', true)
        .text(function (d) { return shorttextMap[d] })
        .on('click', function (d) {
          selectedQuestion = d
          updateTree(true)
          dax.explorer.selectionUpdateCallback(true)
        })

    openGroup = groupMap[selectedQuestion]
    updateTree(false)

    // hack to force initial sizing to work
    // TODO timeout hack, handle in different way
    for (let i = 2; i <= 12; i++) {
      setTimeout(function () { updateTree(false) }, Math.pow(2, i))
    }
  }

  // TODO unused?
  exports.getSelectedQuestion =
  function () {
    return selectedQuestion
  }

  exports.questionSetQueryDefinition =
  function (questionID) {
    // When questionID is null, reset the question picker to the default state
    if (questionID === null) {
      questionID = groups[0].questions[0]
    } else if (!questionIDs.has(questionID)) {
      return // TODO log error?
    }
    selectedQuestion = questionID
    openGroup = groupMap[selectedQuestion]
    updateTree(true)
  }

  function updateTree (animate) {
    // EXPAND/CONTRACT SECTIONS
    const sections = d3.selectAll('.question-section-questions')
    sections.interrupt().selectAll('*').interrupt()
    conditionalApplyTransition(sections, elementTransition, animate)
      .style('height', function (d, i) {
        if (i === openGroup) {
          return d3.select(this).select('.question-section-questions-inner').node().offsetHeight + 'px'
        }
        return '0px'
      })

    // OUTLINE SELECTED SECTION
    d3.selectAll('.question-section-GROUP')
      .classed('above-selected', function (d, i) { return i === openGroup - 1 })
      .classed('selected', function (d, i) { return i === openGroup })

    d3.select('.question-picker')
      .classed('above-selected', openGroup === 0)

    // TURN ARROWS
    const arrows = d3.selectAll('.question-group-arrow')
    arrows.interrupt().selectAll('*').interrupt()
    conditionalApplyTransition(arrows, elementTransition, animate)
      .style('transform', function (d, i) {
        if (i === openGroup) {
          return 'rotate(0.25turn)'
        }
        return 'rotate(0turn)'
      })

    // SELECT QUESTION
    d3.selectAll('.question-question')
      .classed('selected', function (d) {
        return d === selectedQuestion
      })
  }

  // Helper
  function conditionalApplyTransition (selection, transition, useTransition) {
    return useTransition ? selection.transition(transition) : selection
  }
})(window.dax = window.dax || {})
