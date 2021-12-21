(function (namespace) {
  namespace.common = namespace.common || {}
  const common = namespace.common

  // DAXPLORE SYSTEM HELPERS
  // Data package version used by this version of the explorer.
  // Compare with dataPackageVersion in data/manifest.json.
  // Used to make sure the code and data package are compatible.
  const systemDataVersion = 7

  // Log an error that has occurred in the Daxplore system.
  // Uses arguments array instead of function arguments, to support any number of
  // arguments in older browsers that don't support the rest syntax.
  // Currently logs to browser console.
  // Wrapped in its own Daxplore function in order to allow easy future
  // refactoring into a DOM based logging system.
  common.logError =
  function () {
    if (typeof (console) !== 'undefined') {
      console.error.apply(console, arguments) // eslint-disable-line no-console
    }
  }

  // Check if the data folder's manifest data package version matches the system data version.
  // Logs any problem as a severe error, aimed at the person deploying Daxplore Presenter.
  // Takes the manifest's data version as an argument.
  // Returns true if the data files and system use the same version.
  common.hasMatchingDataFileVersions =
  function (manifestDataVersion) {
    // Check that the data and code uses the same data format version.
    if (systemDataVersion === manifestDataVersion) {
      return true
    }
    // Get the location of the used data folder.
    const dataFolderLocation = new URL('data', window.location.href).href
    // Write a general error message, directed at the person setting up the presentation.
    dax.common.logError('The data folder at ' + dataFolderLocation + ' uses data format version ' +
                  manifestDataVersion + ', but this version of Daxplore Presenter uses ' +
                  'data format version ' + systemDataVersion + '.')
    // Add different instructions for fixing the error, depending on if the data folder or code is out of date.
    if (systemDataVersion < manifestDataVersion) {
      dax.common.logError('Suggested fix: Upgrade to the latest version of Daxplore Presenter.')
    } else {
      dax.common.logError('Suggested fix: Upgrade to the latest version of Daxplore Producer and export the data again.')
    }
    return false
  }

  // FORMATTING HELPERS
  common.percentageFormat = d3.format('.0%')
  common.integerFormat = d3.format('d')

  // IMAGE HELPERS

  // Calculate the white border margins for a canvas image.
  // Takes an canvas.
  // Returns a margin object with {left, right, top, bottom}.
  common.getCanvasMargins =
  function (canvas) {
    const ctx = canvas.getContext('2d')
    const canvasWidth = ctx.canvas.width
    const canvasHeight = ctx.canvas.height
    const data = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data

    let firstRowWithColor = -1
    for (let y = 0; y < canvasHeight && firstRowWithColor === -1; y++) {
      for (let x = 0; x < canvasWidth && firstRowWithColor === -1; x++) {
        const pixelIndex = (y * canvasWidth + x) * 4
        if (data[pixelIndex] !== 255 || data[pixelIndex + 1] !== 255 || data[pixelIndex + 2] !== 255 || data[pixelIndex + 3] !== 255) {
          firstRowWithColor = y
        }
      }
    }

    let lastRowWithColor = -1
    for (let y = canvasHeight - 1; y >= 0 && lastRowWithColor === -1; y--) {
      for (let x = 0; x < canvasWidth && lastRowWithColor === -1; x++) {
        const pixelIndex = (y * canvasWidth + x) * 4
        if (data[pixelIndex] !== 255 || data[pixelIndex + 1] !== 255 || data[pixelIndex + 2] !== 255 || data[pixelIndex + 3] !== 255) {
          lastRowWithColor = y
        }
      }
    }

    let firstColumnWithColor = -1
    for (let x = 0; x < canvasWidth && firstColumnWithColor === -1; x++) {
      for (let y = 0; y < canvasHeight && firstColumnWithColor === -1; y++) {
        const pixelIndex = (y * canvasWidth + x) * 4
        if (data[pixelIndex] !== 255 || data[pixelIndex + 1] !== 255 || data[pixelIndex + 2] !== 255 || data[pixelIndex + 3] !== 255) {
          firstColumnWithColor = x
        }
      }
    }

    let lastColumnWithColor = -1
    for (let x = canvasWidth - 1; x >= 0 && lastColumnWithColor === -1; x--) {
      for (let y = 0; y < canvasHeight && lastColumnWithColor === -1; y++) {
        const pixelIndex = (y * canvasWidth + x) * 4
        if (data[pixelIndex] !== 255 || data[pixelIndex + 1] !== 255 || data[pixelIndex + 2] !== 255 || data[pixelIndex + 3] !== 255) {
          lastColumnWithColor = x
        }
      }
    }

    return {
      left: Math.max(0, firstColumnWithColor),
      right: lastColumnWithColor === -1 ? 0 : Math.max(0, canvasWidth - lastColumnWithColor - 1),
      top: Math.max(0, firstRowWithColor),
      bottom: lastRowWithColor === -1 ? 0 : Math.max(0, canvasHeight - lastRowWithColor - 1),
    }
  }

  // Takes a canvas, standardizes margins, adds the watermark text and returns a new canvas.
  const imageScaling = 2 // TODO externalize
  common.composeImageFromCanvas = function (canvas, watermarkText) {
    // Define margins
    const margin = {
      left: 20 * imageScaling,
      right: 15 * imageScaling,
      top: 20 * imageScaling,
      bottom: 25 * imageScaling,
    } // TODO externalize image margins?

    // Calculate image size and margins
    const initialMargins = common.getCanvasMargins(canvas)
    const chartWidth = canvas.width - initialMargins.left - initialMargins.right
    const chartHeight = canvas.height - initialMargins.top - initialMargins.bottom

    // Measure watermark
    const sourceFontHeight = 11 * imageScaling // TODO externalize watermark font size?
    canvas.font = sourceFontHeight + 'px "Varta"'
    const sourceTextWidth = canvas.getContext('2d').measureText(watermarkText).width * imageScaling

    // Generate full canvas with margins
    const marginCanvas = document.createElement('canvas')
    const marginCanvasWidth = Math.max(chartWidth, sourceTextWidth) + margin.left + margin.right
    const marginCanvasHeight = chartHeight + margin.top + margin.bottom
    marginCanvas.width = marginCanvasWidth
    marginCanvas.height = marginCanvasHeight
    const marginContext = marginCanvas.getContext('2d')

    // Fill with white background
    marginContext.fillStyle = 'white'
    marginContext.fillRect(0, 0, marginCanvasWidth, marginCanvasHeight)
    marginContext.fillStyle = 'black'

    // Draw cropped image
    marginContext.drawImage(
      canvas,
      initialMargins.left, initialMargins.top, chartWidth, chartHeight,
      margin.left, margin.right, chartWidth, chartHeight
    )

    // Draw watermark
    marginContext.fillStyle = '#555'
    marginContext.font = sourceFontHeight + 'px "Varta"'
    marginContext.fillText(watermarkText, margin.left, marginCanvasHeight - 6 * imageScaling)

    return marginCanvas
  }
})(window.dax = window.dax || {})
