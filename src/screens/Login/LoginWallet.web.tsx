import {View} from 'react-native'
import {Trans} from '@lingui/macro'
import {useAccount, useConnect, useDisconnect} from 'wagmi'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export function WalletComponents() {
  const {isConnected, address} = useAccount()
  const {connectAsync, connectors} = useConnect()
  const {disconnect} = useDisconnect()
  const t = useTheme()

  const baseAccountConnector = connectors.find(
    connector => connector.id === 'baseAccount',
  )

  const handleConnect = async () => {
    if (baseAccountConnector) {
      try {
        await connectAsync({connector: baseAccountConnector})
      } catch (error) {
        console.error('Failed to connect:', error)
      }
    }
  }

  if (isConnected && address) {
    return (
      <View style={[a.flex_1, a.align_center, a.gap_md]}>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          Connected: {address.slice(0, 6)}...{address.slice(-4)}
        </Text>
        <Button
          onPress={() => disconnect()}
          variant="solid"
          color="secondary"
          label="Disconnect Wallet">
          <ButtonText>
            <Trans>Disconnect Wallet</Trans>
          </ButtonText>
        </Button>
      </View>
    )
  }

  return (
    <View style={[a.flex_1, a.align_center, a.gap_md]}>
      <Button
        onPress={handleConnect}
        variant="solid"
        color="primary"
        label="Connect with Base Account"
        disabled={!baseAccountConnector}>
        <ButtonText>
          <Trans>Connect or create Base Account</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}
