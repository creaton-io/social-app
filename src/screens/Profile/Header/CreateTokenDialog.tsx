import {useCallback, useEffect, useState} from 'react'
import {View} from 'react-native'
import {createDrift} from '@delvtech/drift'
import {viemAdapter} from '@delvtech/drift-viem'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {DOPPLER_V4_ADDRESSES, ReadWriteFactory} from 'doppler-v4-sdk'
import {type PublicClient} from 'viem'
import {getBlock} from 'viem/actions'
import {
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from 'wagmi'

import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {tokenParams} from './poolConfig'

export function CreateTokenDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {_} = useLingui()
  const t = useTheme()

  const {isPending: isSwitchingChain, switchChain} = useSwitchChain()
  const publicClient = usePublicClient()
  const {data: walletClient} = useWalletClient()
  const chainId = useChainId()

  // Form states
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [isDeploying, setIsDeploying] = useState(false)

  // Track if required fields are filled
  const isFormValid = tokenName.trim() !== '' && tokenSymbol.trim() !== ''

  // Track if the form is dirty (has been modified)
  const dirty = tokenName !== '' || tokenSymbol !== ''

  // Reset form
  const resetForm = useCallback(() => {
    setTokenName('')
    setTokenSymbol('')
  }, [])

  useEffect(() => {
    if (chainId !== 84532) {
      switchChain({chainId: 84532})
    }
  }, [chainId, switchChain])

  // Handle form submission
  const onSubmit = useCallback(async () => {
    if (!walletClient) {
      console.log('walletClient not found')
      return
    }

    setIsDeploying(true)
    try {
      const addresses = DOPPLER_V4_ADDRESSES[chainId]

      const drift = createDrift({
        adapter: viemAdapter({
          publicClient: publicClient as PublicClient,
          walletClient: walletClient,
        }),
      })

      const block = await getBlock(walletClient)

      const deployParams = tokenParams({
        name: tokenName,
        symbol: tokenSymbol,
        timestamp: block.timestamp,
      })

      // @ts-ignore
      const rwFactory = new ReadWriteFactory(addresses.airlock, drift)
      const {createParams, hook, token} = rwFactory.buildConfig(
        deployParams,
        addresses,
      )
      console.log('createParams: ', createParams)
      console.log('hook: ', hook)
      console.log('token: ', token)

      await rwFactory.simulateCreate(createParams)
      await rwFactory.create(createParams)
      Toast.show(
        _(msg({message: 'Token created successfully', context: 'toast'})),
      )
    } catch (error) {
      Toast.show(
        _(msg({message: 'Error deploying token', context: 'toast'})),
        'xmark',
      )
      console.error('Error deploying token:', error)
    } finally {
      setIsDeploying(false)
      // Reset form and close dialog
      resetForm()
      control.close()
    }
  }, [
    tokenName,
    tokenSymbol,
    resetForm,
    control,
    publicClient,
    walletClient,
    chainId,
    _,
  ])

  // Close dialog (cancel form)
  const onCancel = useCallback(() => {
    resetForm()
    control.close()
  }, [resetForm, control])

  const cancelButton = useCallback(
    () => (
      <Button
        label={_(msg`Cancel`)}
        onPress={onCancel}
        size="small"
        color="primary"
        variant="ghost"
        style={[a.rounded_full]}
        testID="createTokenCancelBtn">
        <ButtonText style={[a.text_md]}>
          <Trans>Cancel</Trans>
        </ButtonText>
      </Button>
    ),
    [onCancel, _],
  )

  const createButton = useCallback(
    () => (
      <Button
        label={_(msg`Create`)}
        onPress={onSubmit}
        disabled={!dirty || !isFormValid || isSwitchingChain}
        size="small"
        color="primary"
        variant="ghost"
        style={[a.rounded_full]}
        testID="createTokenSubmitBtn">
        <ButtonText
          style={[
            a.text_md,
            (!dirty || !isFormValid || isSwitchingChain) &&
              t.atoms.text_contrast_low,
          ]}>
          <Trans>Create</Trans>
        </ButtonText>
      </Button>
    ),
    [_, t, dirty, isFormValid, isSwitchingChain, onSubmit],
  )

  return (
    <Dialog.Outer control={control} testID="createTokenModal">
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`Create Token`)}
        style={[a.overflow_hidden]}
        contentContainerStyle={[a.px_0, a.pt_0]}
        header={
          <Dialog.Header renderLeft={cancelButton} renderRight={createButton}>
            <Dialog.HeaderText>
              <Trans>Create Token</Trans>
            </Dialog.HeaderText>
          </Dialog.Header>
        }>
        <View style={[a.p_lg]}>
          <View style={[a.pb_lg, a.pt_md]}>
            <View style={[a.gap_md]}>
              <View>
                <TextField.LabelText>
                  <Trans>Token Name</Trans>
                </TextField.LabelText>
                <TextField.Root>
                  <TextField.Input
                    testID="tokenNameInput"
                    value={tokenName}
                    onChangeText={setTokenName}
                    label={_(msg`Token Name`)}
                    placeholder={_(msg`e.g. My Creator Token`)}
                    autoCapitalize="words"
                  />
                </TextField.Root>
              </View>

              <View>
                <TextField.LabelText>
                  <Trans>Symbol</Trans>
                </TextField.LabelText>
                <TextField.Root>
                  <TextField.Input
                    testID="tokenSymbolInput"
                    value={tokenSymbol}
                    onChangeText={setTokenSymbol}
                    label={_(msg`Symbol`)}
                    placeholder={_(msg`e.g. MCT`)}
                    autoCapitalize="characters"
                    maxLength={6}
                  />
                </TextField.Root>
              </View>

              <View style={[a.mt_lg, a.flex_row, a.justify_between, a.gap_md]}>
                <Button
                  testID="createTokenButton"
                  variant="solid"
                  color="primary"
                  size="large"
                  onPress={onSubmit}
                  disabled={!isFormValid || isSwitchingChain || isDeploying}
                  label={_(msg`Create Token`)}
                  style={[a.flex_1]}>
                  <ButtonText>
                    <Trans>Create Token</Trans>
                  </ButtonText>
                </Button>

                <Button
                  testID="cancelTokenButton"
                  variant="ghost"
                  color="primary"
                  size="large"
                  onPress={onCancel}
                  disabled={isDeploying}
                  label={_(msg`Cancel`)}
                  style={[a.flex_1]}>
                  <ButtonText>
                    <Trans>Cancel</Trans>
                  </ButtonText>
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
