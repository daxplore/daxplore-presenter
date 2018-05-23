(function(exports) {

  var question_map = {};
  for (var i=0; i < questions.length; i ++) {
    var q = questions[i];
    question_map[q.column] = q;
  }

  var initialQuestion = groups[0].questions[0];
  var selectedTab = question_map[initialQuestion].displaytypes[0];

  var dich_lineColors, dich_hoverColors;

  exports.generateChartPanel = function(dich_lineColors_input, dich_hoverColors_input) {
    dich_lineColors = dich_lineColors_input;
    dich_hoverColors = dich_hoverColors_input;

    d3.select('.daxplore-ChartPanel').html(
      "<div class='daxplore-ExternalHeader'>" +
      "  <div class='daxplore-ExternalHeader-header'>Top header</div>" +
      "  <div class='daxplore-ExternalHeader-sub'>Middle header</div>" +
      "  <div class='daxplore-ExternalHeader-dichsub'>Bottom header</div>" +
      "</div>" +
      "<div class='chart-tabs'>" +
      "  <div class='chart-tab-spacing frequency'></div>" +
      "  <div class='chart-tab frequency chart-tab-selected'>Frekvenser</div>" +
      "  <div class='chart-tab-spacing mean'></div>" +
      "  <div class='chart-tab mean'>Genomsnitt</div>" +
      "  <div class='chart-tab-spacing dichotomized'></div>" +
      "  <div class='chart-tab dichotomized'>Dikotomiserat</div>" +
      "  <div class='chart-tab-remainder'></div>" +
      "</div>" +
      "<div class='chart-panel'></div>"
    );

    var displaytypes = question_map[initialQuestion].displaytypes;
    console.log(displaytypes);
    console.log(d3.selectAll('.chart-tab'));
    d3.selectAll('.chart-tab')
      .on("click",
        function() {
          var classes = this.classList;
          for (var i=0; i<classes.length; i++) {
            if (classes[i] === "frequency" ||  classes[i] === "mean" || classes[i] === "dichotomized") {
              setSelectedTab(classes[i].toUpperCase());
            }
          }
      });

      d3.selectAll('.chart-tab, .chart-tab-spacing')
        .style('display', function(d, i, tabs) {
          if (displaytypes.length <= 1) {
            return 'none';
          }
          for (var j=0; j<displaytypes.length; j++) {
            if (tabs[i].classList.contains(displaytypes[j].toLowerCase())) {
              return 'block';
            }
          }
          return 'none';
        });
  }

  exports.getSelectedTab = function() {
    return selectedTab;
  }

  exports.chartSetQueryDefinition = function(charttype, timepoints, stat, selected_options, dichSubtitle) {
    selectedTab = charttype;
    var questionID = stat['q'];
    var perspectiveID = stat['p'];

    questionMeta = question_map[questionID];
    d3.select('.daxplore-ExternalHeader-header').text(questionMeta.short);
    d3.select('.daxplore-ExternalHeader-sub').text(questionMeta.text);
    d3.select('.daxplore-ExternalHeader-dichsub').text(dichSubtitle);

    var displaytypes = question_map[questionID].displaytypes;
    d3.selectAll('.chart-tab')
      .classed('chart-tab-selected', function(d, i, tabs) { return tabs[i].classList.contains(selectedTab.toLowerCase()) });

    d3.selectAll('.chart-tab, .chart-tab-spacing')
      .style('display', function(d, i, tabs) {
        if (displaytypes.length <= 1) {
          return 'none';
        }
        for (var j=0; j<displaytypes.length; j++) {
          if (tabs[i].classList.contains(displaytypes[j].toLowerCase())) {
            return 'block';
          }
        }
        return 'none';
      });

      // TODO allow for animated updates of same chart type
      d3.select('.chart-panel')
        .selectAll(function(){return this.childNodes})
        .remove();

      // Select chart to displaytypes
      switch (selectedTab) {
        case "FREQUENCY":
          switch (timepoints) {
            case "TIMEPOINTS_ONE":
              break;
            case "TIMEPOINTS_TWO":
              break;
            case "TIMEPOINTS_ALL":
              break;
          }
          break;
        case "MEAN":
          switch (timepoints) {
            case "TIMEPOINTS_ONE":
              break;
            case "TIMEPOINTS_TWO":
              break;
            case "TIMEPOINTS_ALL":
              break;
          }
          break;
        case "DICHOTOMIZED":
          switch (timepoints) {
            case "TIMEPOINTS_ONE":
            case "TIMEPOINTS_TWO":
            case "TIMEPOINTS_ALL":
              generateDichTimeLineChart(selected_options, stat, dich_lineColors, dich_hoverColors);
              generateDichTimeLineLegend();
              break;
          }
          break;
      }
      updateChartPanelSize();
  }

  function setSelectedTab(tab) {
    if (selectedTab === tab)  {
      return;
    }
    selectedTab = tab;
    gwtChartPanelCallback(tab);
  }

  exports.updateChartPanelSize = function() {
    switch (selectedTab) {
      case "FREQUENCY":
        break;
      case "MEAN":
        break;
      case "DICHOTOMIZED":
        updateDichTimeLineChartSize(350);
        break;
    }
  }

})(window);
