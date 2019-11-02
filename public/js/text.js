(function (namespace) {
  // The uploaded usertext data from Daxplore Producer
  var usertexts

  // Make the 'text' namespace a function, for more compact calls
  namespace.text = function (textID) {
    if (typeof usertexts[textID] === 'undefined') {
      console.warn('Missing usertext: ' + textID) // TODO custom logging system?
      return '[' + textID + ']'
    }
    var text = usertexts[textID]
    Array.prototype.slice.call(arguments, 1).forEach(function (arg, i) {
      var match = '{' + i + '}'
      if (!text.includes(match)) {
        console.warn(textID, '=', usertexts[textID], "doesn't contain ", match)
        return
      }
      text = text.replace(new RegExp('\\{' + i + '\\}', 'g'), arg)
    })
    return text
  }

  // Initlaize 'text' with the usertext data
  namespace.text.initializeResources = function (usertextsInput) {
    usertexts = usertextsInput
  }
})(window.daxplore = window.daxplore || {})
