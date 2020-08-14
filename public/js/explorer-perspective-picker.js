(function (namespace) {
  namespace.explorer = namespace.explorer || {}
  const exports = namespace.explorer

  let initialized = false
  let selectedPerspectiveID = null
  let perspectiveIDs
  const perspectiveColumns = {}
  let selectedOptions = new Set()
  // TODO unused: let hasTotal = false
  let totalSelected = false
  let hasRemainder = false
  let collapsed = true
  let fixedWidth = null

  let settings

  let combinedColumnOneHighlight = -1
  let combinedColumnTwoHighlight = -1

  document.addEventListener('DOMContentLoaded', function (e) {
    d3.select('body').append('img')
      .classed('img-preload', true)
      .attr('src', './img/perspective-checkbox-empty.png')
  })

  exports.perspectiveSetQueryDefinition = function (perspectiveID, perspectiveOptionsIntArray, total) {
    if (!dax.data.isExplorerPerspective(perspectiveID)) { return } // TODO log error?
    // selectedPerspective = perspectiveIndex // TODO validate data?
    setSelectedPerspective(perspectiveID)
    // Remap options from array of ints to array of bools
    selectedOptions = new Set()
    perspectiveOptionsIntArray.forEach(function (opt) { selectedOptions.add(opt) })
    totalSelected = total
    if (initialized) {
      updateCheckboxes(false)
    }
  }

  exports.generatePerspectivePicker = function (settingsInput) {
    settings = settingsInput

    d3.select('.perspective-header')
      .text(dax.text('perspectivesHeader')) // TODO use new text ID style

    perspectiveIDs = dax.data.getExplorerPerspectiveIDs()

    // Generate data structure for all perspectives
    perspectiveIDs.forEach(function (perspectiveID) {
      const optionCount = dax.data.getQuestionOptionCount(perspectiveID)
      const firstColumnData = []
      const secondColumnData = []
      const thirdColumnData = []
      if (!dax.data.isCombinedPerspective(perspectiveID)) {
        // BASIC PERSPECTIVE
        const perColumnSetting = settings.perspectiveCheckboxesPerColumn
        const maxColumns = 3
        const columns = Math.min(maxColumns, Math.ceil(optionCount / perColumnSetting))
        const perColumn = Math.ceil(optionCount / columns)
        for (let i = 0; i < optionCount; i++) {
          const option = {
            index: i,
            text: dax.data.getQuestionOptionText(perspectiveID, i),
          }
          if (i < perColumn) {
            firstColumnData.push(option)
          } else if (i < perColumn * 2) {
            secondColumnData.push(option)
          } else {
            thirdColumnData.push(option)
          }
        }
      } else {
        // COMBINED PERSPECTIVE
        for (let i = 0; i < optionCount; i++) {
          const option = {
            index: i,
            isExpandable: dax.data.hasPerspectiveOptionChildren(perspectiveID, i),
            text: dax.data.getQuestionOptionText(perspectiveID, i),
          }
          switch (dax.data.getPerspectiveOptionTreeDepth(perspectiveID, i)) {
          case 0:
            firstColumnData.push(option)
            break
          case 1:
            option.parent = dax.data.getPerspectiveOptionParent(perspectiveID, i)
            secondColumnData.push(option)
            break
          case 2:
            option.parent = dax.data.getPerspectiveOptionParent(perspectiveID, i)
            thirdColumnData.push(option)
            break
          }
        }
      }
      perspectiveColumns[perspectiveID] = {
        firstColumnData: firstColumnData,
        secondColumnData: secondColumnData,
        thirdColumnData: thirdColumnData,
      }
    })

    d3.select('.pervarpicker-variables')
      .selectAll('.pervarpicker-varoption')
      .data(perspectiveIDs)
      .enter()
        .append('div')
        .classed('pervarpicker-varoption', true)
        .classed('no-select', true)
        .on('click', function (perspectiveID) { setSelectedPerspective(perspectiveID) })
        .text(function (perspectiveID) { return dax.data.getQuestionShortText(perspectiveID) })

    d3.selectAll('.peropt-all-button')
      .on('click', function () {
        for (let i = 0; i < dax.data.getQuestionOptionCount(selectedPerspectiveID); i++) {
          selectedOptions.add(i)
        }
        updateCheckboxes(true)
      })
      .text(dax.text('perspectivesAllButton')) // TODO use new text ID style

    d3.selectAll('.peropt-none-button')
      .on('click', function () {
        selectedOptions.clear()
        updateCheckboxes(true)
      })
      .text(dax.text('perspectivesNoneButton')) // TODO use new text ID style

    d3.selectAll('.peropt-more-button')
      .text(collapsed ? dax.text('perspectivesMoreButton') + '>' : '<' + dax.text('perspectivesLessButton')) // TODO use new text ID style
      .style('visibility', function () {
        return hasRemainder ? null : 'hidden'
      })
      .on('click', function () {
        collapsed = !collapsed
        if (collapsed) {
          fixedWidth = null
        } else {
          fixedWidth = d3.select('.perspective-picker').node().offsetWidth
        }
        updateElements()
      })

    initializeSelection()
    initialized = true
  }

  exports.getSelectedPerspective = function () {
    return selectedPerspectiveID
  }

  exports.getSelectedPerspectiveOptions = function () {
    const optionsNested = dax.data.getPerspectiveOptionIndicesNestedOrder(selectedPerspectiveID)
    return optionsNested.filter(function (optionIndex) {
      return selectedOptions.has(optionIndex)
    })
  }

  exports.isPerspectiveTotalSelected = function () {
    return totalSelected
  }

  function initializeSelection () {
    if (!selectedPerspectiveID) {
      setSelectedPerspective(dax.data.getExplorerPerspectiveIDs()[0])
    } else {
      setSelectedPerspective(selectedPerspectiveID)
    }
  }

  function setSelectedPerspective (perspectiveID) {
    if (!dax.data.isExplorerPerspective(perspectiveID)) { return } // TODO log error?
    const changed = selectedPerspectiveID !== perspectiveID
    selectedPerspectiveID = perspectiveID

    if (changed) {
      const topLevelOptionCount = dax.data.getTopLevelQuestionOptionCount(selectedPerspectiveID)
      const selectedCount = Math.min(topLevelOptionCount, settings.defaultSelectedPerspectiveOptions)
      selectedOptions.clear()
      for (let i = 0; i < selectedCount; i++) {
        selectedOptions.add(i)
      }
      setSelectedColumnOneHighlight(0)
    }
    updateCheckboxes(changed && initialized)
  }

  function setSelectedColumnOneHighlight (index) {
    combinedColumnOneHighlight = index
    combinedColumnTwoHighlight = dax.data.getPerspectiveOptionFirstChild(selectedPerspectiveID, combinedColumnOneHighlight)
    updateColumnHighlights()
  }

  function setSelectedColumnTwoHighlight (index) {
    combinedColumnTwoHighlight = index
    updateColumnHighlights()
  }

  function updateColumnHighlights () {
    const visibleSecondColElementCount = dax.data.getPerspectiveOptionChildCount(selectedPerspectiveID, combinedColumnOneHighlight)
    d3.select('.peropt-col-two')
      .classed('peropt-col-collapsed', visibleSecondColElementCount === 0)
    const visibleThirdColElementCount = dax.data.getPerspectiveOptionChildCount(selectedPerspectiveID, combinedColumnTwoHighlight)
    d3.select('.peropt-col-three')
      .classed('peropt-col-collapsed', visibleThirdColElementCount === 0)
  }

  function updateCheckboxes (fireUpdateEvent) {
    d3.selectAll('.pervarpicker-varoption')
      .classed('pervarpicker-varoption-selected', function (d) { return d === selectedPerspectiveID })

    const optionCount = dax.data.getQuestionOptionCount(selectedPerspectiveID)
    // const showSelectTotal = settings.showSelectTotal
    // const totalCount = (showSelectTotal ? 1 : 0)
    hasRemainder = true // TODO don't use remainder system, instead show alternative options
    // d3.select('.peropt-extra-columns')
    //   .style('width', '0px')

    if (dax.data.isCombinedPerspective(selectedPerspectiveID)) {
      // COMBINED PERSPECTIVE
      hasRemainder = false

      // First column combined
      const firstColOptions = d3.select('.peropt-col-one')
        .selectAll('.peropt-checkbox')
        .data(perspectiveColumns[selectedPerspectiveID].firstColumnData)

      firstColOptions.exit().remove()

      firstColOptions.enter()
        .append('div')
          .classed('peropt-checkbox', true)
          .on('click', function (d) {
            if (selectedOptions.has(d.index)) {
              selectedOptions.delete(d.index)
            } else {
              selectedOptions.add(d.index)
            }
            updateCheckboxes(true)
          })

      const firstColElements = d3.select('.peropt-col-one').selectAll('.peropt-checkbox')
        .classed('peropt-checkbox-combined', true)
        .classed('peropt-checkbox-expandable', function (d) { return d.isExpandable })
        .classed('peropt-checkbox-selected', function (d) { return selectedOptions.has(d.index) })
        .classed('peropt-checkbox-expanded', function (d, i) { return i === combinedColumnOneHighlight })
        .text('')
        .attr('title', function (d) { return d.text })
        .on('mouseover', function (d, i, elements) {
          if (combinedColumnOneHighlight !== d.index) {
            // Highlights
            setSelectedColumnOneHighlight(d.index)
            // Update shown and expanded checkboxes
            d3.selectAll(elements)
              .classed('peropt-checkbox-expanded', function (dd, j) {
                return dd.isExpandable && dd.index === combinedColumnOneHighlight
              })
            d3.selectAll('.peropt-col-two > .peropt-checkbox')
              .classed('peropt-checkbox-expanded', function (dd, j) {
                return dd.isExpandable && dd.index === combinedColumnTwoHighlight
              })
              .classed('peropt-checkbox-hidden', function (dd, i) {
                return dd.parent === combinedColumnOneHighlight ? null : 'none'
              })
            d3.selectAll('.peropt-col-three > .peropt-checkbox')
              .classed('peropt-checkbox-hidden', function (dd, i) {
                return dd.parent === combinedColumnTwoHighlight ? null : 'none'
              })
          }
        })

      firstColElements.append('span')
        .classed('peropt-checkbox-text', true)
        .text(function (d) { return d.text })

      firstColElements.append('span')
        .classed('peropt-checkbox-expand', true)
        .classed('no-select', true)
        .style('display', function (d) { return d.isExpandable ? null : 'none' })
        .text('▶')

      // move bottom padding to the bottom of the column
      d3.select('.peropt-col-one > .peropt-col__bottom-padding').raise()

      // Second column combined
      // d3.select('.peropt-columns').append(function () {
      //   return d3.select('.peropt-col-two').remove().node()
      // })
      // d3.select('.peropt-extra-columns')
      //   .style('display', 'none')
      d3.select('.peropt-col-two')
        .classed('peropt-col-two-combined', true)
      const secondColOptions = d3.select('.peropt-col-two')
        .selectAll('.peropt-checkbox')
        .data(perspectiveColumns[selectedPerspectiveID].secondColumnData)

      secondColOptions.exit().remove()

      secondColOptions.enter()
        .append('div')
          .classed('peropt-checkbox', true)
          .on('click', function (d) {
            if (selectedOptions.has(d.index)) {
              selectedOptions.delete(d.index)
            } else {
              selectedOptions.add(d.index)
            }
            updateCheckboxes(true)
          })

      const secondColElements = d3.select('.peropt-col-two').selectAll('.peropt-checkbox')
        .classed('peropt-checkbox-combined', true)
        .classed('peropt-checkbox-expandable', function (d) { return d.isExpandable })
        .classed('peropt-checkbox-selected', function (d) { return selectedOptions.has(d.index) })
        .classed('peropt-checkbox-expanded', function (d) { return d.isExpandable && d.index === combinedColumnTwoHighlight })
        .classed('peropt-checkbox-hidden', function (d) { return d.parent === combinedColumnOneHighlight ? null : 'none' })
        .text('')
        .attr('title', function (d) { return d.text })
        .on('mouseover', function (d, i, elements) {
          if (combinedColumnOneHighlight !== d.index) {
            // Highlights
            setSelectedColumnTwoHighlight(d.index)
            // Update shown and expanded checkboxes
            d3.selectAll(elements)
              .classed('peropt-checkbox-expanded', function (d) { return d.isExpandable && d.index === combinedColumnTwoHighlight })
              .classed('peropt-checkbox-hidden', function (dd, i) { return dd.parent === combinedColumnOneHighlight ? null : 'none' })
            const visibleThirdColElementCount = dax.data.getPerspectiveOptionChildCount(selectedPerspectiveID, combinedColumnTwoHighlight)
            d3.select('.peropt-col-three')
              .classed('peropt-col-collapsed', visibleThirdColElementCount === 0)
            d3.selectAll('.peropt-col-three > .peropt-checkbox')
              .classed('peropt-checkbox-hidden', function (dd, i) { return dd.parent === combinedColumnTwoHighlight ? null : 'none' })
          }
        })

      secondColElements.append('span')
        .classed('peropt-checkbox-text', true)
        .text(function (d) { return d.text })
      secondColElements.append('span')
        .classed('peropt-checkbox-expand', true)
        .classed('no-select', true)
        .style('display', function (d) { return d.isExpandable ? null : 'none' })
        .text('▶')

      // move bottom padding to the bottom of the column
      d3.select('.peropt-col-two > .peropt-col__bottom-padding').raise()

      // Third column combined
      // d3.select('.peropt-columns').append(function () {
      //   return d3.select('.peropt-col-three').remove().node()
      // })
      d3.select('.peropt-col-three')
        .classed('peropt-col-three-combined', true)
      const thirdColOptions = d3.select('.peropt-col-three')
        .selectAll('.peropt-checkbox')
        .data(perspectiveColumns[selectedPerspectiveID].thirdColumnData)

      thirdColOptions.exit().remove()

      thirdColOptions.enter()
        .append('div')
          .classed('peropt-checkbox', true)
          .on('click', function (d) {
            if (selectedOptions.has(d.index)) {
              selectedOptions.delete(d.index)
            } else {
              selectedOptions.add(d.index)
            }
            updateCheckboxes(true)
          })

      const thirdColElements = d3.select('.peropt-col-three').selectAll('.peropt-checkbox')
        .classed('peropt-checkbox-selected', function (d) { return selectedOptions.has(d.index) })
        .classed('peropt-checkbox-hidden', function (d) { return d.parent === combinedColumnTwoHighlight ? null : 'none' })
        .text('')
        .attr('title', function (d) { return d.text })
      thirdColElements.append('span')
        .classed('peropt-checkbox-text', true)
        .text(function (d) { return d.text })
    } else {
      // BASIC PERSPECTIVE
      const perColumnSetting = settings.perspectiveCheckboxesPerColumn
      const maxColumns = 3
      const columns = Math.min(maxColumns, Math.ceil(optionCount / perColumnSetting))

      hasRemainder = columns > 1
      if (collapsed) {
        d3.select('.peropt-extra-columns')
          .style('width', '0px')
      }
      if (!hasRemainder) {
        collapsed = true
      }

      // TODO add total

      // First column basic
      const firstColOptions = d3.select('.peropt-col-one')
        .selectAll('.peropt-checkbox')
        .classed('peropt-checkbox-combined', false)
        .classed('peropt-checkbox-expandable', false)
        .classed('peropt-checkbox-expanded', false)
        .on('mouseover', function () {})
        .data(perspectiveColumns[selectedPerspectiveID].firstColumnData)

      firstColOptions.exit().remove()

      firstColOptions.enter()
        .append('div')
          .classed('peropt-checkbox', true)
          .on('click', function (d) {
            if (selectedOptions.has(d.index)) {
              selectedOptions.delete(d.index)
            } else {
              selectedOptions.add(d.index)
            }
            updateCheckboxes(true)
          })

      d3.select('.peropt-col-one').selectAll('.peropt-checkbox')
        .classed('peropt-checkbox-selected', function (d) { return selectedOptions.has(d.index) })
        .text(function (d) { return d.text })
        .attr('title', function (d) { return d.text })

      // Second column basic
      d3.select('.peropt-extra-columns').append(function () {
        return d3.select('.peropt-col-two').remove().node()
      })
      d3.select('.peropt-col-two')
        .classed('peropt-col-two-combined', false)
      const secondColOptions = d3.select('.peropt-col-two')
        .selectAll('.peropt-checkbox')
        .data(perspectiveColumns[selectedPerspectiveID].secondColumnData)

      secondColOptions.exit().remove()

      secondColOptions.enter()
        .append('div')
          .classed('peropt-checkbox', true)
          .on('click', function (d) {
            if (selectedOptions.has(d.index)) {
              selectedOptions.delete(d.index)
            } else {
              selectedOptions.add(d.index)
            }
            updateCheckboxes(true)
          })

      d3.select('.peropt-col-two').selectAll('.peropt-checkbox')
        .classed('peropt-checkbox-selected', function (d) { return selectedOptions.has(d.index) })
        .text(function (d) { return d.text })
        .attr('title', function (d) { return d.text })

      // Third column basic
      d3.select('.peropt-extra-columns').append(function () {
        return d3.select('.peropt-col-three').remove().node()
      })
      d3.select('.peropt-extra-columns').style('display', null)
      d3.select('.peropt-col-three')
        .classed('peropt-col-three-combined', false)
      const thirdColOptions = d3.select('.peropt-col-three')
        .selectAll('.peropt-checkbox')
        .data(perspectiveColumns[selectedPerspectiveID].thirdColumnData)

      thirdColOptions.exit().remove()

      thirdColOptions.enter()
        .append('div')
          .classed('peropt-checkbox', true)
          .on('click', function (d) {
            if (selectedOptions.has(d.index)) {
              selectedOptions.delete(d.index)
            } else {
              selectedOptions.add(d.index)
            }
            updateCheckboxes(true)
          })

      d3.select('.peropt-col-three').selectAll('.peropt-checkbox')
        .classed('peropt-checkbox-selected', function (d) { return selectedOptions.has(d.index) })
        .text(function (d) { return d.text })
        .attr('title', function (d) { return d.text })

      // let hasCheckedBox = false
      // for (i = 0; i < selectedOptions.length; i++) {
      //   if (selectedOptions[i]) {
      //     hasCheckedBox = true
      //     break
      //   }
      // }
    }

    if (fireUpdateEvent) { //  TODO removed update limiter: && hasCheckedBox
      // TODO replace with callback to js page handler
      // gwtPerspectiveCallback();
      dax.explorer.selectionUpdateCallback()
    }

    // hack to handle IE display bugs
    const isIE = !!navigator.userAgent.match(/Trident/g) || !!navigator.userAgent.match(/MSIE/g)
    if (isIE) {
      const optionsHeight = Math.max(
        d3.select('.pervarpicker-border-wrapper').node().offsetHeight,
        62 + 24 * perspectiveColumns[selectedPerspectiveID].firstColumnData.length)
      d3.select('.perspective-options')
        .style('height', optionsHeight + 'px')
    }

    updateElements()
  }

  function updateElements () {
    d3.select('.perspective-picker')
      .style('width', fixedWidth + 'px')

    d3.select('.peropt-more-button')
      .style('display', function () {
        return dax.data.isCombinedPerspective(selectedPerspectiveID) && hasRemainder ? null : 'none'
      })
      .text(collapsed ? 'Visa fler >' : '< Visa färre ') // TODO externalize texts

    d3.select('.peropt-bottom-padding')
      .style('height', function () {
        if (hasRemainder) {
          return null
        } else if (dax.data.isCombinedPerspective(selectedPerspectiveID)) {
          return '4px'
        } else {
          return '0px'
        }
      })

    d3.select('.description-panel')
      .interrupt().transition()
        .style('color', collapsed ? 'black' : 'hsl(0, 0%, 70%)')

    d3.select('.peropt-extra-columns')
      .interrupt().transition()
        .style('opacity', collapsed && !dax.data.isCombinedPerspective(selectedPerspectiveID) ? 0 : 1)
        .style('width', collapsed && !dax.data.isCombinedPerspective(selectedPerspectiveID) ? '0px' : null)
  }
})(window.dax = window.dax || {})
