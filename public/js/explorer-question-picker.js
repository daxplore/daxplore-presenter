(function (namespace) {
  namespace.explorer = namespace.explorer || {}
  const exports = namespace.explorer

  // TODO unused: var initialized = false
  var openGroup = -1

  var elementTransition = d3.transition()
    .duration(100)
    .ease(d3.easeLinear)

  var questions, groups
  const questionIDs = new Set()
  var shorttextMap = []
  var groupMap = []
  var selectedQuestion

  exports.generateQuestionPicker = function (questionsInput, groupsInput) {
    questions = questionsInput
    groups = groupsInput

    selectedQuestion = groups[0].questions[0]
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i]
      questionIDs.add(q.column)
      shorttextMap[q.column] = q.short
    }

    for (i = 0; i < groups.length; i++) {
      var gqs = groups[i].questions
      for (q = 0; q < gqs.length; q++) {
        groupMap[gqs[q]] = i
      }
    }

    d3.select('.question-header').text(dax.text('questionsHeader')) // TODO use new text ID style

    var sections = d3.select('.question-picker')
      .selectAll('.question-section')
      .classed('no-select', true)
      .data(groups)
      .enter()
        .append('div')
          .classed('question-section', true)
          .attr('class', function (d) { return 'question-section-' + d.type })

    var headers = sections.append('div')
      .classed('question-section-header', true)
      .on('click', function (d, i) {
        if (openGroup === i) {
          openGroup = -1
        } else {
          openGroup = i
        }
        updateTree()
      })

    headers.append('div')
      .classed('question-section-header-text', true)
      .text(function (d) { return d.name })

    // TODO unused: var headerArrows =
    headers.append('div')
      .classed('question-group-arrow-wrapper', true)
      .append('div')
      .classed('question-group-arrow', true)

    var sectionQuestions = sections.append('div')
      .classed('question-section-questions', true)
      .style('height', '0px')

    var sectionQuestionsInput = sectionQuestions.append('div')
      .classed('question-section-questions-inner', true)

    sectionQuestionsInput.selectAll('.question-question')
      .data(function (d) { return d.questions })
      .enter()
        .append('div')
        .classed('question-question', true)
        .text(function (d) { return shorttextMap[d] })
        .on('click', function (d) {
          // var changed = selectedQuestion !== d
          // if (changed) {
          selectedQuestion = d
          updateTree()
          // TODO replace with callback to js page handler
          // gwtQuestionCallback()
          // }
          dax.explorer.selectionUpdateCallback()
        })

    openGroup = groupMap[selectedQuestion]
    updateTree()

    // hack to force initial sizing to work
    // TODO handle in different way
    for (i = 2; i <= 12; i++) {
      setTimeout(updateTree, Math.pow(2, i))
    }
  }

  // TODO unused?
  exports.getSelectedQuestion = function () {
    return selectedQuestion
  }

  exports.questionSetQueryDefinition = function (questionID) {
    if (!questionIDs.has(questionID)) { return } // TODO log error?
    selectedQuestion = questionID
    openGroup = groupMap[selectedQuestion]
    updateTree()
  }

  function updateTree () {
    // EXPAND/CONTRACT SECTIONS
    var sections = d3.selectAll('.question-section-questions')
    sections.interrupt().selectAll('*').interrupt()
    sections
      .transition(elementTransition)
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
    var arrows = d3.selectAll('.question-group-arrow')
    arrows.interrupt().selectAll('*').interrupt()
    arrows
      .transition(elementTransition)
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
})(window.dax = window.dax || {})
