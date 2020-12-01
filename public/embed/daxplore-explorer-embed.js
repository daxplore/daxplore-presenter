(function (namespace) {
  // Find URL for this script (as opposed to URL for the current window)
  const scriptElement = document.currentScript || document.querySelector('script[src*="daxplore-explorer-embed.js"]')
  const scriptSrcElement = document.createElement('a')
  scriptSrcElement.href = scriptElement.src

  // Handle messages from inside the iframe
  function receiveMessage (event) {
    // Recieve messages only from same server as this script is on
    if (event.origin === scriptSrcElement.origin) {
      // Handle change hash message sent from Explorer
      if (event.data.hash) {
        if (history.pushState) {
          window.history.replaceState(null, window.document.title, '#' + event.data.hash)
        } else {
          window.location.hash = event.data.hash
        }
      }
      // Handle change height message sent from Explorer
      if (event.data.height) {
        document.querySelector('.daxplore-presenter-iframe').style.height = event.data.height + 'px'
      }
    }
  }

  // Add event listener
  if (window.addEventListener) {
    window.addEventListener('message', receiveMessage, false)
  } else if (window.attachEvent) {
    window.attachEvent('message', receiveMessage)
  }

  // Send changed hash message to iframe, when URL is updated due to history change in own window
  window.onpopstate = function (event) {
    document.querySelector('.daxplore-presenter-iframe').postMessage({ hash: window.location.hash }, '*')
  }
})(window.dax = window.dax || {})
