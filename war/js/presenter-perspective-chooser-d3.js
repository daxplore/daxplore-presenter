(function(exports) {
  
  var initialized = false;
  var selected_perspective = -1;
  var perspective_options = [];
  var selected_options = [];
  var has_total = false;
  var total_selected = false;
  var has_remainder = false;
  var collapsed = true;
  var fixed_width = null;
  
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
    d3.select('.daxplore-PerspectivePanel').html(
        "<div class='perspective-header'>Välj perspektiv</div>"
      + "<div class='perspective-picker'>"
      + "  <div class='perspective-varpicker'>"
      + "    <div class='pervarpicker-border-wrapper'>"
      + "      <div class='pervarpicker-top-padding'></div>"
      + "      <div class='pervarpicker-variables'></div>"
      + "      <div class='pervarpicker-bottom-padding'></div>"
      + "    </div>"
      + "    <div class='pervarpicker-right-border-extender'></div>"
      + "  </div>"
      + "  <div class='perspective-options'>"
      + "    <div class='peropt-buttons'>"
      + "      <span class='peropt-all-button  perspective-button dashed-button'></span>"
      + "      <span class='peropt-none-button perspective-button dashed-button'></span>"
      + "    </div>"
      + "    <div class='peropt-columns'>"
      + "      <div class='peropt-col-one'></div>"
      + "      <div class='peropt-extra-columns'>"
      + "        <div class='peropt-col-two'></div>"
      + "        <div class='peropt-col-three'></div>"
      + "      </div>"
      + "    </div>"
      + "    <div class='peropt-bottom-padding'></div>"
      + "    <div class='peropt-more-wrapper'>"
      + "      <span class='peropt-more-button perspective-button dashed-button'></span>"
      + "    </div>"
      + "  </div>"
      + "</div>"
    );
    
    window.setTimeout(popuplatePerspectivePanel(), 1);
  }
  
  function popuplatePerspectivePanel() {
    var variable_list = d3.select('.pervarpicker-variables');
    
    if (variable_list.empty()) {
      window.setTimeout(popuplatePerspectivePanel(), 10);
      return;
    }
    
    var perspective_shorttexts = [];
    perspectives.forEach(function(p) {
      questions.some(function(q) {
        if (p === q.column) {
          perspective_shorttexts.push(q.short);
          perspective_options.push(q.options);
          return true;
        }
      })
    });
    
    variable_list
      .selectAll('.pervarpicker-varoption')
      .data(perspective_shorttexts)
      .enter()
        .append('div')
        .classed('pervarpicker-varoption', true)
        .classed('no-select', true)
        .on('click', function(d, i) { setSelectedPerspective(i); })
        .text(function(d) {return d});
    
    d3.selectAll('.peropt-all-button')
      .on('click', function() {
        for (var i=0; i<selected_options.length; i++) {
          selected_options[i] = true;
        }
        updateCheckboxes(true);
      })
      .text('Markera alla');
      
    d3.selectAll('.peropt-none-button')
      .on('click', function() {
        for (var i=0; i<selected_options.length; i++) {
          selected_options[i] = false;
        }
        updateCheckboxes(true);
      })
      .text('Avmarkera alla');

    d3.selectAll('.peropt-more-button')
      .text(collapsed ? 'Visa fler >' : '< Visa färre' )
      .style('visibility', function() {
        return has_remainder ? null : 'hidden';
      })
      .on('click', function() {
        collapsed = !collapsed;
        if (collapsed) {
          fixed_width = null;
        } else {
          fixed_width = d3.select('.perspective-picker').node().offsetWidth;
        }
        console.log(fixed_width);
        updateElements();
      });
          
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
      perspective_options[selected_perspective].forEach(function(option) {
        selected_options.push(i < settings.defaultSelectedPerspectiveOptions);
        i++;
      });
    }
    
    updateCheckboxes(true);
  }
  
  function updateCheckboxes(fireGwtEvent) {
      
    d3.selectAll('.pervarpicker-varoption')
      .classed('pervarpicker-varoption-selected', function(d, i) { return i == selected_perspective; });
      
    var show_select_total = settings.showSelectTotal; 
    var option_count = selected_options.length + (show_select_total ? 1 : 0);
    var per_column_setting = settings.perspectiveCheckboxesPerColumn;
    var max_columns = 3;
    var columns = Math.min(max_columns, Math.ceil(option_count / per_column_setting));
    var per_column = Math.ceil(option_count / columns);
    has_remainder = columns > 1;
    if (collapsed) {
      d3.select('.peropt-extra-columns')
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
    var first_col_options = d3.select('.peropt-col-one')
      .selectAll('.peropt-checkbox')
      .data(first_column_data);
    
    first_col_options.exit().remove();
    
    first_col_options.enter()
      .append('div')
        .classed('peropt-checkbox', true)
        .on('click', function(d) {
           selected_options[d.index] = !selected_options[d.index];
           updateCheckboxes(true);
         });
    
    d3.select('.peropt-col-one').selectAll('.peropt-checkbox')
      .classed('peropt-checkbox-selected', function(d) { return d.selected; })
      .text(function(d) { return d.text; });
    
      
    // Second column
    var second_col_options = d3.select('.peropt-col-two')
      .selectAll('.peropt-checkbox')
      .data(second_column_data);
  
    second_col_options.exit().remove();
  
    second_col_options.enter()
      .append('div')
        .classed('peropt-checkbox', true)
        .on('click', function(d) {
           selected_options[d.index] = !selected_options[d.index];
           updateCheckboxes(true);
         });
  
    d3.select('.peropt-col-two').selectAll('.peropt-checkbox')
      .classed('peropt-checkbox-selected', function(d) { return d.selected; })
      .text(function(d) { return d.text; });

      
    // Third column
    var first_col_options = d3.select('.peropt-col-three')
      .selectAll('.peropt-checkbox')
      .data(third_column_data);
  
    first_col_options.exit().remove();
  
    first_col_options.enter()
      .append('div')
        .classed('peropt-checkbox', true)
        .on('click', function(d) {
           selected_options[d.index] = !selected_options[d.index];
           updateCheckboxes(true);
         });
  
    d3.select('.peropt-col-three').selectAll('.peropt-checkbox')
      .classed('peropt-checkbox-selected', function(d) { return d.selected; })
      .text(function(d) { return d.text; });
    
    var has_checked_box = false;
    for (var i=0; i<selected_options.length; i++) {
      if (selected_options[i]) {
        has_checked_box = true;
        break;
      }
    }
    
    if (fireGwtEvent && has_checked_box) {
      gwtPerspectiveCallback(perspectives[selected_perspective], selected_options.join(',', true), false);
    }
    
    // hack to handle IE display bugs
    var isIE = !!navigator.userAgent.match(/Trident/g) || !!navigator.userAgent.match(/MSIE/g);
    if (isIE) {
      var options_height = Math.max(
        d3.select('.pervarpicker-border-wrapper').node().offsetHeight,
        62 + 24 * first_column_data.length);
      d3.select('.perspective-options')
        .style('height', options_height + 'px');
    }
        
    updateElements();
  }
  
  function updateElements() {
    d3.select('.perspective-picker')
      .style('width', fixed_width + 'px');
    
    d3.select('.peropt-more-button')
      .style('visibility', function() {
        return has_remainder ? null : 'hidden';
      })
      .text(collapsed ? 'Visa fler >' : '< Visa färre ');
    
    d3.select('.peropt-bottom-padding')
      .style('height', function() {
        return has_remainder ? null : '0px';
      });
      
    d3.select('.daxplore-DescriptionPanelBottom')
      .interrupt().transition()
        .style('color', collapsed ? 'black': 'hsl(0, 0%, 70%)');

    d3.select('.peropt-extra-columns')
      .interrupt().transition()
        .style('opacity', collapsed ? 0 : 1)
        .style('width', collapsed ? '0px' : null);
        
  }
  
  
})(window);
