(function (exports) {
  var mean_references, shorttexts, usertexts, descriptions, directions

  var colors = {}

  colors.good = '#509a5c'
  colors.average = '#c5c2bd'
  colors.bad = '#d13d40'

  colors.good_hover = 'hsl(95, 38%, 57%)'
  colors.average_hover = 'hsl(60, 0%, 51%)'
  colors.bad_hover = 'hsl( 5, 38%, 67%)'

  colors.good_text = 'hsl(95, 38%, 34%)'
  colors.average_text = 'hsl(60, 0%, 31%)',
  colors.bad_text = 'hsl( 5, 38%, 42%)'

  exports.initiateHelpers =
  function (
    references_map,
    shorttexts_map,
    usertexts_map,
    descriptions_map,
    directions_map) {
    mean_references = references_map
    shorttexts = shorttexts_map
    usertexts = usertexts_map
    descriptions = descriptions_map
    directions = directions_map
  }

  exports.colorForValue =
  function (value, reference, direction) {
    if (direction == 'LOW') {
      var diff = reference - value
    } else {
      var diff = value - reference
    }

    if (diff < -5) {
      return colors.bad
    } else if (diff > 5) {
      return colors.good
    } else {
      return colors.average
    }
  }

  exports.colorHoverForValue =
  function (value, reference, direction) {
    if (direction == 'LOW') {
      var diff = reference - value
    } else {
      var diff = value - reference
    }

    if (diff < -5) {
      return colors.bad_hover
    } else if (diff > 5) {
      return colors.good_hover
    } else {
      return colors.average_hover
    }
  }

  exports.colorTextForValue =
  function (value, reference, direction) {
    if (direction == 'LOW') {
      var diff = reference - value
    } else {
      var diff = value - reference
    }

    if (diff < -5) {
      return colors.bad_text
    } else if (diff > 5) {
      return colors.good_text
    } else {
      return colors.average_text
    }
  }

  exports.setDescriptionShort =
  function (element, q_id) {
    var shorttext = shorttexts[q_id]
    var header = "<span class='description-header'>" + shorttext + '</span><br>'
    var description = descriptions[q_id]
    element.html(header + description)
  }

  exports.setDescriptionFull =
  function (element, group_name, q_id, mean) {
    var shorttext = shorttexts[q_id]
    var description = descriptions[q_id]
    var reference = mean_references[q_id]
    var direction = directions[q_id]

    element.transition()
      .duration(0)
        .style('opacity', 1)

    var color = colorTextForValue(mean, reference, direction)
    var header = "<span class='description-header'>" + group_name + '</span><br><b>' + shorttext + ': ' + d3.format('d')(mean) + '</b><br>'
    var subheader = '<b>' + usertexts.listReferenceValue + ': ' + d3.format('d')(reference) + '</b><br>'

    var trueDiff = mean - reference
    var diff = direction == 'LOW' ? reference - mean : trueDiff

    if (diff < -5) {
      var referenceComparison = usertexts.listReferenceWorse
    } else if (diff > 5) {
      var referenceComparison = usertexts.listReferenceBetter
    } else {
      var referenceComparison = usertexts.listReferenceComparable
    }

    referenceComparison = '<span style="color: ' + color + '; font-weight: bold">' + referenceComparison + ': ' + d3.format('+d')(trueDiff) + '</span></b><br><br>'

    element.html(header + subheader + referenceComparison + description)
  }
})(window)
