// TODO Userprofile is hard coded specifically for COPSOQ in Swedish. Probably not
// meaningful to generalize into something useful for other projects. Should
// most likely be moved to separate repo.
(function (namespace) {
  namespace.userprofile = namespace.userprofile || {}
  const exports = namespace.userprofile

  var qIDs, meanReferences, shorttextsMap, usertexts, directions

  // TODO externalize or keep hard coded in separate repo?
  var userImportRegexes = [
    /kvantitativ/g,
    /tempo|takt/g,
    /känslomässig|emotionell/g,
    /inflytande|kontroll/g,
    /utveckling/g,
    /variation/g,
    /mening/g,
    /involvering/g,
    /förutsägbarhet/g,
    /klarhet|rolltydlighet/g,
    /rollkonflikt/g,
    /ledningskvalitet/g,
    /(?=.*stöd)(?=.*(överordna|chef))/g,
    /(?=.*stöd)(?=.*kolleg)/g,
    /erkännande|belönning/g,
    /gemenskap/g,
    /tillfredsställ/g,
    /^konflikt.*(privatliv|hem)/g,
    /((?=.*tillit)(?=.*ledning)(?=.*medarbetar))|((?=.*vertikal)(?=.*tillit))/g,
    /((?=.*tillit)(?=.*(medarbetar|anställd))(^((?!ledning).)*$))|((?=.*horisontell)(?=.*tillit))/g,
    /rättvisa|respekt/g,
    /((?=.*social)(?=.*ansvar))|inkluderande/g,
    /självskattad|hälsa/g,
    /stress/g,
    /utbränd|utmattning/g,
    /sömn/g,
  ]

  var systemdata
  var usernames = []
  var usermeans = []

  var callbackFunctions = []

  var gridRows, tbody

  var userPasteSectionOpen = false

  function colorClassForValue (value, reference, direction) {
    if (typeof value !== 'number' || isNaN(value)) { return '' }

    if (direction === 'LOW') {
      var diff = reference - value
    } else {
      diff = value - reference
    }

    if (diff < -5) {
      return 'cell-bad'
    } else if (diff > 5) {
      return 'cell-good'
    } else {
      return 'cell-avg'
    }
  }

  function callCallbacks () {
    // make sure all names are unique for the drop-down
    var names = []
    for (var i = 0; i < usernames.length; i++) {
      var name = usernames[i]
      while (names.indexOf(name) !== -1) {
        name += ' '
      }
      names.push(name)
    }

    for (i = 0; i < callbackFunctions.length; i++) {
      callbackFunctions[i](names, usermeans)
    }
  }

  function generateColumns (usernames, usermeans) {
    d3.select('.grid-header')
      .selectAll('.header-cell')
      .data(usernames).enter()
        .append('th')
          .classed('header-cell', true)
          .append('div')
            .append('span')
              .append('input')
                .classed('header-cell-input', true)
                .attr('tabindex', function (d, i) { return 1 + i * (qIDs.length + 1) })
                .attr('placeholder', function (d, i) { return 'Grupp ' + (i + 1) }) // TODO externalize
                .on('input', function (d, i, t) {
                  var el = t[i]
                  if (typeof el.value === 'undefined' || el.value === '') {
                    usernames[i] = el.placeholder
                  } else {
                    usernames[i] = el.value
                  }
                  callCallbacks()
                  d3.select(el)
                     .classed('has-content', !(!(el.value) || el.value.length === 0))
                })

    // create a cell in each row for each column
    gridRows.selectAll('.grid-cell').remove()
    gridRows.selectAll('.grid-cell')
      .data(function (row) {
        return usernames.map(function (column, i) {
          return { qID: row.qID, reference: row.reference, col_index: i, row_index: row.index, mean: usermeans[row.index][i] }
        })
      })
      .enter()
      .append('td')
        .classed('grid-cell', true)
        .append('input')
          .attr('value', function (d) { return isNaN(d.mean) ? null : String(d.mean).replace('.', ',') })
          .attr('class', function (d) { return isNaN(d.mean) ? 'null' : colorClassForValue(d.mean, meanReferences[d.qID], directions[d.qID]) })
          .attr('tabindex', function (d, i) { return 2 + d.row_index + d.col_index * (1 + qIDs.length) })
          .attr('pattern', '[0-9]+([\\.,][0-9]+)?') // TODO added extra escape backslash, check it works
          .attr('step', 0.1)
          .on('focus', function (d) {
            daxplore.profile.setDescriptionShort(d3.select('#grid-description'), d.qID)
          })
          .on('focusout', function (d, i, t) {
            var el = t[i]
            var val = parseFloat(el.value.replace(',', '.'))
            if (typeof val !== 'number' || isNaN(val)) {
              el.value = ''
              return
            }

            var min = 0
            var max = 100

            val = Math.min(Math.max(val, min), max)

            if (typeof val === 'number' && !isNaN(val)) {
              el.value = val
            } else {
              el.value = ''
            }

            d3.select(el)
                .attr('class', colorClassForValue(val, meanReferences[d.qID], directions[d.qID]))
          })
          .on('input', function (d, i, t) {
            var el = t[i]
            var val = parseFloat(el.value.replace(',', '.'))

            var min = 0
            var max = 100

            val = Math.min(Math.max(val, min), max)

            if (typeof val === 'number' && !isNaN(val)) {
              usermeans[d.row_index][d.col_index] = val
            } else {
              usermeans[d.row_index][d.col_index] = NaN
            }

            callCallbacks()

            d3.select(el)
                .attr('class', colorClassForValue(val, meanReferences[d.qID], directions[d.qID]))
          })

    callCallbacks()
  }

  function updateUserCopyGroupNameDropdown (groupNames) {
    var dropdown = d3.selectAll('.user-paste-data-submit-column-select')

    var options = dropdown.selectAll('option')
        .data(groupNames, function (d) { return d })

    options.exit().remove()

    options.enter()
      .append('option')
        .text(function (d) { return d })
        .attr('value', function (d, i) { return i })

    updateUserCopyHeight()
  }

  function updateUserCopyHeight () {
    d3.select('.user-paste-data-content-wrapper')
      .transition().duration(300)
        .style('height', function () {
          if (userPasteSectionOpen) {
            return d3.select('.user-paste-data-content').node().offsetHeight + 'px'
          }
          return '0px'
        })
  }

  exports.generateUserPasteSection = function () {
    daxplore.userprofile.addGridUpdateCallback(updateUserCopyGroupNameDropdown)
    d3.select('.user-paste-data-header')
      .on('click', function () {
        userPasteSectionOpen = !userPasteSectionOpen

        // TURN ARROW
        var arrow = d3.select('.user-paste-data-header-arrow')
        arrow.interrupt().selectAll('*').interrupt()
        arrow
          .transition().duration(300)
          .style('transform', function () {
            if (userPasteSectionOpen) {
              return 'rotate(0.25turn)'
            }
            return 'rotate(0turn)'
          })

        updateUserCopyHeight()
      })

    d3.select('.user-paste-data-submit-button')
      .on('click', function () {
        var selectedGroupIndex = d3.select('.user-paste-data-submit-column-select').node().selectedIndex

        for (var i = 0; i < usermeans.length; i++) {
          usermeans[i][selectedGroupIndex] = NaN
        }

        var rows = d3.select('.user-paste-data-textarea').node().value.split('\n')
        var importedTexts = new Array(usermeans.length)
        var importedMeanStrings = new Array(usermeans.length)
        var importedMeans = new Array(usermeans.length)
        var matchedRows = new Array(rows.length)

        var numberBoundsErrors = []
        var notANumberErrors = []
        var multiMatchErrors = []
        var noMatchErrors = []

        // parse text and numbers
        for (i = 0; i < rows.length; i++) {
          var row = rows[i]
          if (typeof row !== 'undefined' && row.length > 0) {
            row = row.trim()
          }
          var lastWhitespace = row.search(/\s[^\s]*$/)
          if (lastWhitespace > 0) {
            importedTexts[i] = row.substring(0, lastWhitespace + 1).trim()
            importedMeanStrings[i] = row.substring(lastWhitespace + 1, row.length).trim()
            importedMeans[i] = Number(importedMeanStrings[i].replace(',', '.'))
          }
        }

        // check for matches
        for (var regIndex = 0; regIndex < userImportRegexes.length; regIndex++) {
          var matchRow = -1
          var matchedRowTexts = []
          for (var importRow = 0; importRow < importedTexts.length; importRow++) {
            if (typeof importedTexts[importRow] === 'undefined') {
              continue
            }
            var textLC = importedTexts[importRow].toLowerCase()
            if (textLC.length > 0) {
              if (textLC.search(userImportRegexes[regIndex]) >= 0) {
                matchedRowTexts.push(importedTexts[importRow] + ' ' + importedMeanStrings[importRow])
                matchedRows[importRow] = true
                matchRow = importRow
              }
            }
          }
          matchedRowTexts = matchedRowTexts.filter(function (value, index, self) { return self.indexOf(value) === index })
          if (matchedRowTexts.length === 1) {
            if ((typeof importedMeans[matchRow] !== 'number' || isNaN(importedMeans[matchRow])) && typeof rows[matchRow] !== 'undefined' && rows[matchRow].length > 0) {
              notANumberErrors.push(rows[matchRow].trim())
            } else if (importedMeans[matchRow] < 0 || importedMeans[matchRow] > 100) {
              numberBoundsErrors.push(rows[matchRow].trim())
            } else {
              usermeans[regIndex][selectedGroupIndex] = importedMeans[matchRow]
            }
          } else if (matchedRowTexts.length > 1) {
            multiMatchErrors.push({ scale: shorttextsMap[qIDs[regIndex]], matchedRowTexts: matchedRowTexts })
          }
        }

        // generate errors for unmatched rows
        for (i = 0; i < matchedRows.length; i++) {
          if (typeof matchedRows[i] === 'undefined' && typeof rows[i] !== 'undefined' && rows[i].length > 0) {
            noMatchErrors.push(rows[i])
          }
        }

        // ADD NUMBER OUT OF BOUNDS ERRORS
        d3.select('.user-paste-data-error-text-number-bounds-errors')
          .style('display', numberBoundsErrors.length > 0 ? 'block' : 'none')

        var numberBoundsErrorRows = d3.select('.user-paste-data-error-text-number-bounds-errors')
          .selectAll('.user-paste-data-error-row')
          .data(numberBoundsErrors)

        numberBoundsErrorRows.exit().remove()

        numberBoundsErrorRows.enter()
          .append('div')
          .classed('user-paste-data-error-row', true)
          .text(function (d) { return d })

        numberBoundsErrorRows
          .text(function (d) { return d })

        // ADD NO NUMBER FOUND ERRORS
        d3.select('.user-paste-data-error-text-no-number-errors')
          .style('display', notANumberErrors.length > 0 ? 'block' : 'none')

        var notANumberErrorRows = d3.select('.user-paste-data-error-text-no-number-errors')
          .selectAll('.user-paste-data-error-row')
          .data(notANumberErrors)

        notANumberErrorRows.exit().remove()

        notANumberErrorRows.enter()
          .append('div')
          .classed('user-paste-data-error-row', true)
          .text(function (d) { return d })

        notANumberErrorRows
          .text(function (d) { return d })

        // ADD MULTIPLE MATCHES ERRORS
        d3.select('.user-paste-data-error-text-multiple-rows-errors')
          .style('display', multiMatchErrors.length > 0 ? 'block' : 'none')

        var multipleMatchErrorGroups = d3.select('.user-paste-data-error-text-multiple-rows-errors')
          .selectAll('.user-paste-data-error-multiple-match-group')
          .data(multiMatchErrors)

        multipleMatchErrorGroups.exit().remove()

        var multipleMatchContentFunction = function (d) {
          var group = d3.select(this)
          group.text('')

          // TODO externalize text
          group.append('div')
            .text('Skalan "' + d.scale + '" matchades av flera rader:') // TODO externalize text

          d.matchedRowTexts.forEach(function (r) {
            group.append('div')
              .classed('user-paste-data-error-row', true)
              .text(r)
          })
        }

        multipleMatchErrorGroups.enter()
          .append('div')
          .classed('user-paste-data-error-multiple-match-group', true)
          .each(multipleMatchContentFunction)

        multipleMatchErrorGroups
          .each(multipleMatchContentFunction)

        // ADD NO MATCH ERRORS
        d3.select('.user-paste-data-error-text-no-row-errors')
          .style('display', noMatchErrors.length > 0 ? 'block' : 'none')

        var noMatchErrorRows = d3.select('.user-paste-data-error-text-no-row-errors')
          .selectAll('.user-paste-data-error-row')
          .data(noMatchErrors)

        noMatchErrorRows.exit().remove()

        noMatchErrorRows.enter()
          .append('div')
          .classed('user-paste-data-error-row', true)
          .text(function (d) { return d })

        noMatchErrorRows
          .text(function (d) { return d })

        // SHOW/HIDE ERROR LOG
        d3.select('.user-paste-data-error-log-wrapper')
          .style('display', numberBoundsErrors.length + notANumberErrors.length + multiMatchErrors.length + noMatchErrors.length > 0 ? 'flex' : 'none')

        generateColumns(usernames, usermeans)
        callCallbacks()
      })
  }

  exports.addGridUpdateCallback = function (callbackFunction) {
    callbackFunctions.push(callbackFunction)
    callCallbacks()
  }

  exports.addColumn = function () {
    usernames.push('Grupp ' + (usernames.length + 1)) // TODO externalize text

    usermeans.forEach(function (u) {
      u.push(NaN)
    })

    generateColumns(usernames, usermeans)
  }

  exports.generateGrid =
    function (
      qIDsArray,
      referencesMap,
      shorttextsMapInput,
      usertextsMap,
      directionsMap
    ) {
      qIDs = qIDsArray
      meanReferences = referencesMap
      shorttextsMap = shorttextsMapInput
      usertexts = usertextsMap
      directions = directionsMap

      d3.select('.add-column-button')
          .text('+ Lägg till grupp')

      if (Modernizr.svgforeignobject) {
        d3.select('.save-grid-image-button')
            .text('Spara som bild') // TODO externalize text
            .on('click', daxplore.userprofile.saveGridImage)
      } else {
        d3.select('.save-grid-image-button')
            .remove()
      }

      d3.select('.grid-legend-text.good').text(usertexts.listReferenceBetter)
      d3.select('.grid-legend-text.avg').text(usertexts.listReferenceComparable)
      d3.select('.grid-legend-text.bad').text(usertexts.listReferenceWorse)

      if (qIDs.length > 0) {
        daxplore.profile.setDescriptionShort(d3.select('#grid-description'), qIDs[0])
      }

      usernames.push('Grupp 1') // TODO externalize text

      usermeans = qIDs.map(function (qID, i) {
        return [NaN]
      })

      systemdata = qIDs.map(function (qID, i) {
        return {
          qID: qID,
          index: i,
          reference: referencesMap[qID],
        }
      })

      // GRID FORM
      var form = d3.select('.grid').append('form').attr('lang', 'sv')
      var table = form.append('table')
      var thead = table.append('thead')
      tbody = table.append('tbody')

      // GRID HEADER
      var header = thead.append('tr')
          .classed('grid-header', true)

      header
          .append('th')
          .classed('rowtext', true)
          .classed('groupname', true)
          .text('Gruppnamn:') // TODO externalize

      // GRID ROWS
      gridRows = tbody.selectAll('tr')
          .data(systemdata)
          .enter()
            .append('tr')
              .attr('class', function (d) { return 'gridrow-' + d.qID })
              .on('mouseover', function (d, i) {
                daxplore.profile.setDescriptionShort(d3.select('#grid-description'), d.qID)
              })

      gridRows.append('td')
          .classed('rowtext', true)
          .text(function (d) { return shorttextsMap[d.qID] })

      generateColumns(usernames, usermeans)
    }

  exports.saveGridImage = function () {
    var gridclone = d3.select(d3.select('.grid').node().cloneNode(true))

    var removed = 0
    systemdata.forEach(function (d) {
      for (var col = 0; col < usernames.length; col++) {
        if (!isNaN(usermeans[d.index][col])) {
          return
        }
      }
      gridclone.select('.gridrow-' + d.qID).remove()
      removed++
    })

    if (removed === systemdata.length) {
      gridclone = d3.select(d3.select('.grid').node().cloneNode(true))
    }

    d3.select('body')
      .append('div')
        .style('position', 'absolute')
        .style('left', '-9999px')
        .style('top', '-9999px')
        .append(function () { return gridclone.node() })

    gridclone
      .selectAll('.header-cell')
      .remove()

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
              .text(function (name) { return name })

    var textTest = d3.select('body')
      .append('span')
      .classed('text-width-test', true)

    var maxTitleWidth = 0
    for (var i = 0; i < usernames.length; i++) {
      textTest
        .text(usernames[i])
      maxTitleWidth = Math.max(maxTitleWidth, textTest.node().offsetWidth)
    }
    var titleHeight = textTest.node().offsetHeight
    textTest.remove()

    var rotationAngle = 2 * Math.PI * 1 / 8
    var headerHeight = gridclone.select('.grid-header').node().offsetHeight
    var trueHeaderHeight = maxTitleWidth * Math.sin(rotationAngle) + titleHeight * Math.cos(rotationAngle)
    var heightOffset = trueHeaderHeight - headerHeight

    // true_header height represents a square of the longest header
    // estimate width based on the largest title being the rightmost header.
    // This could be computed more accurately by for each header calculating:
    // vertical overflow = true header width - width of columns to the right
    var chartWidth = gridclone.node().offsetWidth + trueHeaderHeight - 20

    var topMargin = 3 + (heightOffset > 0 ? heightOffset : 0)
    gridclone
      .style('padding-top', topMargin + 'px')
      .style('padding-bottom', 1 + 'px')

    if (heightOffset > 0) {
      heightOffset = 0
    }

    gridclone.selectAll('.header-cell-input')
      .style('border', 'none')

    domtoimage.toPng(gridclone.node(), { bgcolor: 'white' })
      .then(function (dataUrl) {
        gridclone.remove()
        generateAndSaveImage(dataUrl, chartWidth, heightOffset)
      })['catch'](function (error) { // eslint-disable-line dot-notation
        if (error) { // TODO standard-js forces if(error) (see handle-callback-error)
          // TODO error handling: console.error('Failed to generate image', error)
        }
      })
  }

  var generateAndSaveImage = function (dataUrl, minWidth, heightOffset) {
    var img = new Image()
    img.onload = function () {
      var hMargin = 10
      var chartWidth = Math.max(minWidth, img.width + 2 * hMargin)
      var topMargin = 10
      var bottomMargin = 20
      var canvasHeight = img.height + heightOffset + topMargin + bottomMargin

      var canvasChartSelection = d3.select('body').append('canvas')
        .attr('width', chartWidth)
        .attr('height', canvasHeight)
        .style('visibility', 'visible')
      var canvasChart = canvasChartSelection.node()
      var ctx = canvasChart.getContext('2d')

      var sourceText = usertexts.imageWaterStamp
      var sourceFontHeight = 11
      ctx.font = sourceFontHeight + 'px sans-serif'
      var sourceTextWidth = ctx.measureText(sourceText).width

      if (sourceTextWidth + 2 * hMargin > chartWidth) {
        generateAndSaveImage(dataUrl, sourceTextWidth + 2 * hMargin, heightOffset)
        canvasChartSelection.remove()
        return
      }

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, chartWidth, canvasHeight)
      ctx.fillStyle = 'black'

      ctx.drawImage(img, hMargin, topMargin + heightOffset)

      ctx.fillStyle = '#555'
      ctx.fillText(sourceText, hMargin, canvasHeight - 5)

      canvasChart.toBlob(function (blob) {
        saveAs(blob, usertexts.imageTitleProfileChart + '.png')
      })

      canvasChartSelection.remove()
    }

    img.src = dataUrl
  }
})(window.daxplore = window.daxplore || {})
