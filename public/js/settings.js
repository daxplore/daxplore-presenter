(function (namespace) {
  // The uploaded usertext data from Daxplore Producer
  let settings

  // Make the 'text' namespace a function, for more compact calls
  namespace.settings =
  function (settingID) {
    if (typeof settings[settingID] === 'undefined') {
      console.warn('Missing setting: ' + settingID) // TODO custom logging system?
    }
    return settings[settingID]
  }

  // Initlaize 'text' with the usertext data
  namespace.settings.initializeResources =
  function (settingsInput) {
    settings = settingsInput
  }
})(window.dax = window.dax || {})
