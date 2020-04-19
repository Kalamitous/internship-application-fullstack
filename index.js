/**
 * Element handler to change tab and page title
 */
class TitleHandler {
  element(element) {
    element.prepend('<< ')
    element.append(' >>')
  }
}

/**
 * Element handler to change description
 */
class DescriptionHandler {
  element(element) {
    element.setInnerContent(`Variant is stored in a cookie.`)
  }
}

/**
 * Element handler to change button text and URL
 */
class URLHandler {
  element(element) {
    element.setInnerContent('Click to see bird go zoom')
    element.setAttribute('href', 'https://i.imgur.com/MG0Sy7P.png')
  }
}

const VARIANTS_URL = "https://cfw-takehome.developers.workers.dev/api/variants"
const COOKIE_NAME = "variant"
const HTML_REWRITER = new HTMLRewriter()
  .on('title', new TitleHandler())
  .on('h1#title', new TitleHandler())
  .on('p#description', new DescriptionHandler())
  .on('a#url', new URLHandler())

/**
 * Returns JSON response from fetching VARIANTS_URL
 */
async function fetchData() {
  const response = await fetch(VARIANTS_URL)
  return await response.json()
}

/**
 * Returns response from fetching a variant
 * @param {string} url
 */
async function fetchVariant(url) {
  const response = await fetch(url)
  return response
}

/**
 * Gets variant from cookie or selects one randomly
 * @param {Request} request
 */
async function getVariant(request) {
  const cookie = getCookie(request)
  if (cookie) {
    return cookie
  }
  const data = await fetchData()
  return selectVariant(data)
}

/**
 * Randomly selects variant from a JSON response from fetchData()
 * @param {*} data
 */
function selectVariant(data) {
  return data.variants[Math.floor(Math.random() * data.variants.length)]
}

/**
 * Persist variant by writing cookie
 * @param {*} response 
 * @param {*} value 
 */
function setCookie(response, value) {
  response = new Response(response.body)
  response.headers.append('Set-Cookie', `${COOKIE_NAME}=${value}`)
  return response
}

/**
 * Retrieve variant by reading cookie
 * @param {*} request 
 */
function getCookie(request) {
  if (!request.headers.get('Cookie')) {
    return null
  }
  const name = COOKIE_NAME + '='
  const cookies = request.headers.get('Cookie').split(';')
  for (let i = 0; i < cookies.length; i++) {
    var cookie = cookies[i]
    while (cookie.charAt(0) == ' ') {
      cookie = cookie.substring(1, cookie.length)
    }
    if (cookie.indexOf(name) == 0) {
      return cookie.substring(name.length, cookie.length)
    }
  }
  return null
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Respond with appropriate variant
 * @param {Request} request
 */
async function handleRequest(request) {
  const variant = await getVariant(request)
  let response = await fetchVariant(variant)
  if (!getCookie(request)) {
    response = setCookie(response, variant)
  }
  return HTML_REWRITER.transform(response)
}
