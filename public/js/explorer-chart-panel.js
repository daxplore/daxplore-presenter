(function(exports) {

// TODO
  // var question_map = {};
  // for (var i=0; i < questions.length; i ++) {
  //   var q = questions[i];
  //   question_map[q.column] = q;
  // }
  //
  // var initialQuestion = groups[0].questions[0];
  // var selectedTab = question_map[initialQuestion].displaytypes[0];

  var primaryColors, hoverColors;

  exports.generateChartPanel = function(primaryColors_input, hoverColors_input) {
    primaryColors = primaryColors_input;
    hoverColors = hoverColors_input;

    d3.select('.daxplore-ChartPanel').html(
      "<div class='daxplore-ExternalHeader'>" +
      "  <div class='daxplore-ExternalHeader-header'></div>" +
      "  <div class='daxplore-ExternalHeader-sub'></div>" +
      "  <div class='daxplore-ExternalHeader-dichsub'></div>" +
      "  <div class='daxplore-ExternalHeader-freq-tooltip'></div>" +
      "</div>" +
      "<div class='chart-tabs'>" +
      "  <div class='chart-tab-spacing frequency'></div>" +
      "  <div class='chart-tab frequency chart-tab-selected'>Frekvenser</div>" +
      "  <div class='chart-tab-spacing mean'></div>" +
      "  <div class='chart-tab mean'>Genomsnitt</div>" +
      "  <div class='chart-tab-spacing dichotomized'></div>" +
      "  <div class='chart-tab dichotomized'>Dikotomiserat</div>" +
      "  <div class='chart-tab-spacing mean'></div>" +
      "  <div class='chart-tab mean'>Genomsnitt</div>" +
      "  <div class='chart-tab-remainder'></div>" +
      "</div>" +
      "<div class='chart-panel'></div>"
    );

    var displaytypes = question_map[initialQuestion].displaytypes;
    d3.selectAll('.chart-tab')
      .on("click",
        function() {
          var classes = this.classList;
          for (var i=0; i<classes.length; i++) {
            if (classes[i] === "frequency" ||  classes[i] === "mean" || classes[i] === "dichotomized" || classes[i] === "mean") {
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
    if (questionMeta.short != questionMeta.text) {
      d3.select('.daxplore-ExternalHeader-sub').text(questionMeta.text);
    }
    d3.select('.daxplore-ExternalHeader-dichsub').text(dichSubtitle);
    d3.select('.daxplore-ExternalHeader-freq-tooltip').text("");

    // reset any side scroll set by previous charts
    d3.select('.chart-panel')
      .classed('chart-scroll', false)
      .style('width', null);


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
            case "TIMEPOINTS_TWO":
            case "TIMEPOINTS_ALL":
              // TODO temporary hardcoded timepoint
              generateFrequencyChart(primaryColors, hoverColors, stat, selected_options, 4);
              generateFrequencyLegend();
              break;
          }
          break;
        case "MEAN":
          switch (timepoints) {
            case "TIMEPOINTS_ONE":
              generateMeanChart(selected_options, stat);
              generateMeanLegend();
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
              generateDichTimeLineChart(selected_options, stat, primaryColors, hoverColors);
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
        updateFreqChartSize(350);
        break;
      case "MEAN":
        updateMeanChartSize(350); // TODO allow more height instead of vertical scroll
        break;
      case "DICHOTOMIZED":
        updateDichTimeLineChartSize(350);
        break;
    }
  }

})(window);
