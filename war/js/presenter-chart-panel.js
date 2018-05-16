(function(exports) {
  
  var dich_lineColors, dich_hoverColors;
  exports.generateChartPanel = function(dich_lineColors_input, dich_hoverColors_input) {
    dich_lineColors = dich_lineColors_input;
    dich_hoverColors = dich_hoverColors_input;
    
    d3.select('.daxplore-ChartPanel').html(`
      <div class='chart-header-panel'>
        <div class='daxplore-ExternalHeader-header'>Top header</div>
        <div class='daxplore-ExternalHeader-sub'>Middle header</div>
        <div class='daxplore-ExternalHeader-dichsub'>Bottom header</div>
      </div>
      <div class='chart-tabs'>
        <div class='chart-tab-spacing'></div>
        <div class='chart-tab frequency chart-tab-selected'>Frekvenser</div>
        <div class='chart-tab-spacing'></div>
        <div class='chart-tab mean'>Genomsnitt</div>
        <div class='chart-tab-spacing'></div>
        <div class='chart-tab dichotomized'>Dikotomiserat</div>
        <div class='chart-tab-remainder'></div>
      </div>
      <div class='chart-container'>THE CHART</div>
    `
    );   
  };
  
  exports.chartSetQueryDefinition = function(selectedChart, statJson, selected_options) {
    var questionID = statJson.q;
    var perspectiveID = statJson.p;
  }
  
})(window);
