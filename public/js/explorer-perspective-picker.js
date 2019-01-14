(function (namespace) {
  namespace.explorer = namespace.explorer || {}
  const exports = namespace.explorer

  var initialized = false
  var selectedPerspective = -1
  var perspectiveOptions = []
  var selectedOptions = []
  // TODO unused: var hasTotal = false
  var totalSelected = false
  var hasRemainder = false
  var collapsed = true
  var fixedWidth = null

  var questions, perspectives, usertexts, settings

  document.addEventListener('DOMContentLoaded', function (e) {
    d3.select('body').append('img')
      .classed('img-preload', true)
      .attr('src', '/img/perspective-checkbox-empty.png')
  })

  exports.perspectiveSetQueryDefinition = function (perspectiveID, perspectiveOptionsIntArray, total) {
    const perspectiveIndex = perspectives.indexOf(perspectiveID)
    if (perspectiveIndex === -1) { return } // TODO log error?
    selectedPerspective = perspectiveIndex // TODO validate data?
    // Remap options from array of ints to array of bools
    selectedOptions = []
    for (let i = 0; i < perspectiveOptions[perspectiveIndex].length; i++) {
      selectedOptions.push(perspectiveOptionsIntArray.indexOf(i) !== -1)
    }
    totalSelected = total

    if (initialized) {
      updateCheckboxes(false)
    }
  }

  exports.generatePerspectivePicker = function (questionsInput, perspectivesInput, usertextsInput, settingsInput) {
    questions = questionsInput
    perspectives = perspectivesInput
    usertexts = usertextsInput
    settings = settingsInput

    d3.select('.perspective-header')
      .text(usertexts.perspectiveHeader)

    var variableList = d3.select('.pervarpicker-variables')

    var perspectiveShorttexts = []
    perspectives.forEach(function (p) {
      questions.some(function (q) {
        if (p === q.column) {
          perspectiveShorttexts.push(q.short)
          perspectiveOptions.push(q.options)
          return true
        }
      })
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
        for (var i = 0; i < selectedOptions.length; i++) {
          selectedOptions[i] = true
        }
        updateCheckboxes(true)
      })
      .text(usertexts.perspectivesAllButton)

    d3.selectAll('.peropt-none-button')
      .on('click', function () {
        for (var i = 0; i < selectedOptions.length; i++) {
          selectedOptions[i] = false
        }
        updateCheckboxes(true)
      })
      .text(usertexts.perspectivesNoneButton)

    d3.selectAll('.peropt-more-button')
      .text(collapsed ? usertexts.perspectivesMoreButton + '>' : '<' + usertexts.perspectivesLessButton)
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

    // hack to force initial gwt sizing to work
    // TODO replace when the resizing system is moved to pure js
    // for (var i=2; i<=12; i++) {
    //   setTimeout(initializeSelection, Math.pow(2, i));
    // }
  }

  exports.getSelectedPerspective = function () {
    return perspectives[selectedPerspective]
  }

  exports.getSelectedPerspectiveOptions = function () {
    let selectedOptionsInt = []
    for (let i = 0; i < selectedOptions.length; i++) {
      if (selectedOptions[i]) {
        selectedOptionsInt.push(i)
      }
    }
    return selectedOptionsInt
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
    var changed = selectedPerspective !== index
    selectedPerspective = index

    if (changed) {
      selectedOptions = []
      var i = 0
      perspectiveOptions[selectedPerspective].forEach(function (option) {
        selectedOptions.push(i < settings.defaultSelectedPerspectiveOptions)
        i++
      })
    }

    updateCheckboxes(changed && initialized)
  }

  function updateCheckboxes (fireUpdateEvent) {
    d3.selectAll('.pervarpicker-varoption')
      .classed('pervarpicker-varoption-selected', function (d, i) { return i === selectedPerspective })

    var showSelectTotal = settings.showSelectTotal
    var optionCount = selectedOptions.length + (showSelectTotal ? 1 : 0)
    var perColumnSetting = settings.perspectiveCheckboxesPerColumn
    var maxColumns = 3
    var columns = Math.min(maxColumns, Math.ceil(optionCount / perColumnSetting))
    var perColumn = Math.ceil(optionCount / columns)
    hasRemainder = columns > 1
    if (collapsed) {
      d3.select('.peropt-extra-columns')
        .style('width', '0px')
    }
    if (!hasRemainder) {
      collapsed = true
    }

    var firstColumnData = []
    var secondColumnData = []
    var thirdColumnData = []

    for (var i = 0; i < selectedOptions.length; i++) {
      var option = { text: perspectiveOptions[selectedPerspective][i], selected: selectedOptions[i], index: i }
      if (i < perColumn) {
        firstColumnData.push(option)
      } else if (i < perColumn * 2) {
        secondColumnData.push(option)
      } else {
        thirdColumnData.push(option)
      }
    }

    // TODO add total

    // First column
    var firstColOptions = d3.select('.peropt-col-one')
      .selectAll('.peropt-checkbox')
      .data(firstColumnData)

    firstColOptions.exit().remove()

    firstColOptions.enter()
      .append('div')
        .classed('peropt-checkbox', true)
        .on('click', function (d) {
          selectedOptions[d.index] = !selectedOptions[d.index]
          updateCheckboxes(true)
        })

    d3.select('.peropt-col-one').selectAll('.peropt-checkbox')
      .classed('peropt-checkbox-selected', function (d) { return d.selected })
      .text(function (d) { return d.text })

    // Second column
    var secondColOptions = d3.select('.peropt-col-two')
      .selectAll('.peropt-checkbox')
      .data(secondColumnData)

    secondColOptions.exit().remove()

    secondColOptions.enter()
      .append('div')
        .classed('peropt-checkbox', true)
        .on('click', function (d) {
          selectedOptions[d.index] = !selectedOptions[d.index]
          updateCheckboxes(true)
        })

    d3.select('.peropt-col-two').selectAll('.peropt-checkbox')
      .classed('peropt-checkbox-selected', function (d) { return d.selected })
      .text(function (d) { return d.text })

    // Third column
    var thirdColOptions = d3.select('.peropt-col-three')
      .selectAll('.peropt-checkbox')
      .data(thirdColumnData)

    thirdColOptions.exit().remove()

    thirdColOptions.enter()
      .append('div')
        .classed('peropt-checkbox', true)
        .on('click', function (d) {
          selectedOptions[d.index] = !selectedOptions[d.index]
          updateCheckboxes(true)
        })

    d3.select('.peropt-col-three').selectAll('.peropt-checkbox')
      .classed('peropt-checkbox-selected', function (d) { return d.selected })
      .text(function (d) { return d.text })

    // var hasCheckedBox = false
    // for (i = 0; i < selectedOptions.length; i++) {
    //   if (selectedOptions[i]) {
    //     hasCheckedBox = true
    //     break
    //   }
    // }

    if (fireUpdateEvent) { //  TODO removed update limiter: && hasCheckedBox
      // TODO replace with callback to js page handler
      // gwtPerspectiveCallback();
      daxplore.explorer.selectionUpdateCallback()
    }

    // hack to handle IE display bugs
    var isIE = !!navigator.userAgent.match(/Trident/g) || !!navigator.userAgent.match(/MSIE/g)
    if (isIE) {
      var optionsHeight = Math.max(
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
      .style('visibility', function () {
        return hasRemainder ? null : 'hidden'
      })
      .text(collapsed ? 'Visa fler >' : '< Visa färre ')

    d3.select('.peropt-bottom-padding')
      .style('height', function () {
        return hasRemainder ? null : '0px'
      })

    d3.select('.daxplore-DescriptionPanelBottom')
      .interrupt().transition()
        .style('color', collapsed ? 'black' : 'hsl(0, 0%, 70%)')

    d3.select('.peropt-extra-columns')
      .interrupt().transition()
        .style('opacity', collapsed ? 0 : 1)
        .style('width', collapsed ? '0px' : null)
  }
})(window.daxplore = window.daxplore || {})
