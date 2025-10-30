import {View} from 'react-native'
import {Trans} from '@lingui/macro'
import {AppKitButton, useAccount, useAppKit} from '@reown/appkit-react-native'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export function WalletComponents() {
  const {address, isConnected} = useAccount()
  const t = useTheme()

  const {disconnect} = useAppKit()

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
      <AppKitButton />
    </View>
  )
}
