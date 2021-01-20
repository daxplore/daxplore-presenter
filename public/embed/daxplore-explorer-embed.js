(function (namespace) {
  // The daxplore presenter iframe
  let iframe, iframeBaseURL
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

  // Handle hash changes in parent window/browser
  function hashUpdate () {
    // Send changed hash message to iframe, when the hash is updated in the parent page
    const hash = window.location.hash
    if (!iframe) {
      iframe = document.querySelector('.daxplore-presenter-iframe')
      iframeBaseURL = iframe.src.split('#')[0]
    }
    if (typeof hash === 'string') {
      if (iframe.src !== iframeBaseURL + hash) {
        iframe.src = iframeBaseURL + hash
      }
    }
  }

  // Add event listeners
  window.addEventListener('message', receiveMessage, false)
  window.addEventListener('load', hashUpdate, false)
  window.addEventListener('hashchange', hashUpdate, false)
  window.addEventListener('popstate', hashUpdate, false)
})(window.dax = window.dax || {})
