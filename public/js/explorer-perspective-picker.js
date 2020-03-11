(function (namespace) {
  namespace.explorer = namespace.explorer || {}
  const exports = namespace.explorer

  let initialized = false
  let selectedPerspective = -1
  // let perspectiveOptions = []
  let selectedOptions = new Set()
  // TODO unused: let hasTotal = false
  let totalSelected = false
  let hasRemainder = false
  let collapsed = true
  let fixedWidth = null

  let perspectives, settings

  let combinedColumnOneHighlight = -1
  let combinedColumnTwoHighlight = -1

  document.addEventListener('DOMContentLoaded', function (e) {
    d3.select('body').append('img')
      .classed('img-preload', true)
      .attr('src', './img/perspective-checkbox-empty.png')
  })

  exports.perspectiveSetQueryDefinition = function (perspectiveID, perspectiveOptionsIntArray, total) {
    const perspectiveIndex = perspectives.indexOf(perspectiveID)
    if (perspectiveIndex === -1) { return } // TODO log error?
    selectedPerspective = perspectiveIndex // TODO validate data?
    // Remap options from array of ints to array of bools
    selectedOptions = new Set(perspectiveOptionsIntArray)
    totalSelected = total
    if (initialized) {
      updateCheckboxes(false)
    }
  }

  exports.generatePerspectivePicker = function (perspectivesInput, settingsInput) {
    perspectives = perspectivesInput
    settings = settingsInput

    d3.select('.perspective-header')
      .text(dax.text('perspectivesHeader')) // TODO use new text ID style

    const variableList = d3.select('.pervarpicker-variables')

    const perspectiveShorttexts = []
    perspectives.forEach(function (perspectiveID) {
      perspectiveShorttexts.push(dax.data.getQuestionShortText(perspectiveID))
    })

    variableList
      .selectAll('.pervarpicker-varoption')
      .data(perspectiveShorttexts)
      .enter()
        .append('div')
        .classed('pervarpicker-varoption', true)
        .classed('no-select', true)
        .on('click', function (d, i) { setSelectedPerspective(i) })
        .text(function (d) { return d })

    d3.selectAll('.peropt-all-button')
      .on('click', function () {
        const perspectiveID = perspectives[selectedPerspective]
        for (let i = 0; i < dax.data.getQuestionOptionCount(perspectiveID); i++) {
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
    return perspectives[selectedPerspective]
  }

  exports.getSelectedPerspectiveOptions = function () {
    const selectedOptionsInt = []
    selectedOptions.forEach(opt => {
      selectedOptionsInt.push(opt)
    })
    return selectedOptionsInt.sort()
  }

  exports.isPerspectiveTotalSelected = function () {
    return totalSelected
  }

  function initializeSelection () {
    if (selectedPerspective === -1) {
      setSelectedPerspective(0)
    } else {
      setSelectedPerspective(selectedPerspective)
    }
  }

  function setSelectedPerspective (index) {
    if (typeof index !== 'number' || index < 0 || index >= perspectives.length) { return } // TODO log error?
    const changed = selectedPerspective !== index
    selectedPerspective = index

    if (changed) {
      const perspectiveID = perspectives[selectedPerspective]
      const topLevelOptionCount = dax.data.getTopLevelQuestionOptionCount(perspectiveID)
      const selectedCount = Math.min(topLevelOptionCount, settings.defaultSelectedPerspectiveOptions)
      selectedOptions.clear()
      for (let i = 0; i < selectedCount; i++) {
        selectedOptions.add(i)
      }
      combinedColumnOneHighlight = 0
      combinedColumnTwoHighlight = dax.data.getPerspectiveOptionFirstChild(perspectiveID, combinedColumnOneHighlight)
    }

    updateCheckboxes(changed && initialized)
  }

  function updateCheckboxes (fireUpdateEvent) {
    d3.selectAll('.pervarpicker-varoption')
      .classed('pervarpicker-varoption-selected', function (d, i) { return i === selectedPerspective })

    const showSelectTotal = settings.showSelectTotal
    const perspectiveID = perspectives[selectedPerspective]
    const optionCount = dax.data.getQuestionOptionCount(perspectiveID)
    const totalCount = (showSelectTotal ? 1 : 0)
    hasRemainder = true // TODO don't use remainder system, instead show alternative options
    // d3.select('.peropt-extra-columns')
    //   .style('width', '0px')

    const firstColumnData = []
    const secondColumnData = []
    const thirdColumnData = []
    if (dax.data.isCombinedPerspective(perspectiveID)) {
      // COMBINED PERSPECTIVE
      hasRemainder = false
      for (let i = 0; i < optionCount; i++) {
        const option = {
          index: i,
          isExpandible: dax.data.hasPerspectiveOptionChildren(perspectiveID, i),
          selected: selectedOptions.has(i),
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

      // First column combined
      const firstColOptions = d3.select('.peropt-col-one')
        .selectAll('.peropt-checkbox')
        .data(firstColumnData)

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
        .classed('peropt-checkbox-expandible', d => d.isExpandible)
        .classed('peropt-checkbox-selected', function (d) { return d.selected })
        .classed('peropt-checkbox-expanded', (d, i) => i === combinedColumnOneHighlight)
        .text('')
        .on('mouseover', (d, i, elements) => {
          if (combinedColumnOneHighlight !== d.index) {
            // Highlights
            combinedColumnOneHighlight = d.index
            combinedColumnTwoHighlight = dax.data.getPerspectiveOptionFirstChild(perspectiveID, d.index)
            // Update shown and expanded checkboxes
            d3.selectAll(elements)
              .classed('peropt-checkbox-expanded', (dd, j) => dd.isExpandible && dd.index === combinedColumnOneHighlight)
            d3.selectAll('.peropt-col-two > .peropt-checkbox')
              .classed('peropt-checkbox-expanded', (dd, j) => dd.isExpandible && dd.index === combinedColumnTwoHighlight)
              .style('display', (dd, i) => dd.parent === combinedColumnOneHighlight ? null : 'none')
            d3.selectAll('.peropt-col-three > .peropt-checkbox')
              .style('display', (dd, i) => dd.parent === combinedColumnTwoHighlight ? null : 'none')
          }
        })

      firstColElements.append('span')
        .classed('peropt-checkbox-text', true)
        .text(function (d) { return d.text })
      firstColElements.append('span')
        .classed('peropt-checkbox-expand', true)
        .classed('no-select', true)
        .style('display', d => d.isExpandible ? null : 'none')
        .text('▶')

      // Second column combined
      // d3.select('.peropt-columns').append(function () {
      //   return d3.select('.peropt-col-two').remove().node()
      // })
      d3.select('.peropt-extra-columns')
        .style('display', 'none')
      d3.select('.peropt-col-two')
        .classed('peropt-col-two-combined', true)
      const secondColOptions = d3.select('.peropt-col-two')
        .selectAll('.peropt-checkbox')
        .data(secondColumnData)

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
        .classed('peropt-checkbox-expandible', d => d.isExpandible)
        .classed('peropt-checkbox-selected', function (d) { return d.selected })
        .classed('peropt-checkbox-expanded', d => d.isExpandible && d.index === combinedColumnTwoHighlight)
        .style('display', d => d.parent === combinedColumnOneHighlight ? null : 'none')
        .text('')
        .on('mouseover', (d, i, elements) => {
          if (combinedColumnOneHighlight !== d.index) {
            // Highlights
            combinedColumnTwoHighlight = d.index
            // Update shown and expanded checkboxes
            d3.selectAll(elements)
              .classed('peropt-checkbox-expanded', d => d.isExpandible && d.index === combinedColumnTwoHighlight)
              .style('display', (dd, i) => dd.parent === combinedColumnOneHighlight ? null : 'none')
            d3.selectAll('.peropt-col-three > .peropt-checkbox')
              .style('display', (dd, i) => dd.parent === combinedColumnTwoHighlight ? null : 'none')
          }
        })

      secondColElements.append('span')
        .classed('peropt-checkbox-text', true)
        .text(function (d) { return d.text })
      secondColElements.append('span')
        .classed('peropt-checkbox-expand', true)
        .classed('no-select', true)
        .style('display', d => d.isExpandible ? null : 'none')
        .text('▶')

      // Third column combined
      // d3.select('.peropt-columns').append(function () {
      //   return d3.select('.peropt-col-three').remove().node()
      // })
      d3.select('.peropt-col-three')
        .classed('peropt-col-three-combined', true)
      const thirdColOptions = d3.select('.peropt-col-three')
        .selectAll('.peropt-checkbox')
        .data(thirdColumnData)

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
        .classed('peropt-checkbox-selected', function (d) { return d.selected })
        .style('display', d => d.parent === combinedColumnTwoHighlight ? null : 'none')
        .text('')
      thirdColElements.append('span')
        .classed('peropt-checkbox-text', true)
        .text(function (d) { return d.text })
    } else {
      // BASIC PERSPECTIVE
      const perColumnSetting = settings.perspectiveCheckboxesPerColumn
      const maxColumns = 3
      const columns = Math.min(maxColumns, Math.ceil(optionCount / perColumnSetting))
      const perColumn = Math.ceil(optionCount / columns)
      hasRemainder = columns > 1
      if (collapsed) {
        d3.select('.peropt-extra-columns')
          .style('width', '0px')
      }
      if (!hasRemainder) {
        collapsed = true
      }

      for (let i = 0; i < optionCount; i++) {
        const option = { text: dax.data.getQuestionOptionText(perspectiveID, i), selected: selectedOptions.has(i), index: i }
        if (i < perColumn) {
          firstColumnData.push(option)
        } else if (i < perColumn * 2) {
          secondColumnData.push(option)
        } else {
          thirdColumnData.push(option)
        }
      }

      // TODO add total

      // First column basic
      const firstColOptions = d3.select('.peropt-col-one')
        .selectAll('.peropt-checkbox')
        .classed('peropt-checkbox-combined', false)
        .classed('peropt-checkbox-expandible', false)
        .classed('peropt-checkbox-expanded', false)
        .on('mouseover', () => {})
        .data(firstColumnData)

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
        .classed('peropt-checkbox-selected', function (d) { return d.selected })
        .text(function (d) { return d.text })

      // Second column basic
      d3.select('.peropt-extra-columns').append(function () {
        return d3.select('.peropt-col-two').remove().node()
      })
      d3.select('.peropt-col-two')
        .classed('peropt-col-two-combined', false)
      const secondColOptions = d3.select('.peropt-col-two')
        .selectAll('.peropt-checkbox')
        .data(secondColumnData)

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
        .classed('peropt-checkbox-selected', function (d) { return d.selected })
        .text(function (d) { return d.text })

      // Third column basic
      d3.select('.peropt-extra-columns').append(function () {
        return d3.select('.peropt-col-three').remove().node()
      })
      d3.select('.peropt-extra-columns').style('display', null)
      d3.select('.peropt-col-three')
        .classed('peropt-col-three-combined', false)
      const thirdColOptions = d3.select('.peropt-col-three')
        .selectAll('.peropt-checkbox')
        .data(thirdColumnData)

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
        .classed('peropt-checkbox-selected', function (d) { return d.selected })
        .text(function (d) { return d.text })

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
        62 + 24 * firstColumnData.length)
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
        return dax.data.isCombinedPerspective(perspectives[selectedPerspective]) && hasRemainder ? null : 'none'
      })
      .text(collapsed ? 'Visa fler >' : '< Visa färre ') // TODO externalize texts

    d3.select('.peropt-bottom-padding')
      .style('height', function () {
        if (hasRemainder) {
          return null
        } else if (dax.data.isCombinedPerspective(perspectives[selectedPerspective])) {
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
        .style('opacity', collapsed && !dax.data.isCombinedPerspective(perspectives[selectedPerspective]) ? 0 : 1)
        .style('width', collapsed && !dax.data.isCombinedPerspective(perspectives[selectedPerspective]) ? '0px' : null)
  }
})(window.dax = window.dax || {})
