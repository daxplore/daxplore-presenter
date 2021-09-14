// TODO Userprofile is hard coded specifically for COPSOQ in Swedish. Probably not
// meaningful to generalize into something useful for other projects. Should
// most likely be moved to separate repo.
(function (namespace) {
  namespace.userprofile = namespace.userprofile || {}
  const exports = namespace.userprofile

  let qIDs, meanReferences, shorttextsMap, directions, titleRegexpMap

  let systemdata
  const usernames = []
  let usermeans = []

  const callbackFunctions = []

  let gridRows, tbody

  let userPasteSectionOpen = false

  function colorClassForValue (value, reference, direction) {
    if (typeof value !== 'number' || isNaN(value)) { return '' }
    let diff = value - reference // HIGH
    if (direction === 'LOW') {
      diff = reference - value
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
    const names = []
    for (let i = 0; i < usernames.length; i++) {
      let name = usernames[i]
      while (names.indexOf(name) !== -1) {
        name += ' '
      }
      names.push(name)
    }

    for (let i = 0; i < callbackFunctions.length; i++) {
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
                  const el = t[i]
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
          .attr('pattern', '[0-9]+([\\.,][0-9]+)?')
          .attr('step', 0.1)
          .on('focus', function (d) {
            dax.profile.setDescriptionShort(d3.select('#grid-description'), d.qID)
          })
          .on('focusout', function (d, i, t) {
            const el = t[i]
            let val = parseFloat(el.value.replace(',', '.'))
            if (typeof val !== 'number' || isNaN(val)) {
              el.value = ''
              return
            }

            const min = 0
            const max = 100

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
            const el = t[i]
            let val = parseFloat(el.value.replace(',', '.'))

            const min = 0
            const max = 100

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
    const dropdown = d3.selectAll('.user-paste-data-submit-column-select')

    const options = dropdown.selectAll('option')
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

  exports.generateUserPasteSection =
  function () {
    dax.userprofile.addGridUpdateCallback(updateUserCopyGroupNameDropdown)
    d3.select('.user-paste-data-header')
      .on('click', function () {
        userPasteSectionOpen = !userPasteSectionOpen

        // TURN ARROW
        const arrow = d3.select('.user-paste-data-header-arrow')
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
        const selectedGroupIndex = d3.select('.user-paste-data-submit-column-select').node().selectedIndex

        for (let i = 0; i < usermeans.length; i++) {
          usermeans[i][selectedGroupIndex] = NaN
        }

        let importedTitle
        let importedText = d3.select('.user-paste-data-textarea').node().value.trim()
        // Some linebreaks put question names and numbers on different lines
        // Remove the line break in front of a number if the number has ended up on its own line
        importedText = importedText.replace(/\n(\s*\d+[\\.,]?\d*\s*)(\n|$)/g, ' $1$2')

        let rows = importedText.split('\n')
        const importedTexts = new Array(usermeans.length)
        const importedMeanStrings = new Array(usermeans.length)
        const importedMeans = new Array(usermeans.length)
        const matchedRows = new Array(rows.length)

        const numberBoundsErrors = []
        const notANumberErrors = []
        const multiMatchErrors = []
        const noMatchErrors = []

        rows = rows.map(function (row) {
          return row.trim()
        })
        let foundFirstNonEmptyRow = false

        // parse text and numbers
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          if (row.length === 0) {
            continue
          }
          const lastWhitespace = row.search(/\s[^\s]*$/)
          importedTexts[i] = row
          if (lastWhitespace > 0) {
            importedTexts[i] = row.substring(0, lastWhitespace + 1).trim()
            importedMeanStrings[i] = row.substring(lastWhitespace + 1, row.length).trim()
            importedMeans[i] = Number(importedMeanStrings[i].replace(',', '.'))
          }

          // Check if the first imported is a line without a number
          // If so treat it as a title, rather than a scale
          if (importedTitle === undefined && !foundFirstNonEmptyRow &&
          (typeof importedMeans[i] !== 'number' || isNaN(importedMeans[0]))) {
            importedTitle = row
            delete rows[i]
            delete importedTexts[i]
            delete importedMeanStrings[i]
            delete importedMeans[i]

            usernames[selectedGroupIndex] = importedTitle
            const titleInputElement = d3.selectAll('.header-cell-input')
              .filter(function (d, i) { return i === selectedGroupIndex })
              .classed('has-content', true)
            titleInputElement.node().value = importedTitle
          }
          foundFirstNonEmptyRow = true
        }

        // check for matches
        qIDs.forEach(function (qID, qIDindex) {
          let matchRow = -1
          let matchedRowTexts = []
          const questionTitleMatch = new RegExp(titleRegexpMap[qID], 'g')
          for (let importRow = 0; importRow < importedTexts.length; importRow++) {
            if (typeof importedTexts[importRow] === 'undefined') {
              continue
            }
            const textLC = importedTexts[importRow].toLowerCase()
            if (textLC.length > 0) {
              if (textLC.search(questionTitleMatch) >= 0) {
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
              usermeans[qIDindex][selectedGroupIndex] = importedMeans[matchRow]
            }
          } else if (matchedRowTexts.length > 1) {
            multiMatchErrors.push({ scale: shorttextsMap[qID], matchedRowTexts: matchedRowTexts })
          }
        })

        // generate errors for unmatched rows
        for (let i = 0; i < matchedRows.length; i++) {
          if (typeof matchedRows[i] === 'undefined' && typeof rows[i] !== 'undefined' && rows[i].length > 0) {
            noMatchErrors.push(rows[i])
          }
        }

        // ADD NUMBER OUT OF BOUNDS ERRORS
        d3.select('.user-paste-data-error-text-number-bounds-errors')
          .style('display', numberBoundsErrors.length > 0 ? 'block' : 'none')

        const numberBoundsErrorRows = d3.select('.user-paste-data-error-text-number-bounds-errors')
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

        const notANumberErrorRows = d3.select('.user-paste-data-error-text-no-number-errors')
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

        const multipleMatchErrorGroups = d3.select('.user-paste-data-error-text-multiple-rows-errors')
          .selectAll('.user-paste-data-error-multiple-match-group')
          .data(multiMatchErrors)

        multipleMatchErrorGroups.exit().remove()

        const multipleMatchContentFunction = function (d) {
          const group = d3.select(this)
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

        const noMatchErrorRows = d3.select('.user-paste-data-error-text-no-row-errors')
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

        const headerNode = d3.select('.user-paste-data-submit-column-select').node()
        const importDropdownIndex = headerNode.selectedIndex
        generateColumns(usernames, usermeans)
        headerNode.selectedIndex = importDropdownIndex

        callCallbacks()
      })
  }

  exports.addGridUpdateCallback =
  function (callbackFunction) {
    callbackFunctions.push(callbackFunction)
    callCallbacks()
  }

  exports.addColumn =
  function () {
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
    directionsMap,
    titleRegexpMapInput
  ) {
    qIDs = qIDsArray
    meanReferences = referencesMap
    shorttextsMap = shorttextsMapInput
    directions = directionsMap
    titleRegexpMap = titleRegexpMapInput

    d3.select('.add-column-button')
      .text('+ Lägg till grupp')

    if (Modernizr.svgforeignobject) {
      d3.select('.save-grid-image-button')
        .text('Spara som bild') // TODO externalize text
        .on('click', dax.userprofile.saveGridImage)
    } else {
      d3.select('.save-grid-image-button')
        .remove()
    }

    d3.select('.grid-legend-text.good').text(dax.text('profile.chart.mean_bar_vertical.reference.better'))
    d3.select('.grid-legend-text.avg').text(dax.text('profile.chart.mean_bar_vertical.reference.comparable'))
    d3.select('.grid-legend-text.bad').text(dax.text('profile.chart.mean_bar_vertical.reference.worse'))

    if (qIDs.length > 0) {
      dax.profile.setDescriptionShort(d3.select('#grid-description'), qIDs[0])
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
    const form = d3.select('.grid').append('form').attr('lang', 'sv')
    const table = form.append('table')
    const thead = table.append('thead')
    tbody = table.append('tbody')

    // GRID HEADER
    const header = thead.append('tr')
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
            dax.profile.setDescriptionShort(d3.select('#grid-description'), d.qID)
          })

    gridRows.append('td')
      .classed('rowtext', true)
      .text(function (d) { return shorttextsMap[d.qID] })

    generateColumns(usernames, usermeans)
  }

  const imageScaling = 2
  exports.saveGridImage =
  function () {
    let gridclone = d3.select(d3.select('.grid').node().cloneNode(true))

    let removed = 0
    systemdata.forEach(function (d) {
      for (let col = 0; col < usernames.length; col++) {
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

    const oldWidth = gridclone.node().offsetWidth
    const oldHeight = gridclone.node().offsetHeight
    const newWidth = oldWidth * imageScaling
    const newHeight = oldHeight * imageScaling

    console.log('scale(' + imageScaling + ') translate(' + (gridclone.node().offsetWidth / 2) + 'px,' + (gridclone.node().offsetHeight / 2) + 'px)')
    const translateX = (newWidth - oldWidth) / 2 // gridclone.node().offsetWidth
    const translateY = (newHeight - oldHeight) / 2 // gridclone.node().offsetHeight
    gridclone
      .style('transform', 'translate(' + translateX + 'px,' + translateY + 'px) scale(' + imageScaling + ')')

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

    const textTest = d3.select('body')
      .append('span')
      .classed('text-width-test', true)

    let maxTitleWidth = 0
    for (let i = 0; i < usernames.length; i++) {
      textTest
        .text(usernames[i])
      maxTitleWidth = Math.max(maxTitleWidth, textTest.node().offsetWidth * imageScaling)
    }

    textTest.remove()

    const headerNodes = gridclone.select('.grid-header').selectAll('.header-cell-input').nodes()
    let maxHeaderHeight = Math.max(...headerNodes.map(n => n.getBoundingClientRect().height))
    maxHeaderHeight += 5 * imageScaling
    const maxHeaderWidth = Math.max(...headerNodes.map(n => n.getBoundingClientRect().width))

    const trueHeaderWidth = maxHeaderWidth

    const topMargin = maxHeaderHeight
    const bottomMargin = 10 * imageScaling
    gridclone
      .style('margin-top', topMargin + 'px')
      .style('padding-bottom', bottomMargin + 'px')

    gridclone.selectAll('.header-cell-input')
      .style('border', 'none')

    const chartWidth = (gridclone.node().offsetWidth + trueHeaderWidth) * imageScaling
    const chartHeight = gridclone.node().offsetHeight * imageScaling + topMargin + bottomMargin

    domtoimage.toPng(gridclone.node(), { bgcolor: 'white', width: chartWidth, height: chartHeight })
      .then(function (dataUrl) {
        gridclone.remove()
        generateAndSaveImage(dataUrl, chartWidth, maxHeaderHeight)
      })['catch'](function (error) { // eslint-disable-line dot-notation
        if (error) { // TODO standard-js forces if(error) (see handle-callback-error)
          // TODO error handling: console.error('Failed to generate image', error)
          console.log(error)
        }
      })
  }

  const generateAndSaveImage =
  function (dataUrl, minWidth, someHeight) {
    const img = new Image()
    img.onload = function () {
      const cropMargin = {
        left: 20 * imageScaling,
        right: 10 * imageScaling,
        top: 10 * imageScaling,
        bottom: 25 * imageScaling,
      }

      const chartWidth = img.width
      const canvasHeight = img.height // + someHeight

      const canvasChartSelection = d3.select('body').append('canvas')
        .attr('width', chartWidth)
        .attr('height', canvasHeight)
        .style('visibility', 'visible')
        .style('border', 'solid 1px black')

      const canvasChart = canvasChartSelection.node()
      const ctx = canvasChart.getContext('2d')

      let watermarkText = dax.text('user_profile.image.watermark')
      const date = new Date()
      watermarkText = watermarkText.replace(
        '{date}',
        date.getFullYear() + '-' +
        ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
        ('0' + date.getDate()).slice(-2))

      const sourceFontHeight = 11 * imageScaling
      ctx.font = sourceFontHeight + 'px "Varta"'
      const sourceTextWidth = ctx.measureText(watermarkText).width

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, chartWidth, canvasHeight)
      ctx.fillStyle = 'black'

      ctx.drawImage(img, 0, 0)

      const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data
      let firstRowWithColor = -1
      for (let y = 0; y < ctx.canvas.height && firstRowWithColor === -1; y++) {
        for (let x = 0; x < ctx.canvas.width && firstRowWithColor === -1; x++) {
          const pixelIndex = (y * ctx.canvas.width + x) * 4
          if (data[pixelIndex] !== 255 || data[pixelIndex + 1] !== 255 || data[pixelIndex + 2] !== 255 || data[pixelIndex + 3] !== 255) {
            firstRowWithColor = y
          }
        }
      }

      let lastRowWithColor = -1
      for (let y = ctx.canvas.height - 1; y >= 0 && lastRowWithColor === -1; y--) {
        for (let x = 0; x < ctx.canvas.width && lastRowWithColor === -1; x++) {
          const pixelIndex = (y * ctx.canvas.width + x) * 4
          if (data[pixelIndex] !== 255 || data[pixelIndex + 1] !== 255 || data[pixelIndex + 2] !== 255 || data[pixelIndex + 3] !== 255) {
            lastRowWithColor = y
          }
        }
      }

      let firstColumnWithColor = -1
      for (let x = 0; x < ctx.canvas.width && firstColumnWithColor === -1; x++) {
        for (let y = 0; y < ctx.canvas.height && firstColumnWithColor === -1; y++) {
          const pixelIndex = (y * ctx.canvas.width + x) * 4
          if (data[pixelIndex] !== 255 || data[pixelIndex + 1] !== 255 || data[pixelIndex + 2] !== 255 || data[pixelIndex + 3] !== 255) {
            firstColumnWithColor = x
          }
        }
      }

      let lastColumnWithColor = -1
      for (let x = ctx.canvas.width - 1; x >= 0 && lastColumnWithColor === -1; x--) {
        for (let y = 0; y < ctx.canvas.height && lastColumnWithColor === -1; y++) {
          const pixelIndex = (y * ctx.canvas.width + x) * 4
          if (data[pixelIndex] !== 255 || data[pixelIndex + 1] !== 255 || data[pixelIndex + 2] !== 255 || data[pixelIndex + 3] !== 255) {
            lastColumnWithColor = x
          }
        }
      }

      const cropWidth = lastColumnWithColor - firstColumnWithColor
      const cropHeight = lastRowWithColor - firstRowWithColor
      const cropCanvas = document.createElement('canvas')
      const cropCanvasWidth = Math.max(cropWidth, sourceTextWidth) + cropMargin.left + cropMargin.right
      const cropCanvasHeight = cropHeight + cropMargin.top + cropMargin.bottom
      const cropContext = cropCanvas.getContext('2d')
      cropCanvas.width = cropCanvasWidth
      cropCanvas.height = cropCanvasHeight
      cropContext.fillStyle = 'white'
      cropContext.fillRect(0, 0, cropCanvasWidth, cropCanvasHeight)
      cropContext.drawImage(
        canvasChart,
        firstColumnWithColor, firstRowWithColor, cropWidth, cropHeight,
        cropMargin.left, cropMargin.top, cropWidth, cropHeight) // newCanvas, same size as source rect

      cropContext.fillStyle = '#555'
      cropContext.font = sourceFontHeight + 'px "Varta"'
      cropContext.fillText(watermarkText, cropMargin.left / 2, cropCanvasHeight - 6 * imageScaling)

      cropCanvas.toBlob(function (blob) {
        saveAs(blob, dax.text('user_profile.grid.image.filename') + '.png')
      })

      canvasChartSelection.remove()
    }
    img.src = dataUrl
  }
})(window.dax = window.dax || {})
