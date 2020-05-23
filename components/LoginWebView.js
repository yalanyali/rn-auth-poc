import React, { useRef, useState } from 'react'
import { WebView } from 'react-native-webview'

const LOGIN_PAGE = 'https://oas.fh-erfurt.de/IDM/jsps/login/Login.jsf'

// Seems to be constant
// If not, we could find it: Value of 'Primary Role DN' key in table
/*
// TODO: Check old js compatibility
const neighborEl = [...document.querySelectorAll('td')].find(el => el.textContent === 'Primary Role DN:')
const url = neighborEl.nextElementSibling.querySelector('a').href // javascript:code type url
*/
const INFO_PAGE = 'https://oas.fh-erfurt.de/IDM/portal/portlet/Selbstauskunft?urlType=Render&novl-regid=Selbstauskunft&novl-inst=IDM.Selbstauskunft&wsrp-mode=view&wsrp-windowstate=normal&MODE=MODE_VIEW&ENTITY_DEFINITION=organizationalRole&value-position=0&CN=cn%3Db80adac4-6ca8-4d72-9964-433322c128cd%2Cou%3Drole%2Co%3Duni'

// URL after successful login:
// https://oas.fh-erfurt.de/IDM/portal/cn/DefaultContainerPage/SelfService
const LOGIN_PROOF_STRING = 'IDM/portal'

// URL after successful redirect to info page:
// https://oas.fh-erfurt.de/IDM/portal/portlet/Selbstauskunft?novl-inst=IDM.Selbstauskunft
const INFO_PAGE_PROOF_STRING = 'IDM.Selbstauskunft'

// Remote fetching would make this more flexible for possible changes
// Kept backwards compatible for older webview implementations
const JS_SNIPPETS = {
  CHECK_COOKIE: `
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
      type: "cookie",
      data: document.cookie
      })
    )
  `,
  PARSE_INFO: `
    var info = []
    for (let key in defObj.map.a.map) {
      var value = entObj.map.a.map[key].map.v[0]
      if (value) {
        info.push({
          key: key,
          value: value,
          name: defObj.map.a.map[key].map.l
        })
      }
    }
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "info",
        data: info
      })
    )
  `
}

export default function LoginWebView (props) {
  // const { width, height } = useDimensions().window
  const [loggedIn, setLoggedIn] = useState(false)

  const webview = useRef(null)

  // Generator to make snippets easier to write
  const generateFn = (functionBody) => `(function () { ${functionBody} }());`
  // JS inject
  const evalWebView = (js) => webview.current.injectJavaScript(generateFn(js))
  // Redirect webview
  const redirect = (url) => {
    webview.current.injectJavaScript(`window.location = "${url}"`)
  }

  const onNavigationStateChange = navigationState => {
    const { url, loading } = navigationState
    // NavigationState changes on start AND end of navigation
    if (!url || loading) return

    // console.log('URL: ', url)

    if (loggedIn) {
      // Check if info page
      if (url.includes(INFO_PAGE_PROOF_STRING)) {
        // On info page
        // Parse info
        evalWebView(JS_SNIPPETS.PARSE_INFO)
      }
    } else {
      // Check if logged in
      if (url.includes(LOGIN_PROOF_STRING)) {
        // Login successful
        // Post cookie message
        evalWebView(JS_SNIPPETS.CHECK_COOKIE)
      }
    }
  }

  const onMessage = event => {
    const message = JSON.parse(event.nativeEvent.data)
    if (message.type === 'cookie') {
      // Got cookies, not really important for login check but maybe safer?
      if (message.data.includes('JSESSIONID')) {
        // Logged in, redirect to info page
        setLoggedIn(true)
        webview.current.stopLoading()
        redirect(INFO_PAGE)
      }
    } else if (message.type === 'info') {
      // Set App.js state
      props.onInfoParsed(message.data)
    }
  }

  return (
    <WebView
      ref={webview}
      source={{ uri: LOGIN_PAGE }}
      onNavigationStateChange={onNavigationStateChange}
      onMessage={onMessage}
    />
  )
}
