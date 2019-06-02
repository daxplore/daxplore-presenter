(function (namespace) {
  namespace.common = namespace.common || {}
  const common = namespace.common

  // Data package version used by this version of the explorer.
  // Compare with dataPackageVersion in data/manifest.json.
  // Used to make sure the code and data package are compatible.
  const systemDataVersion = 4

  // Log an error that has occurred in the Daxplore system.
  // Uses arguments array instead of function arguments, to support any number of
  // arguments in older browsers that don't support the rest syntax.
  // Currently logs to browser console.
  // Wrapped in its own Daxplore function in order to allow easy future
  // refactoring into a DOM based logging system.
  common.logError = function () {
    if (typeof (console) !== 'undefined') {
      console.error.apply(console, arguments) // eslint-disable-line no-console
    }
  }

  // Check if the data folder's manifest data package version matches the system data version.
  // Logs any problem as a severe error, aimed at the person deploying Daxplore Presenter.
  // Takes the manifest's data version as an argument.
  // Returns true if the data files and system use the same version.
  common.hasMatchingDataFileVersions = function (manifestDataVersion) {
    // Check that the data and code uses the same data format version.
    if (systemDataVersion === manifestDataVersion) {
      return true
    }
    // Get the location of the used data folder.
    let dataFolderLocation = new URL('data', window.location.href).href
    // Write a general error message, directed at the person setting up the presentation.
    daxplore.common.logError('The data folder at ' + dataFolderLocation + ' uses data format version ' +
                  manifestDataVersion + ', but this version of Daxplore Presenter uses ' +
                  'data format version ' + systemDataVersion + '.')
    // Add different instructions for fixing the error, depending on if the data folder or code is out of date.
    if (systemDataVersion < manifestDataVersion) {
      daxplore.common.logError('Suggested fix: Upgrade to the latest version of Daxplore Presenter.')
    } else {
      daxplore.common.logError('Suggested fix: Upgrade to the latest version of Daxplore Producer and export the data again.')
    }
    return false
  }
})(window.daxplore = window.daxplore || {})
