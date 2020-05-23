import React, { useState } from 'react'
import {
  View,
  Text
} from 'react-native'

import LoginWebView from './components/LoginWebView'

const App = () => {
  const [parsedInfo, setParsedInfo] = useState(null)

  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      {
        parsedInfo
          ? <Text style={{ margin: 10 }}>
            { parsedInfo.map(e => `${e.name}(${e.key}): ${e.value}\n\n`) }
          </Text>

          : <LoginWebView onInfoParsed={setParsedInfo} />
      }
    </View>
  )
}

export default App
