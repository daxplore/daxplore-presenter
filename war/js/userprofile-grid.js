(function(exports) {

  var q_ids, mean_references, shorttexts, usertexts, descriptions, directions;
  
  var systemdata;
  var usernames = [];
  var usermeans = [];
  
  var callbackFunctions = [];
  
  var rows, tbody;
  
  function colorClassForValue(value, reference, direction) {
    if (typeof value != 'number' || isNaN(value)) { return '' }
      
    if (direction == 'LOW') {
      var diff = reference - value;
    } else {
      var diff = value - reference;
    }

    if (diff < -5) {
      return 'cell-bad';
    } else if (diff > 5) {
      return 'cell-good';
    } else {
      return 'cell-avg';
    }
  }
  
  function callCallbacks() {
    // make sure all names are unique for the dropdown
    var names = [];
    for (var i = 0; i < usernames.length; i++) {
      var name = usernames[i];
      while(names.indexOf(name) != -1) {
        name += ' ';
      }
      names.push(name);
    }
    
    for (var i=0; i<callbackFunctions.length; i++) {
      callbackFunctions[i](names, usermeans);
    }
  }
  
  function generateColumns(usernames, usermeans) {
    d3.select('.grid-header')
      .selectAll('.header-cell')
      .data(usernames).enter()
        .append('th')
          .classed('header-cell', true)
          .append('div')
            .append('span')
              .append('input')
                .classed('header-cell-input', true)
                .attr('tabindex', function(d, i) { return 1 + i * (q_ids.length + 1) })
                .attr('placeholder', function (d, i) { return 'Grupp ' + (i + 1) })
                .on('input', function (d, i, t) {
                   el = t[i];
                   if (typeof el.value == 'undefined' || el.value == '') {
                     usernames[i] = el.placeholder;
                   } else {
                     usernames[i] = el.value;
                   }
                   callCallbacks();
                   d3.select(el)
                     .classed('has-content', !(!(el.value) || 0 === el.value.length))
                });
    
    // create a cell in each row for each column
    var cells = rows.selectAll('.grid-cell')
      .data(function (row) {
        return usernames.map(function (column, i) {
          return {q_id: row.q_id, reference: row.reference, col_index: i, row_index: row.index};
        });
      })
      .enter()
      .append('td')
          .classed('grid-cell', true)
          .append('input')
              .attr('tabindex', function(d, i) { return 2 + d.row_index + d.col_index * (1 + q_ids.length) })
              .attr('pattern', '[0-9]+([\.,][0-9]+)?')
              .attr('step', 0.1)
              .on('focus', function(d) {
              setDescriptionShort(d3.select('#grid-description'), d.q_id);
            })
              .on('focusout', function(d, i, t) {
                  el = t[i];
                  val = parseFloat(el.value.replace(',', '.'));
                  if (typeof val != 'number' || isNaN(val)) {
                      el.value = '';
                      return;
                  }
                  
                  min = 0;
                  max = 100;
                  
                  val = Math.min(Math.max(val, min), max);
                  
                  if (typeof val == 'number' && !isNaN(val)) {
                      el.value = val;
                  } else {
                      el.value = '';
                  }
                  
                  d3.select(el)
                    .attr('class', colorClassForValue(val, mean_references[d.q_id], directions[d.q_id]));
                  
              })
              .on('input', function(d, i, t) {
                  el = t[i];
                  val = parseFloat(el.value.replace(',', '.'));
                  
                  min = 0;
                  max = 100;
                  
                  val = Math.min(Math.max(val, min), max);
                  
                  if (typeof val == 'number' && !isNaN(val)) {
                      usermeans[d.row_index][d.col_index] = val; 
                  } else {
                      usermeans[d.row_index][d.col_index] = NaN; 
                  }
                  
                  callCallbacks();
                  
                  d3.select(el)
                    .attr('class', colorClassForValue(val, mean_references[d.q_id], directions[d.q_id]));
              });
    
        callCallbacks();
  }
  
  exports.addGridUpdateCallback = function(callbackFunction) {
    callbackFunctions.push(callbackFunction);
    callCallbacks();
  }
  
  exports.addColumn = function() {
    usernames.push('Grupp ' + (usernames.length + 1));
      
    usermeans.forEach(function(u) {
      u.push(NaN);
    });
     
    generateColumns(usernames, usermeans);
  }
      
  exports.generateGrid =
    function(
        locale,
        q_ids_array,
        references_map,
        shorttexts_map,
        usertexts_map,
        descriptions_array,
        directions_map
    ) {
        q_ids = q_ids_array;
        mean_references = references_map;
        shorttexts = shorttexts_map;
        usertexts = usertexts_map;
        descriptions = descriptions_array;
        directions = directions_map;
      
        d3.select('.add-column-button')
          .text('+ Lägg till grupp');
        
        if (Modernizr.promises && Modernizr.svgforeignobject) {
          d3.select('.save-grid-image-button')
            .text('Spara som bild')
            .on('click', saveGridImage);
        } else {
          d3.select('.save-grid-image-button')
            .remove();
        }
        
        d3.select('.grid-legend-text.good').text(usertexts.listReferenceBetter);
        d3.select('.grid-legend-text.avg').text(usertexts.listReferenceComparable);
        d3.select('.grid-legend-text.bad').text(usertexts.listReferenceWorse);
        
        if (q_ids.length > 0) {
          setDescriptionShort(d3.select('#grid-description'), q_ids[0]);
        }
        
        usernames.push('Grupp 1');
          
        usermeans = q_ids.map(function(q_id, i) {
          return [NaN];
        });
          
        systemdata = q_ids.map(function(q_id, i) { 
          return {
            q_id: q_id,
            index: i, 
            reference: references_map[q_id]
        }});
          
          
          // GRID FORM
        var form = d3.select('.grid').append('form')
          .attr('lang', locale);
        var table = form.append('table');
        var thead = table.append('thead');
        tbody = table.append('tbody');

        
        // GRID HEADER
        var header = thead.append('tr')
          .classed('grid-header', true);
        
        header
          .append('th')
          .classed('rowtext', true)
          .classed('groupname', true)
          .text('Gruppnamn:');
        
        
        // GRID ROWS
        rows = tbody.selectAll('tr')
          .data(systemdata)
          .enter()
            .append('tr')
              .attr('class', function(d) { return 'gridrow-' + d.q_id; })
              .on('mouseover', function(d, i) {
                setDescriptionShort(d3.select('#grid-description'), d.q_id);
              });
        
        rows.append('td')
          .classed('rowtext', true)
          .text(function (d) { return shorttexts[d.q_id] });
        
        generateColumns(usernames, usermeans);
      }
  
  exports.saveGridImage = function() {
    var gridclone = d3.select(d3.select('.grid').node().cloneNode(true));
    
    var removed = 0;
    systemdata.forEach(function(d) {
      for (var col=0; col<usernames.length; col++) {
        if (!isNaN(usermeans[d.index][col])) {
          return;
        }
      }
      gridclone.select('.gridrow-' + d.q_id).remove();
      removed++;
    });
    
    if (removed == systemdata.length) {
      gridclone = d3.select(d3.select('.grid').node().cloneNode(true));
    }
    
    d3.select('body')
      .append('div')
	    .style('position', 'absolute')
	    .style('left', '-9999px')
	    .style('top', '-9999px')
	    .append(function() { return gridclone.node(); });
    
    gridclone
      .selectAll('.header-cell')
      .remove();
    
    gridclone
      .select('.grid-header')
      .selectAll('.header-cell')
      .data(usernames).enter()
        .append('th')
          .classed('header-cell', true)
          .append('div')
            .append('span')
              .classed('header-cell-input', true)
              .style('width', 'auto')
              .text(function (name) { return name; });
    
    var text_test = d3.select('body')
      .append('span')
      .classed('text-width-test', true);
    
    var max_title_width = 0;
    for (var i=0; i<usernames.length; i++) {
      text_test
        .text(usernames[i]);
      max_title_width = Math.max(max_title_width, text_test.node().offsetWidth);
    }
    title_height = text_test.node().offsetHeight;
    text_test.remove();
    
    var rotation_angle = 2 * Math.PI * 1/8;
    var header_height = gridclone.select('.grid-header').node().offsetHeight;
    var true_header_height = max_title_width*Math.sin(rotation_angle) + title_height*Math.cos(rotation_angle);
    var height_offset = true_header_height - header_height;
    
    // true_header height represents a square of the longest header
    // estimate width based on the largest title being the rightmost header.
    // This could be computed more accurately by for each header calculating:
    // vertical overflow = true header width - width of columns to the right
    var chart_width = gridclone.node().offsetWidth + true_header_height - 20;
    
    var top_margin = 3 + (height_offset > 0 ? height_offset : 0); 
    gridclone
      .style('padding-top', top_margin + 'px')
      .style('padding-bottom', 1 + 'px');
    
    if (height_offset > 0) {
      height_offset = 0;
    }
    
    gridclone.selectAll('.header-cell-input')
      .style('border', 'none');
    
    domtoimage.toPng(gridclone.node(), {bgcolor: 'white'})
      .then(function(dataUrl) {
        gridclone.remove();
        generateAndSaveImage(dataUrl, chart_width, height_offset);
      })
      ['catch'](function (error) {
        console.error('Failed to generate image', error);
      });
  }
  
  var generateAndSaveImage = function (dataUrl, minWidth, height_offset) {
    var img = new Image();
    img.onload = function() {
      var h_margin = 10;
      var chart_width = Math.max(minWidth, img.width + 2*h_margin);
      var top_margin = 10;
      var bottom_margin = 20;
      var canvas_height = img.height + height_offset + top_margin + bottom_margin;
      
      var canvas_chart_selection = d3.select('body').append('canvas')
        .attr('width', chart_width)
        .attr('height', canvas_height)
        .style('visibility', 'visible');
      var canvas_chart = canvas_chart_selection.node();
      var ctx = canvas_chart.getContext('2d');
        
      var source_text = usertexts.imageWaterStamp;
      var source_font_height = 11;
      ctx.font = source_font_height + 'px sans-serif';
      var source_text_width = ctx.measureText(source_text).width;
        
      if (source_text_width + 2 * h_margin > chart_width) {
        generateAndSaveImage(dataUrl, source_text_width + 2 * h_margin, height_offset);
        canvas_chart_selection.remove();
        return;
      }
        
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, chart_width, canvas_height);
      ctx.fillStyle = 'black';
        
      ctx.drawImage(img, h_margin, top_margin + height_offset);
      
      ctx.fillStyle = '#555';
      ctx.fillText(source_text, h_margin, canvas_height - 5);
        
      canvas_chart.toBlob(function(blob) {
        saveAs(blob, 'profildiagram' + '.png');
      });
        
      canvas_chart_selection.remove();
    }
     
    img.src = dataUrl;
  }
})(window);
