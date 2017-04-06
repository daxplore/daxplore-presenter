(function(exports) {
  
  var initialized = false;
  var selected_perspective = -1;
  var perspective_options = [];
  var selected_options = [];
  var has_total = false;
  var total_selected = false;
  var has_remainder = false;
  var collapsed = true;
  
  document.addEventListener("DOMContentLoaded", function(e) {
    d3.selectAll('body').append('img')
      .classed('img-preload', true)
      .attr('src', '/img/perspective-checkbox-empty.png');
  });
  
  exports.perspectiveSetQueryDefinition = function(perspectiveID, options, total) {
    selected_perspective = perspectives.indexOf(perspectiveID);
    selected_options = options;
    total_selected = total;
    
    if (initialized) {
      updateCheckboxes(false);
    }
  }

  exports.generatePerspectivePanel = function() {
    var height = 162;
    var dashedBorder = '1px dashed #DDD';
    
    var perspective_shorttexts = [];
    for (p of perspectives) {
         for (q of questions) {
        if (p === q.column) {
          perspective_shorttexts.push(q.short);
          perspective_options.push(q.options);
          break;
        }
      }
    }
    
    var panel = d3.select('.daxplore-PerspectivePanel');
    
    var header = panel.append('div')
      .classed('perspective-header', true)
      .text(usertexts.pickSelectionGroupHeader);
    
    var picker_panel = panel.append('div')
      .classed('perspective-picker-panel', true);
    
    var variable_picker_wrapper_wrapper = picker_panel.append('div')
      .classed('perspective-variable-picker-wrapper-wrapper', true)
      .style('overflow', 'hidden');
    
    var variable_picker_wrapper = variable_picker_wrapper_wrapper.append('div')
      .classed('perspective-variable-picker-wrapper', true)
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('height', height + 'px');
    
    variable_picker_wrapper_wrapper.append('div')
      .style('height', '100%')
      .style('border-right', '1px solid #ABABAB');
    
    variable_picker_wrapper.append('div')
      .classed('perspective-variable-picker-padding-top', true);
    
    var variable_picker = variable_picker_wrapper.append('div')
      .classed('perspective-variable-picker', true);
    
    variable_picker_wrapper.append('div')
      .classed('perspective-variable-picker-padding-bottom', true);
    
    variable_picker.selectAll('.perspective-variable-option')
      .data(perspective_shorttexts)
      .enter()
        .append('div')
        .classed('perspective-variable-option', true)
        .on('click', function(d, i) { setSelectedPerspective(i); })
        .text(function(d) {return d});
    
    var checkbox_panel_wrapper = picker_panel.append('div')
      .classed('perspective-checkbox-panel-wrapper', true)
      .style('position', 'relative')
      .style('width', '200px')
      .style('height', (height-1) + 'px');
      
    var checkbox_panel = checkbox_panel_wrapper.append('div')
      .classed('perspective-checkbox-panel', true)
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('position', 'absolute');
    
    var general_select = checkbox_panel.append('div')
      .classed('perspective-general-select', true);
    
    var select_all_button = general_select.append('span')
      .classed('dashed-button', true)
      .classed('perspective-button', true)
      .on('click', function() {
        for (var i=0; i<selected_options.length; i++) {
          selected_options[i] = true;
        }
        updateCheckboxes(true);
      })
      .text('Markera alla');
    
    var deselect_all_button = general_select.append('span')
      .classed('dashed-button', true)
      .classed('perspective-button', true)
      .on('click', function() {
        for (var i=0; i<selected_options.length; i++) {
          selected_options[i] = false;
        }
        updateCheckboxes(true);
      })
      .text('Avmarkera alla');
    
    var column_wrapper = checkbox_panel.append('div')
      .classed('perspective-column-wrapper', true)
      .style('display', 'flex')
      .style('flex-direction', 'row');
    
    var first_column = column_wrapper
      .append('div')
        .classed('perspective-options-first-column', true)
        .classed('fade-bottom', has_remainder && collapsed);
    
    var remaining_columns_wrapper = column_wrapper
      .append('div')
        .classed('perspective-options-remainder-wrapper', true)
        .style('opacity', collapsed ? 0 : 1)
        .style('width', collapsed ? '0px' : null);
        
    var remaining_columns = remaining_columns_wrapper
      .append('div')
        .classed('perspective-remaining-columns', true)
        .classed('fade-bottom', has_remainder && collapsed);
    
    var expand_button_wrapper = checkbox_panel.append('div')
      .classed('expand-button-wrapper', true);
    
    var expand_button = expand_button_wrapper.append('div')
      .classed('expand-button', true)
      .classed('dashed-button', true)
      .classed('perspective-button', true)
      .text(collapsed ? 'Visa fler >' : '< Visa färre' )
      .style('visibility', function() {
          return has_remainder ? null : 'hidden';
      })
      .on('click', function() {
        collapsed = !collapsed;
        updateElements();
      });
    
    var second_column = remaining_columns
      .append('div')
        .classed('perspective-second-column', true);
    
    var third_column = remaining_columns
      .append('div')
        .classed('perspective-third-column', true);

    initializeSelection();
    initialized = true;
    
    // hack to force initial gwt sizing to work
    // TODO replace when the resizing system is moved to pure js
    for (var i=2; i<=12; i++) {
      setTimeout(initializeSelection, Math.pow(2, i));
    }
  }
  
  function initializeSelection() {
    if (selected_perspective === -1) {
      setSelectedPerspective(0);
    } else {
      setSelectedPerspective(selected_perspective);
    }
  }
  
  function setSelectedPerspective(index) {
    var changed = selected_perspective != index;
    selected_perspective = index;
    
    if (changed) {
      selected_options = [];
      var i = 0;
      for (option of perspective_options[selected_perspective]) {
        selected_options.push(i < settings.defaultSelectedPerspectiveOptions);
        i++;
      }
    }
    
    updateCheckboxes(true);
  }
  
  function updateCheckboxes(fireGwtEvent) {
      
    d3.selectAll('.perspective-variable-option')
      .classed('perspective-variable-selected', function(d, i) { return i == selected_perspective; });
      
    var show_select_total = settings.showSelectTotal; 
    var option_count = selected_options.length + (show_select_total ? 1 : 0);
    var per_column_setting = settings.perspectiveCheckboxesPerColumn;
    var max_columns = 3;
    var columns = Math.min(max_columns, Math.ceil(option_count / per_column_setting));
    var per_column = Math.ceil(option_count / columns);
    has_remainder = columns > 1;
    if (collapsed) {
      d3.select('.perspective-options-remainder-wrapper')
        .style('width', '0px');
    }
    if (!has_remainder) {
      collapsed = true;
    }

    var first_column_data = [];
    var second_column_data = [];
    var third_column_data = [];
    
    for (var i = 0; i < selected_options.length; i++) {
      var option = {text: perspective_options[selected_perspective][i], selected: selected_options[i], index: i};
      if (i < per_column) {
        first_column_data.push(option);
      } else if (i < per_column * 2) {
        second_column_data.push(option);
      } else {
        third_column_data.push(option);
      }
    }
    
    //TODO add total
    
    // First column
    var first_col_options = d3.select('.perspective-options-first-column').selectAll('.perspective-option')
      .data(first_column_data);
    
    first_col_options.exit().remove();
    
    first_col_options.enter()
      .append('div')
        .classed('perspective-option', true)
        .on('click', function(d) {
           selected_options[d.index] = !selected_options[d.index];
           updateCheckboxes(true);
         });
    
    d3.select('.perspective-options-first-column').selectAll('.perspective-option')
      .classed('perspective-option-selected', function(d) { return d.selected; })
      .text(function(d) { return d.text; });
    
    // Second column
    var second_col_options = d3.select('.perspective-second-column').selectAll('.perspective-option')
      .data(second_column_data);
  
    second_col_options.exit().remove();
  
    second_col_options.enter()
      .append('div')
        .classed('perspective-option', true)
        .on('click', function(d) {
           selected_options[d.index] = !selected_options[d.index];
           updateCheckboxes(true);
         });
  
    d3.select('.perspective-second-column').selectAll('.perspective-option')
      .classed('perspective-option-selected', function(d) { return d.selected; })
      .text(function(d) { return d.text; });
  
    // Third column
    var first_col_options = d3.select('.perspective-third-column').selectAll('.perspective-option')
      .data(third_column_data);
  
    first_col_options.exit().remove();
  
    first_col_options.enter()
      .append('div')
        .classed('perspective-option', true)
        .on('click', function(d) {
           selected_options[d.index] = !selected_options[d.index];
           updateCheckboxes(true);
         });
  
    d3.select('.perspective-third-column').selectAll('.perspective-option')
      .classed('perspective-option-selected', function(d) { return d.selected; })
      .text(function(d) { return d.text; });
    
    if (fireGwtEvent && selected_options.includes(true)) {
      gwtPerspectiveCallback(perspectives[selected_perspective], selected_options.join(',', true), false);
    }
    
    updateElements();
  }
  
  function updateElements() {
    d3.select('.perspective-options-first-column')
      .classed('fade-bottom', has_remainder && collapsed);

    d3.select('.perspective-remaining-columns')
      .classed('fade-bottom', has_remainder && collapsed);
    
    d3.select('.expand-button')
      .style('visibility', function() {
          return has_remainder ? null : 'hidden';
      })
      .text(collapsed ? 'Visa fler >' : '< Visa färre ');
    
    d3.select('.daxplore-DescriptionPanelBottom')
      .interrupt().transition()
        .style('color', collapsed ? 'black': 'hsl(0, 0%, 70%)');

    d3.select('.perspective-remaining-columns')
      .interrupt().transition()
        .style('width', collapsed ? '0px' : null);
    
    d3.select('.perspective-options-remainder-wrapper')
      .interrupt().transition()
        .style('opacity', collapsed ? 0 : 1)
        .style('width', collapsed ? '0px' : null);
  }
  
  
})(window);
