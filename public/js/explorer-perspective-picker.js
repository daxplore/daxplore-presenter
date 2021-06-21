(function (namespace) {
  namespace.explorer = namespace.explorer || {}
  const exports = namespace.explorer

  let initialized = false
  let selectedPerspectiveID = null
  let selectedSecondaryPerspectiveID = null

  let perspectiveIDs
  const perspectiveColumns = {}
  let secondaryPerspectives
  let selectedOptions = new Set()
  // TODO unused: let hasTotal = false
  let totalSelected = false
  let hasRemainder = false
  let collapsed = true

  let settings

  let moreButton, columnOne, columnTwo, columnThree, secondaryPanel

  let combinedColumnOneHighlight = -1
  let combinedColumnTwoHighlight = -1

  // TODO use feature testing instead
  const isIE = !!navigator.userAgent.match(/Trident/g) || !!navigator.userAgent.match(/MSIE/g)

  document.addEventListener('DOMContentLoaded', function (e) {
    d3.select('body').append('img')
      .classed('img-preload', true)
      .attr('src', './img/perspective-checkbox-empty.png')
  })

  exports.perspectiveSetQueryDefinition =
  function (perspectiveID, perspectiveSecondaryID, perspectiveOptionsIntArray, total) {
    // When perspectiveID is null, reset the perspective picker to the default state
    if (perspectiveID === null) {
      setSelectedPerspective(dax.data.getExplorerPrimaryPerspectiveIDs()[0], true)
      return
    }
    if (!dax.data.isExplorerPrimaryPerspective(perspectiveID)) {
      console.warn('Not a valid primary perspective:', perspectiveID)
      return
    }

    if (perspectiveSecondaryID !== null && !dax.data.isExplorerSecondaryPerspective(perspectiveSecondaryID)) {
      console.warn('Not a valid secondary perspective:', perspectiveSecondaryID)
      return
    }

    setSelectedPerspective(perspectiveID, false)
    setSelectedSecondaryPerspective(perspectiveSecondaryID)

    // Remap options from array of ints to array of bools
    selectedOptions = new Set()
    perspectiveOptionsIntArray.forEach(function (opt) { selectedOptions.add(opt) })
    totalSelected = total
    if (initialized) {
      updateElements()
    }
  }

  exports.generatePerspectivePicker =
  function (settingsInput) {
    settings = settingsInput

    moreButton = d3.selectAll('.peropt-more-button')
    columnOne = d3.select('.peropt-col-one')
    columnTwo = d3.select('.peropt-col-two')
    columnThree = d3.select('.peropt-col-three')
    secondaryPanel = d3.select('.perspective-secondary-picker')

    d3.select('.perspective-header')
      .text(dax.text('explorer.perspective.header'))

    d3.select('.perspective-secondary-title')
      .text(dax.text('explorer.perspective.header_secondary'))

    perspectiveIDs = dax.data.getExplorerPrimaryPerspectiveIDs()

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

    // SECONDARY PERSPECTIVE
    secondaryPerspectives = [{ type: 'none' }]
    const secondaryPerspectiveIDs = dax.data.getExplorerSecondaryPerspectiveIDs()
    secondaryPerspectiveIDs.forEach(function (perspectiveID) {
      secondaryPerspectives.push({ type: 'perspective', id: perspectiveID })
    })

    d3.select('.pervarpicker-variables')
      .selectAll('.pervarpicker-varoption')
      .data(perspectiveIDs)
      .enter()
        .append('div')
        .classed('pervarpicker-varoption', true)
        .classed('no-select', true)
        .on('click', function (perspectiveID) {
          setSelectedPerspective(perspectiveID, false)
          dax.explorer.selectionUpdateCallback(true)
        })
        .text(function (perspectiveID) { return dax.data.getQuestionShortText(perspectiveID) })

    d3.selectAll('.peropt-all-button')
      .on('click', function () {
        for (let i = 0; i < dax.data.getQuestionOptionCount(selectedPerspectiveID); i++) {
          selectedOptions.add(i)
        }
        updateElements()
        dax.explorer.selectionUpdateCallback(true)
      })
      .text(dax.text('perspectivesAllButton')) // TODO use new text ID style

    d3.selectAll('.peropt-none-button')
      .on('click', function () {
        selectedOptions.clear()
        updateElements()
        dax.explorer.selectionUpdateCallback(true)
      })
      .text(dax.text('perspectivesNoneButton')) // TODO use new text ID style

    moreButton
      .text(collapsed ? dax.text('perspectivesMoreButton') + '>' : '<' + dax.text('perspectivesLessButton')) // TODO use new text ID style
      .style('visibility', function () {
        return hasRemainder ? null : 'hidden'
      })
      .on('click', function () {
        collapsed = !collapsed
        const fixedWidth = collapsed ? null : d3.select('.perspective-picker').node().offsetWidth
        d3.select('.perspective-picker')
          .style('width', fixedWidth + 'px')
      })

    // Secondary perspective panel
    secondaryPanel.style('display', secondaryPerspectives.length === 0 ? 'none' : null)
    const secondaryButtons = secondaryPanel.selectAll('.peropt-second-button').data(secondaryPerspectives)

    secondaryButtons.enter()
      .append('div')
        .classed('peropt-second-button peropt-second-button dashed-button perspective-button', true)
        .text(function (d) {
          switch (d.type) {
          case 'perspective': return dax.data.getQuestionShortText(d.id)
          case 'none':return dax.text('explorer.perspective.secondary_none_button')
          }
        })
        .on('click', function (d) {
          setSelectedSecondaryPerspective(d.type === 'perspective' ? d.id : null)
          dax.explorer.selectionUpdateCallback(true)
        })

    if (!selectedPerspectiveID) {
      setSelectedPerspective(dax.data.getExplorerPrimaryPerspectiveIDs()[0], false)
    } else {
      setSelectedPerspective(selectedPerspectiveID, false)
    }

    initialized = true
  }

  exports.getSelectedPerspectives =
  function () {
    const perspectives = [selectedPerspectiveID]
    if (selectedSecondaryPerspectiveID !== null && selectedPerspectiveID !== selectedSecondaryPerspectiveID) {
      perspectives.push(selectedSecondaryPerspectiveID)
    }
    return perspectives
  }

  exports.getSelectedPerspectiveOptions =
  function () {
    const optionsNested = dax.data.getPerspectiveOptionIndicesNestedOrder(selectedPerspectiveID)
    return optionsNested.filter(function (optionIndex) {
      return selectedOptions.has(optionIndex)
    })
  }

  // Combines primary and secondary perspective (if selected) into a single option array
  exports.getSelectedPerspectiveOptionsCombined =
  function () {
    const options = exports.getSelectedPerspectiveOptions()
    if (selectedSecondaryPerspectiveID === null || selectedPerspectiveID === selectedSecondaryPerspectiveID) {
      return options
    }
    const secondPerspectiveOptionCount = dax.data.getQuestionOptionCount(selectedSecondaryPerspectiveID)
    const combinedOptions = []
    options.forEach(function (opt1) {
      for (let opt2 = 0; opt2 < secondPerspectiveOptionCount; opt2++) {
        combinedOptions.push(opt1 * secondPerspectiveOptionCount + opt2)
      }
    })
    return combinedOptions
  }

  exports.isPerspectiveTotalSelected =
  function () {
    return totalSelected
  }

  function setSelectedColumnOneHighlight (index) {
    combinedColumnOneHighlight = index
    combinedColumnTwoHighlight = dax.data.getPerspectiveOptionFirstChild(selectedPerspectiveID, combinedColumnOneHighlight)
    updateColumnCollapse()
  }

  function setSelectedColumnTwoHighlight (index) {
    combinedColumnTwoHighlight = index
    updateColumnCollapse()
  }

  function updateColumnCollapse () {
    // Collapse second column, if empty
    const visibleSecondColElementCount = dax.data.getPerspectiveOptionChildCount(selectedPerspectiveID, combinedColumnOneHighlight)
    columnTwo.classed('peropt-col-collapsed', visibleSecondColElementCount === 0)

    // Collapse third column, if empty
    const visibleThirdColElementCount = dax.data.getPerspectiveOptionChildCount(selectedPerspectiveID, combinedColumnTwoHighlight)
    columnThree.classed('peropt-col-collapsed', visibleThirdColElementCount === 0)

    // Double flex size of column two if column three is collapsed
    const hasThirdColumnElements = perspectiveColumns[selectedPerspectiveID].thirdColumnData.length > 0
    columnTwo.style('flex', hasThirdColumnElements && visibleThirdColElementCount === 0 ? 2 : null)
  }

  function toggleOption (option) {
    if (selectedOptions.has(option.index)) {
      selectedOptions.delete(option.index)
    } else {
      selectedOptions.add(option.index)
    }
    updateElements()
    dax.explorer.selectionUpdateCallback(true)
  }

  function setSelectedPerspective (perspectiveID, forceUpdate) {
    if (!dax.data.isExplorerPrimaryPerspective(perspectiveID)) {
      throw new Error('Perspective does not exist: ' + perspectiveID)
    }
    const changed = selectedPerspectiveID !== perspectiveID || forceUpdate
    selectedPerspectiveID = perspectiveID

    if (changed) {
      d3.selectAll('.pervarpicker-varoption')
        .classed('pervarpicker-varoption-selected', function (d) { return d === selectedPerspectiveID })

      const topLevelOptionCount = dax.data.getTopLevelQuestionOptionCount(selectedPerspectiveID)
      const selectedCount = Math.min(topLevelOptionCount, settings.defaultSelectedPerspectiveOptions)
      selectedOptions.clear()
      for (let i = 0; i < selectedCount; i++) {
        selectedOptions.add(i)
      }
      setSelectedColumnOneHighlight(0)

      if (!dax.data.isCombinedPerspective(selectedPerspectiveID)) {
        // BASIC PERSPECTIVE
        const perColumnSetting = settings.perspectiveCheckboxesPerColumn
        const maxColumns = 3
        const optionCount = dax.data.getQuestionOptionCount(selectedPerspectiveID)
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
        const firstColOptions = columnOne.selectAll('.peropt-checkbox')
          .attr('class', 'peropt-checkbox')
          .on('mouseover', function () {})
          .data(perspectiveColumns[selectedPerspectiveID].firstColumnData)

        firstColOptions.exit().remove()

        firstColOptions.enter()
          .append('div')
            .classed('peropt-checkbox', true)
            .on('click', toggleOption)

        columnOne.selectAll('.peropt-checkbox')
          .text('')
          .append('span')
            .classed('peropt-checkbox-text', true)
            .text(function (d) { return d.text })

        // Second column basic
        columnTwo
          .classed('peropt-col-two-combined', false)
          .classed('peropt-col-collapsed', perspectiveColumns[selectedPerspectiveID].secondColumnData.length === 0)

        const secondColOptions = columnTwo.selectAll('.peropt-checkbox')
          .attr('class', 'peropt-checkbox')
          .on('mouseover', function () {})
          .data(perspectiveColumns[selectedPerspectiveID].secondColumnData)

        secondColOptions.exit().remove()

        secondColOptions.enter()
          .append('div')
            .classed('peropt-checkbox', true)
            .on('click', toggleOption)

        columnTwo.selectAll('.peropt-checkbox')
          .text('')
          .append('span')
            .classed('peropt-checkbox-text', true)
            .text(function (d) { return d.text })

        // Third column basic
        d3.select('.peropt-extra-columns').style('display', null)
        columnThree
          .classed('peropt-col-three-combined', false)
          .classed('peropt-col-collapsed', perspectiveColumns[selectedPerspectiveID].thirdColumnData.length === 0)

        const thirdColOptions = columnThree.selectAll('.peropt-checkbox')
          .attr('class', 'peropt-checkbox')
          .on('mouseover', function () {})
          .data(perspectiveColumns[selectedPerspectiveID].thirdColumnData)

        thirdColOptions.exit().remove()

        thirdColOptions.enter()
          .append('div')
            .classed('peropt-checkbox', true)
            .on('click', toggleOption)

        columnThree.selectAll('.peropt-checkbox')
          .text('')
          .append('span')
            .classed('peropt-checkbox-text', true)
            .text(function (d) { return d.text })

        // move bottom padding elements to the bottom of the column
        d3.selectAll('.peropt-col__bottom-padding').raise()

        d3.select('.peropt-bottom-padding')
          .style('height', '5px')

        // let hasCheckedBox = false
        // for (i = 0; i < selectedOptions.length; i++) {
        //   if (selectedOptions[i]) {
        //     hasCheckedBox = true
        //     break
        //   }
        // }
      } else {
        // COMBINED PERSPECTIVE
        hasRemainder = false

        // First column combined
        const firstColOptions = columnOne
          .selectAll('.peropt-checkbox')
          .data(perspectiveColumns[selectedPerspectiveID].firstColumnData)

        firstColOptions.exit().remove()

        firstColOptions.enter()
          .append('div')
            .classed('peropt-checkbox', true)
            .on('click', toggleOption)

        const firstColElements = columnOne.selectAll('.peropt-checkbox')
          .attr('class', function (d, i) {
            return 'peropt-checkbox peropt-checkbox-combined' +
            (d.isExpandable ? ' peropt-checkbox-combined' : '') +
            (i === combinedColumnOneHighlight ? ' peropt-checkbox-expanded' : '')
          })
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
          .classed('peropt-checkbox-expand no-select', true)
          .style('display', function (d) { return d.isExpandable ? null : 'none' })
          .text('▶')

        // Second column combined
        // d3.select('.peropt-columns').append(function () {
        //   return columnTwo.remove().node()
        // })
        // d3.select('.peropt-extra-columns')
        //   .style('display', 'none')
        columnTwo
          .classed('peropt-col-two-combined', true)
        const secondColOptions = columnTwo
          .selectAll('.peropt-checkbox')
          .data(perspectiveColumns[selectedPerspectiveID].secondColumnData)

        secondColOptions.exit().remove()

        secondColOptions.enter()
          .append('div')
            .classed('peropt-checkbox', true)
            .on('click', toggleOption)

        const secondColElements = columnTwo.selectAll('.peropt-checkbox')
          .attr('class', function (d, i) {
            return 'peropt-checkbox peropt-checkbox-combined' +
            (d.isExpandable ? ' peropt-checkbox-expandable' : '') +
            (d.isExpandable && d.index === combinedColumnTwoHighlight ? ' peropt-checkbox-expanded' : '') +
            (d.parent !== combinedColumnOneHighlight ? ' peropt-checkbox-hidden' : '')
          })
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
              columnThree
                .classed('peropt-col-collapsed', visibleThirdColElementCount === 0)
              d3.selectAll('.peropt-col-three > .peropt-checkbox')
                .classed('peropt-checkbox-hidden', function (dd, i) { return dd.parent === combinedColumnTwoHighlight ? null : 'none' })
            }
          })

        secondColElements.append('span')
          .classed('peropt-checkbox-text', true)
          .text(function (d) { return d.text })
        secondColElements.append('span')
          .attr('class', 'peropt-checkbox-expand no-select')
          .style('display', function (d) { return d.isExpandable ? null : 'none' })
          .text('▶')

        // Third column combined
        // d3.select('.peropt-columns').append(function () {
        //   return columnThree.remove().node()
        // })
        columnThree
          .classed('peropt-col-three-combined', true)
        const thirdColOptions = columnThree
          .selectAll('.peropt-checkbox')
          .data(perspectiveColumns[selectedPerspectiveID].thirdColumnData)

        thirdColOptions.exit().remove()

        thirdColOptions.enter()
          .append('div')
            .classed('peropt-checkbox', true)
            .on('click', toggleOption)

        const thirdColElements = columnThree.selectAll('.peropt-checkbox')
          .classed('peropt-checkbox-hidden', function (d) { return d.parent === combinedColumnTwoHighlight ? null : 'none' })
          .text('')
          .attr('title', function (d) { return d.text })

        thirdColElements.append('span')
          .classed('peropt-checkbox-text', true)
          .text(function (d) { return d.text })

        // move bottom padding elements to the bottom of the column
        d3.selectAll('.peropt-col__bottom-padding').raise()

        d3.select('.peropt-bottom-padding')
          .style('height', hasRemainder ? null : '4px')
      }

      d3.select('.description-panel')
        .interrupt().transition()
          .style('color', collapsed ? 'black' : 'hsl(0, 0%, 70%)')

      d3.select('.peropt-extra-columns')
        .interrupt().transition()
          .style('opacity', collapsed && !dax.data.isCombinedPerspective(selectedPerspectiveID) ? 0 : 1)
          .style('width', collapsed && !dax.data.isCombinedPerspective(selectedPerspectiveID) ? '0px' : null)

      // Skip width animation when switching to new perspective
      columnOne.style('transition', '0s')
      columnTwo.style('transition', '0s')
      columnThree.style('transition', '0s')
      setTimeout(function () {
        columnOne.style('transition', null)
        columnTwo.style('transition', null)
        columnThree.style('transition', null)
      }, 0)
    }

    // hack to handle IE display bugs
    if (isIE) {
      const optionsHeight = Math.max(
        d3.select('.pervarpicker-border-wrapper').node().offsetHeight,
        62 + 24 * perspectiveColumns[selectedPerspectiveID].firstColumnData.length)
      d3.select('.perspective-options')
        .style('height', optionsHeight + 'px')
    }

    moreButton
      .style('display', !dax.data.isCombinedPerspective(selectedPerspectiveID) && hasRemainder ? null : 'none')
      .text(collapsed ? dax.text('perspectivesMoreButton') + '>' : '<' + dax.text('perspectivesLessButton')) // TODO use new text ID style

    updateElements()
  }

  function setSelectedSecondaryPerspective (perspectiveID) {
    const oldSecondaryPerspective = selectedSecondaryPerspectiveID
    selectedSecondaryPerspectiveID = perspectiveID
    updateElements(selectedSecondaryPerspectiveID !== oldSecondaryPerspective)
  }

  function updateElements () {
    // const showSelectTotal = settings.showSelectTotal
    // const totalCount = (showSelectTotal ? 1 : 0)
    // d3.select('.peropt-extra-columns')
    //   .style('width', '0px')

    columnOne.selectAll('.peropt-checkbox')
      .classed('peropt-checkbox-selected', function (d) { return selectedOptions.has(d.index) })

    columnTwo.selectAll('.peropt-checkbox')
      .classed('peropt-checkbox-selected', function (d) { return selectedOptions.has(d.index) })

    columnThree.selectAll('.peropt-checkbox')
      .classed('peropt-checkbox-selected', function (d) { return selectedOptions.has(d.index) })

    secondaryPanel.selectAll('.peropt-second-button')
      .classed('peropt-second-button--selected', function (d) {
        if (d.type === 'none') {
          return selectedSecondaryPerspectiveID === null
        }
        return d.id === selectedSecondaryPerspectiveID
      })
      .classed('peropt-second-button--redundant', function (d) {
        return d.type === 'perspective' && d.id === selectedPerspectiveID
      })
  }
})(window.dax = window.dax || {})
