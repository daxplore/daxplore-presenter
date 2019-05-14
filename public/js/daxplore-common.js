(function (namespace) {
  namespace.common = namespace.common || {}
  const common = namespace.common

  // Data package version used by this version of the explorer
  // Compare with dataPackageVersion in data/manifest.json
  // Used to make sure the code and data package are compatible
  const systemDataVersion = 4

  // Check if the data folder's manifest data package version matches the system data version
  // Logs any problem as a severe error, aimed at the person deploying Daxplore Presenter
  // Takes the manifest's data version as an argument
  // Returns true if the data files and system use the same version
  common.hasMatchingDataFileVersions = function(manifestDataVersion) {
    // Check that the data and code uses the same data format version.
    if (systemDataVersion === manifestDataVersion) {
      return true
    }
    // Get the location of the used data folder
    let dataFolderLocation = new URL('data', window.location.href).href
    // Write a general error message, directed at the person setting up the presentation
    console.error('The data folder at ' + dataFolderLocation + ' uses data format version ' +
                  manifestDataVersion + ', but this version of Daxplore Presenter uses ' +
                  'data format version ' + systemDataVersion + '.')
    // Add different instructions for fixing the error, depending on if the data folder or code is out of date
    if (systemDataVersion < manifestDataVersion) {
      console.error('Suggested fix: Upgrade to the latest version of Daxplore Presenter.')
    } else {
      console.error('Suggested fix: Upgrade to the latest version of Daxplore Producer and export the data again.')
    }
    return false
  }
})(window.daxplore = window.daxplore || {})
