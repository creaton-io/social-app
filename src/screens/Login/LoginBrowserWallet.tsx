import {StyleSheet, View} from 'react-native'
import {ConnectButton} from '@rainbow-me/rainbowkit'

// Simple RainbowKit wallet connection component
export function CustomConnectWallet() {
  return (
    <View style={styles.container}>
      <ConnectButton showBalance={false} chainStatus="none" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
})
