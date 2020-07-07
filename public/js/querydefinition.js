// Functions to encode and decode query definitions
(function (namespace) {
  namespace.querydefinition = namespace.querydefinition || {}
  const exports = namespace.querydefinition

  // Check if a string contains a normal integer, allowing leading zeroes
  // https://stackoverflow.com/questions/10834796/validate-that-a-string-is-a-positive-integer
  function isNormalInteger (str) {
    return /^\+?\d+$/.test(str)
  }

  // Turn query definition flag (bit flag integer as string) into an array of flag strings
  function decodeQueryDefinitionFlags (flagString) {
    if (!isNormalInteger(flagString)) { return [] }
    const flagInt = parseInt(flagString, 10)
    const flagArray = []
    if (flagInt & 1) { flagArray.push('TOTAL') }
    if (flagInt & 2) { flagArray.push('SECONDARY') }
    if (flagInt & 4) { flagArray.push('MEAN') }
    if (flagInt & 8) { flagArray.push('MEAN_REFERENCE') }
    if (flagInt & 16) { flagArray.push('MEANLINE') }
    if (flagInt & 32) { flagArray.push('DICHLINE') }
    return flagArray
  }

  // Turn flag array (array of flag strings) into a bit flag integer
  function encodeQueryDefinitionFlags (flagArray) {
    if (!Array.isArray(flagArray)) { return 0 }
    let flags = 0
    flagArray.forEach(function (f) {
      switch (f) {
      case 'TOTAL': flags |= 1; break
      case 'SECONDARY': flags |= 2; break
      case 'MEAN': flags |= 4; break
      case 'MEAN_REFERENCE': flags |= 8; break
      case 'MEANLINE': flags |= 16; break
      case 'DICHLINE': flags |= 32; break
      }
    })
    return flags
  }

  // Takes a query definition string and returns a query definition object
  exports.parseString = function (queryString) {
    // Decode string from base64
    let decodedString = ''
    try {
      decodedString = atob(queryString)
    } catch (e) {
      // Ignore, compute with empty string, get default empty query object
    }

    // Get key-value mapping
    const urlParams = new URLSearchParams(decodedString)

    // Get question selection
    const question = urlParams.get('q')

    // Get perspective selection
    const perspective = urlParams.get('p')

    // Get and parse selected perspective options
    const optionsString = urlParams.get('o')
    let optionsArray = []
    if (typeof optionsString === 'string') {
      optionsArray = optionsString.split(',').map(function (o) { return Number(o) })
    }
    // Get and parse query flags
    const flagString = urlParams.get('f')
    const flagArray = decodeQueryDefinitionFlags(flagString)

    // Return query definition object
    return { question: question, perspective: perspective, perspectiveOptions: optionsArray, flags: flagArray }
  }

  // Takes query definition elements and creates an encoded query definition string
  exports.encodeString = function (question, perspective, perspectiveOptions, flags) {
    const queryDefinitionItems = []

    // Add q=question if it exists
    if (typeof question === 'string' && question.length > 0) {
      queryDefinitionItems.push('q=' + question)
    }

    // Add p=perspective if it exists
    if (typeof perspective === 'string' && perspective.length > 0) {
      queryDefinitionItems.push('p=' + perspective)
    }

    // Add o = comma-separated list of perspective options
    if (Array.isArray(perspectiveOptions) && perspectiveOptions.length > 0) {
      queryDefinitionItems.push('o=' + perspectiveOptions.join(','))
    }

    // Add f = bit flags for flags
    if (Array.isArray(flags) && flags.length > 0) {
      queryDefinitionItems.push('f=' + encodeQueryDefinitionFlags(flags))
    }

    // Join query definition parts with & and encode to base64
    return btoa(queryDefinitionItems.join('&'))
  }
})(window.dax = window.dax || {})
