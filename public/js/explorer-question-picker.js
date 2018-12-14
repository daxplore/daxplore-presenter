(function(exports) {

  var initialized = false;
  var open_group = -1;



  var element_transition = d3.transition()
    .duration(100)
    .ease(d3.easeLinear);

  var questions, perspectives, usertexts, settings
  var shorttext_map = [], group_map = []
  var selected_question

  exports.generateQuestionPanel = function(questions_in, groups_in, usertexts_in, settings_in) {
    questions = questions_in
    groups = groups_in
    usertexts = usertexts_in
    settings = settings_in

    var selected_question = groups[0].questions[0];
    for (var i=0; i < questions.length; i++) {
      var q = questions[i];
      shorttext_map[q.column] = q.short;
    }

    for (var i=0; i < groups.length; i++) {
      var gqs = groups[i].questions;
      for (var q=0; q < gqs.length; q++) {
        group_map[gqs[q]] = i;
      }
    }

    d3.select('.question-header').text(usertexts.questionsHeader)

    var sections = d3.select('.question-picker')
      .selectAll('.question-section')
      .classed('no-select', true)
      .data(groups)
      .enter()
        .append('div')
          .classed('question-section', true)
          .attr('class', function (d) { return 'question-section-' + d.type; });

    var headers = sections.append('div')
      .classed('question-section-header', true)
      .on('click', function (d, i) {
        if (open_group == i) {
          open_group = -1;
        } else {
          open_group = i;
        }
        updateTree();
      });

    headers.append('div')
      .classed('question-section-header-text', true)
      .text(function (d) { return d.name; });

    var header_arrows = headers.append('div')
      .classed('question-group-arrow-wrapper', true)
      .append('div')
      .classed('question-group-arrow', true);

    var section_questions = sections.append('div')
      .classed('question-section-questions', true)
      .style('height', '0px');

    var section_questions_inner = section_questions.append('div')
      .classed('question-section-questions-inner', true);

    section_questions_inner.selectAll('.question-question')
      .data(function(d) { return d.questions; } )
      .enter()
        .append('div')
        .classed('question-question', true)
        .text(function(d) { return shorttext_map[d]; })
        .on('click', function (d) {
//          var changed = selected_question != d;
//          if (changed) {
            selected_question = d;
            // TODO replace with callback to js page handler
            //gwtQuestionCallback();
//          }
        });

    open_group = group_map[selected_question];
    updateTree();

    // hack to force initial sizing to work
    for (var i=2; i<=12; i++) {
      setTimeout(updateTree, Math.pow(2, i));
    }
  }

  exports.getSelectedQuestion = function() {
    return selected_question;
  }

  exports.questionSetQueryDefinition = function(questionID) {
    selected_question = questionID;
    open_group = group_map[selected_question];
    updateTree();
  }

  function updateTree() {
    // EXPAND/CONTRACT SECTIONS
    var sections = d3.selectAll('.question-section-questions');
    sections.interrupt().selectAll('*').interrupt();
    sections
      .transition(element_transition)
      .style('height', function (d, i) {
        if (i == open_group) {
          return d3.select(this).select('.question-section-questions-inner').node().offsetHeight + 'px';
        }
        return "0px";
      });


    // OUTLINE SELECTED SECTION
    d3.selectAll('.question-section-GROUP')
      .classed('above-selected', function (d, i) { return i == open_group-1; })
      .classed('selected', function (d, i) { return i == open_group; });

    d3.select('.question-picker')
      .classed('above-selected', open_group == 0);


    // TURN ARROWS
    var arrows = d3.selectAll('.question-group-arrow');
    arrows.interrupt().selectAll('*').interrupt();
    arrows
      .transition(element_transition)
      .style('transform', function (d, i) {
        if (i == open_group) {
          return 'rotate(0.25turn)';
        }
        return 'rotate(0turn)';
      });


    // SELECT QUESTION
    d3.selectAll('.question-question')
      .classed('selected', function (d) { return d == selected_question; });

  }

})(window);
