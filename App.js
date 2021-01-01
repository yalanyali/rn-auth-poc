/* global fetch */
import React, { useState } from 'react'
import {
  StyleSheet, Button, View, SafeAreaView, Text, Alert
} from 'react-native'

import * as Keychain from 'react-native-keychain'

import LoginWebView from './components/LoginWebView'

const CREDENTIAL_NAMESPACE = 'ACCESS_TOKEN'

const saveAccessToken = (tokenString) => {
  console.log('Saving access token...')
  return Keychain.setInternetCredentials(CREDENTIAL_NAMESPACE, 'RANDOM_STRING_31', tokenString)
}

const getAccessToken = async () => {
  const result = await Keychain.getInternetCredentials(CREDENTIAL_NAMESPACE)
  if (result) {
    return result.password
  }
  return false
}

const App = () => {
  const [webViewActive, setWebViewActive] = useState(false)

  const sendCookie = async (cookieString) => {
    console.log('Sending token:', cookieString)
    try {
      const req = await fetch('https://beb1c114c93f.eu.ngrok.io/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionID: cookieString
        })
      })
      const res = await req.json()
      if (res.success) {
        await saveAccessToken(res.token)
        setWebViewActive(false)
        Alert.alert('Token retrieved, try accessing again to test token access!')
      } else {
        Alert.alert(`Authorization server error: ${res.errorMessage}`)
      }
    } catch (err) {
      console.error('SERVER FATAL ERROR:', err)
    }
  }

  const accessResource = async (token) => {
    try {
      const req = await fetch('https://beb1c114c93f.eu.ngrok.io/auth/access', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (req.status === 200) {
        // Successful
        const res = await req.json()
        Alert.alert(`Token valid for: ${res.userAccessDomain}`)
      } else {
        Alert.alert('Invalid token.')
      }
    } catch (err) {
      console.error('SERVER FATAL ERROR:', err)
    }
  }

  const tryAccess = async () => {
    const savedToken = await getAccessToken(CREDENTIAL_NAMESPACE)
    if (savedToken) {
      accessResource(savedToken)
    } else {
      setWebViewActive(true)
    }
  }

  const clearToken = async () => {
    await Keychain.resetInternetCredentials(CREDENTIAL_NAMESPACE)
    Alert.alert('TOKEN CLEARED!')
  }

  if (webViewActive) {
    return (
      <SafeAreaView style={styles.container}>
        <LoginWebView onSuccessfulCookie={sendCookie} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.title}>
        To access the restricted resource, you need to have a valid token. If a saved token is not available, you will be redirected to the login page.
        </Text>
        <Button
          title='Try Access'
          onPress={tryAccess}
        />
      </View>
      <View style={styles.separator} />
      <View>
        <Text style={styles.title}>
        Access token is saved to the native sacure keychain after a successful login attempt. To verify the effect of the saved token, you can clear any saved tokens.
        </Text>
        <Button
          title='Clear Token'
          color='#f194ff'
          onPress={clearToken}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 16
  },
  title: {
    textAlign: 'center',
    marginVertical: 8
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  separator: {
    marginVertical: 8,
    borderBottomColor: '#737373',
    borderBottomWidth: StyleSheet.hairlineWidth
  }
})

export default App
