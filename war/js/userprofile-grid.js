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
	callbackFunctions.forEach(function(callback) {
	  callback(names, usermeans);
	});
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
  
  
  exports.addGridUpdateCallback = 
	function(callbackFunction) {
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
		
		d3.select('.save-grid-image-button')
		  .text('Spara som bild')
		  .on('click', saveGridImage);
		
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
	  	    q_id,
	  	    index: i, 
		    reference: references_map[q_id]
	       }});
	  	
	  	var form = d3.select('.grid').append('form')
	  	  .attr('lang', locale);
		var table = form.append('table');
		var thead = table.append('thead');
		tbody = table.append('tbody');

		// append the header row
		var header = thead.append('tr')
			.classed('grid-header', true);
		
		header
		  .append('th')
		  .classed('rowtext', true)
		  .text('Gruppnamn:');
		
		rows = tbody.selectAll('tr')
		  .data(systemdata)
		  .enter()
		    .append('tr')
		      .on('mouseover', function(d, i) {
		        setDescriptionShort(d3.select('#grid-description'), d.q_id);
		      });
		
		rows.append('td')
		  .classed('rowtext', true)
		  .text(function (d) { return shorttexts[d.q_id] });
		
		generateColumns(usernames, usermeans);
  	}
  
  exports.saveGridImage = function() {
	domtoimage.toPng(d3.select('.grid').node(), {bgcolor: 'white'})
      .then(function (dataUrl) {
        var img = new Image();
        img.onload = function() {
          var margin = 10;
          var chart_width = img.width + 2*margin;
          var chart_height = img.height + 2*margin + 10;
        
          var canvas_chart_selection = d3.select('body').append('canvas')
            .attr('width', chart_width)
            .attr('height', chart_height)
            .style('visibility', 'visible');
          var canvas_chart = canvas_chart_selection.node();

          var ctx = canvas_chart.getContext('2d');
          
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, chart_width, chart_height);
          ctx.fillStyle = "black";
          
          ctx.drawImage(img, margin, margin);
          
          var source_text = usertexts.imageWaterStamp;
          var source_font_height = 11;
          ctx.font = source_font_height + 'px sans-serif';
          ctx.fillStyle = '#555';
          var source_text_width = ctx.measureText(source_text).width;
          ctx.fillText(source_text, 5, chart_height - 5);
          
          canvas_chart.toBlob(function(blob) {
            saveAs(blob, 'profildiagram' + '.png');
          });
          
          canvas_chart_selection.remove();
        }
        
        img.src = dataUrl;
      })
      .catch(function (error) {
        console.error('Failed to generate image', error);
      });
  }
})(window);
