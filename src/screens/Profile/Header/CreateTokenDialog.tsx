import React, {useCallback, useEffect, useState} from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {Chain} from 'viem'
import {useAccount, useChainId,useSwitchChain} from 'wagmi'

import {isNative} from '#/platform/detection'
import {Shadow} from '#/state/cache/types'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {ChevronTop_Stroke2_Corner0_Rounded as ChevronDown} from '#/components/icons/Chevron'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'

// Define Unichain Sepolia testnet chain
const unichainSepolia: Chain = {
  id: 641_230_074,
  name: 'Unichain Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {http: ['https://rpc.unichain.io/sepolia']},
    public: {http: ['https://rpc.unichain.io/sepolia']},
  },
  blockExplorers: {
    default: {name: 'Explorer', url: 'https://explorer.unichain.io/sepolia'},
  },
  testnet: true,
}

// Define main Unichain network
const unichain: Chain = {
  id: 641_230,
  name: 'Unichain',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {http: ['https://rpc.unichain.io']},
    public: {http: ['https://rpc.unichain.io']},
  },
  blockExplorers: {
    default: {name: 'Explorer', url: 'https://explorer.unichain.io'},
  },
  testnet: false,
}

// Map chain IDs to chain objects for easy lookup
const chainMap: Record<string, Chain> = {
  'unichain-sepolia': unichainSepolia,
  unichain: unichain,
}

export function CreateTokenDialog({
  profile,
  control,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  control: Dialog.DialogControlProps
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {isConnected} = useAccount()
  const currentChainId = useChainId()
  const {
    switchChain,
    isPending: isSwitchingChain,
    error: switchChainError,
  } = useSwitchChain()

  // Form states
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [priceRangeStartTick, setPriceRangeStartTick] = useState('')
  const [priceRangeEndTick, setPriceRangeEndTick] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedChain, setSelectedChain] = useState(['unichain-sepolia'])

  // Get the currently selected chain object
  const currentChain = chainMap[selectedChain[0]]

  // Track if required fields are filled
  const isFormValid = tokenName.trim() !== '' && tokenSymbol.trim() !== ''

  // Track if the form is dirty (has been modified)
  const dirty =
    tokenName !== '' ||
    tokenSymbol !== '' ||
    priceRangeStartTick !== '' ||
    priceRangeEndTick !== ''

  // Handle chain change
  const handleChainChange = useCallback(
    (values: string[]) => {
      setSelectedChain(values)
      const newChain = chainMap[values[0]]

      // Only attempt to switch chain if connected and the chain is different
      if (isConnected && newChain.id !== currentChainId) {
        try {
          switchChain({chainId: newChain.id})
        } catch (err) {
          console.error('Failed to switch chain:', err)
        }
      }
    },
    [isConnected, currentChainId, switchChain],
  )

  // Show toast notification for chain switch errors
  useEffect(() => {
    if (switchChainError) {
      Toast.show(_(msg`Failed to switch network: ${switchChainError.message}`))
    }
  }, [switchChainError, _])

  // Reset form
  const resetForm = useCallback(() => {
    setTokenName('')
    setTokenSymbol('')
    setPriceRangeStartTick('')
    setPriceRangeEndTick('')
    setShowAdvanced(false)
    setSelectedChain(['unichain-sepolia'])
  }, [])

  // Handle form submission
  const onSubmit = useCallback(() => {
    // TODO: Implement token creation logic
    console.log('Creating token with:', {
      name: tokenName,
      symbol: tokenSymbol,
      chain: currentChain,
      chainId: currentChain.id,
      startTick: parseInt(priceRangeStartTick, 10) || 0,
      endTick: parseInt(priceRangeEndTick, 10) || 0,
    })

    // Reset form and close dialog
    resetForm()
    control.close()
  }, [
    tokenName,
    tokenSymbol,
    currentChain,
    priceRangeStartTick,
    priceRangeEndTick,
    resetForm,
    control,
  ])

  // Close dialog (cancel form)
  const onCancel = useCallback(() => {
    resetForm()
    control.close()
  }, [resetForm, control])

  // Handle button click for demo
  const handleButtonClick = useCallback(() => {
    console.log('hello')
  }, [])

  // Toggle advanced settings
  const toggleAdvanced = useCallback(() => {
    setShowAdvanced(prev => !prev)
  }, [])

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
                  <Trans>Blockchain</Trans>
                </TextField.LabelText>
                <ToggleButton.Group
                  label={_(msg`Select chain`)}
                  values={selectedChain}
                  onChange={handleChainChange}
                  disabled={isSwitchingChain}>
                  <ToggleButton.Button
                    name="unichain-sepolia"
                    label={_(msg`${unichainSepolia.name} testnet`)}
                    testID="chainSelectorUnichainSepolia">
                    <ToggleButton.ButtonText>
                      <Trans>{unichainSepolia.name} testnet</Trans>
                    </ToggleButton.ButtonText>
                  </ToggleButton.Button>
                  <ToggleButton.Button
                    name="unichain"
                    label={_(msg`${unichain.name}`)}
                    testID="chainSelectorUnichain">
                    <ToggleButton.ButtonText>
                      <Trans>{unichain.name}</Trans>
                    </ToggleButton.ButtonText>
                  </ToggleButton.Button>
                </ToggleButton.Group>
                {isSwitchingChain && (
                  <Text
                    style={[a.mt_xs, a.text_sm, t.atoms.text_contrast_medium]}>
                    <Trans>Switching network...</Trans>
                  </Text>
                )}
                {switchChainError && (
                  <Text
                    style={[
                      a.mt_xs,
                      a.text_sm,
                      {color: t.palette.negative_500},
                    ]}>
                    <Trans>Failed to switch network. Please try again.</Trans>
                  </Text>
                )}
              </View>

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

              {/* Advanced settings collapsible section */}
              <View style={[a.mt_sm]}>
                <Button
                  testID="advancedSettingsToggle"
                  variant="ghost"
                  color="secondary"
                  size="small"
                  onPress={toggleAdvanced}
                  label={_(msg`Advanced settings`)}
                  style={[a.flex_row, a.justify_start, a.py_xs]}>
                  {showAdvanced ? (
                    <ChevronDown
                      size="sm"
                      style={[t.atoms.text_contrast_medium]}
                    />
                  ) : (
                    <ChevronRight
                      size="sm"
                      style={[t.atoms.text_contrast_medium]}
                    />
                  )}
                  <ButtonText
                    style={[a.ml_xs, a.text_sm, t.atoms.text_contrast_medium]}>
                    <Trans>Advanced settings</Trans>
                  </ButtonText>
                </Button>

                {showAdvanced && (
                  <View style={[a.mt_sm, a.ml_md]}>
                    <View>
                      <TextField.LabelText>
                        <Trans>Price Range</Trans>
                      </TextField.LabelText>
                      <View style={[a.flex_row, a.gap_md]}>
                        <View style={[a.flex_1]}>
                          <TextField.LabelText>
                            <Trans>Start Tick</Trans>
                          </TextField.LabelText>
                          <TextField.Root>
                            <TextField.Input
                              testID="startTickInput"
                              value={priceRangeStartTick}
                              onChangeText={setPriceRangeStartTick}
                              label={_(msg`Start Tick`)}
                              placeholder={_(msg`e.g. 100`)}
                              keyboardType="numeric"
                            />
                          </TextField.Root>
                        </View>
                        <View style={[a.flex_1]}>
                          <TextField.LabelText>
                            <Trans>End Tick</Trans>
                          </TextField.LabelText>
                          <TextField.Root>
                            <TextField.Input
                              testID="endTickInput"
                              value={priceRangeEndTick}
                              onChangeText={setPriceRangeEndTick}
                              label={_(msg`End Tick`)}
                              placeholder={_(msg`e.g. 1000`)}
                              keyboardType="numeric"
                            />
                          </TextField.Root>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              <View style={[a.mt_lg]}>
                <Button
                  testID="createTokenButton"
                  variant="solid"
                  color="primary"
                  size="large"
                  onPress={handleButtonClick}
                  disabled={!isFormValid || isSwitchingChain}
                  label={_(msg`Create Token`)}>
                  <ButtonText>
                    <Trans>Create Token</Trans>
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
