(function (namespace) {
  // Find URL for this script (as opposed to URL for the current window)
  const scriptElement = document.currentScript
  const scriptSrcElement = document.createElement('a')
  const isIE11 = /Trident.*rv[ :]*11\./.test(navigator.userAgent)
  if (!isIE11) {
    scriptSrcElement.href = scriptElement.src
  }

  // Handle messages from inside the iframe
  function receiveMessage (event) {
    // Receive messages only from same server this script is hosted on.
    // Ignore origin check on IE11, due to broken currentScript/readyScript implementation.
    const isIE11 = /Trident.*rv[ :]*11\./.test(navigator.userAgent)
    if (isIE11 || event.origin === scriptSrcElement.origin) {
      // Do manual origin check. Not secure, but prevents accidentally picking up other events.
      if (!(event.data && event.data.source === 'DAXPLORE')) {
        return
      }

      // Handle change height message sent from Explorer
      if (event.data.height) {
        document.querySelector('.daxplore-presenter-iframe').style.height = event.data.height + 'px'
      }
    }
  }

  // Add event listeners
  window.addEventListener('message', receiveMessage, false)
})(window.dax = window.dax || {})
