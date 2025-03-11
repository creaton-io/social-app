import React, {useCallback, useEffect, useState} from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {createDrift} from '@delvtech/drift'
import {viemAdapter} from '@delvtech/drift-viem'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  type CreateParams,
  DEFAULT_PD_SLUGS,
  DOPPLER_V4_ADDRESSES,
  ReadWriteFactory,
} from 'doppler-v4-sdk'
import {encodeAbiParameters, PublicClient} from 'viem'
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from 'wagmi'
import {unichainSepolia} from 'wagmi/chains'

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

export function CreateTokenDialog({
  profile,
  control,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  control: Dialog.DialogControlProps
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {isConnected, chain} = useAccount()
  const currentChainId = useChainId()
  const publicClient = usePublicClient()
  const {data: walletClient} = useWalletClient()
  const {chains, switchChain} = useSwitchChain()

  // Form states
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [priceRangeStartTick, setPriceRangeStartTick] = useState('')
  const [priceRangeEndTick, setPriceRangeEndTick] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Track if required fields are filled
  const isFormValid = tokenName.trim() !== '' && tokenSymbol.trim() !== ''

  // Track if the form is dirty (has been modified)
  const dirty =
    tokenName !== '' ||
    tokenSymbol !== '' ||
    priceRangeStartTick !== '' ||
    priceRangeEndTick !== ''

  // Show toast notification for errors
  useEffect(() => {
    // Any other effects that need to be preserved
  }, [])

  // Reset form
  const resetForm = useCallback(() => {
    setTokenName('')
    setTokenSymbol('')
    setPriceRangeStartTick('')
    setPriceRangeEndTick('')
    setShowAdvanced(false)
  }, [])

  // Handle form submission
  const onSubmit = useCallback(() => {
    const factoryAddress = '0x0000000000000000000000000000000000000000'
    if (!walletClient) {
      Toast.show(_(msg`Please connect your wallet first.`))
      return
    }

    const DEFAULT_MIN_PROCEEDS = BigInt('1')
    const DEFAULT_MAX_PROCEEDS = BigInt('10')
    const DEFAULT_STARTING_TIME = BigInt('1')
    const DEFAULT_ENDING_TIME = BigInt('3')
    const DEFAULT_GAMMA = BigInt('800')
    const DEFAULT_EPOCH_LENGTH = BigInt('400')
    const DEFAULT_START_TICK = BigInt('6000')
    const DEFAULT_END_TICK = BigInt('60000')
    const DEFAULT_FEE = BigInt('0')
    const DEFAULT_TICK_SPACING = BigInt('8')

    try {
      if (!DOPPLER_V4_ADDRESSES[chain.id]) {
        switchChain({chainId: unichainSepolia.id})
        Toast.show(_(msg`Switched to Unichain Sepolia.`))
        return
      }

      // bytes memory tokenFactoryData = abi.encode(DEFAULT_TOKEN_NAME, DEFAULT_TOKEN_SYMBOL, 0, 0, new address[](0), new uint256[](0), "");
      const tokenFactoryData = encodeAbiParameters(
        [
          {type: 'string', name: 'name'},
          {type: 'string', name: 'symbol'},
          {type: 'uint256', name: 'initialSupply'},
          {type: 'uint256', name: 'numTokensToSell'},
          {type: 'address[]', name: 'pdSlugs'},
          {type: 'uint256[]', name: 'pdSlugWeights'},
          {type: 'string', name: 'uri'},
        ],
        [tokenName, tokenSymbol, 0n, 0n, [], [], ''],
      )
      // bytes memory governanceFactoryData = abi.encode(DEFAULT_TOKEN_NAME, 7200, 50_400, 0);
      const governanceFactoryData = encodeAbiParameters(
        [
          {type: 'string', name: 'name'},
          {type: 'uint256', name: 'duration'},
          {type: 'uint256', name: 'minProceeds'},
          {type: 'uint256', name: 'maxProceeds'},
        ],
        [tokenName, 7200n, 50400n, 0n],
      )

      // bytes memory poolInitializerData = abi.encode(
      //       sqrtPrice,
      //       DEFAULT_MIN_PROCEEDS,
      //       DEFAULT_MAX_PROCEEDS,
      //       DEFAULT_STARTING_TIME,
      //       DEFAULT_ENDING_TIME,
      //       DEFAULT_START_TICK,
      //       DEFAULT_END_TICK,
      //       DEFAULT_EPOCH_LENGTH,
      //       DEFAULT_GAMMA,
      //       false,
      //       DEFAULT_PD_SLUGS,
      //       DEFAULT_FEE,
      //       DEFAULT_TICK_SPACING
      //   );
      const poolInitializerData = encodeAbiParameters(
        [
          {type: 'uint256', name: 'sqrtPrice'},
          {type: 'uint256', name: 'minProceeds'},
          {type: 'uint256', name: 'maxProceeds'},
          {type: 'uint256', name: 'startingTime'},
          {type: 'uint256', name: 'endingTime'},
          {type: 'uint256', name: 'startTick'},
          {type: 'uint256', name: 'endTick'},
          {type: 'uint256', name: 'epochLength'},
          {type: 'uint256', name: 'gamma'},
          {type: 'bool', name: 'isPaused'},
          {type: 'address[]', name: 'pdSlugs'},
          {type: 'uint256', name: 'fee'},
          {type: 'uint256', name: 'tickSpacing'},
        ],
        [
          0n,
          DEFAULT_MIN_PROCEEDS,
          DEFAULT_MAX_PROCEEDS,
          DEFAULT_STARTING_TIME,
          DEFAULT_ENDING_TIME,
          DEFAULT_START_TICK,
          DEFAULT_END_TICK,
          DEFAULT_EPOCH_LENGTH,
          DEFAULT_GAMMA,
          false,
          [],
          DEFAULT_FEE,
          DEFAULT_TICK_SPACING,
        ],
      )

      console.log('DOPPLER_V4_ADDRESSES', DOPPLER_V4_ADDRESSES)
      console.log('currentChain', chain)
      console.log(
        'DOPPLER_V4_ADDRESSES[currentChain.id]',
        DOPPLER_V4_ADDRESSES[chain.id],
      )

      const tokenCreationParams: CreateParams = {
        initialSupply: 1000000000000000000n, // Total supply of the token (might be increased later on)
        numTokensToSell: 1000000000000000000n, // Amount of tokens to sell in the Doppler hook
        numeraire: '0x0000000000000000000000000000000000000000', // Address of the numeraire token
        tokenFactory: DOPPLER_V4_ADDRESSES[chain.id].tokenFactory, // Address of the factory contract deploying the ERC20 token
        tokenFactoryData, // Arbitrary data to pass to the token factory
        governanceFactory: DOPPLER_V4_ADDRESSES[chain.id].governanceFactory, // Address of the factory contract deploying the governance
        governanceFactoryData, // Arbitrary data to pass to the governance factory
        poolInitializer: DOPPLER_V4_ADDRESSES[chain.id].v4Initializer, // Address of the pool initializer contract
        poolInitializerData, // Arbitrary data to pass to the pool initializer
        liquidityMigrator: DOPPLER_V4_ADDRESSES[chain.id].migrator, // Address of the liquidity migrator contract
        liquidityMigratorData: '0x', // Arbitrary data to pass to the liquidity migrator
        integrator: '0x0000000000000000000000000000000000000000', // Address of the front-end integrator
        salt: '0x', // Salt used by the different factories to deploy the contracts using CREATE2
        hook: '0x',
        token: '0x',
      }

      const drift = createDrift({
        adapter: viemAdapter({
          publicClient: publicClient as PublicClient,
          walletClient: walletClient,
        }),
      })

      const factory = new ReadWriteFactory(factoryAddress, drift)
      console.log('creating...', factory.create(tokenCreationParams))

      // Reset form and close dialog
      resetForm()
      control.close()
    } catch (error) {
      console.error('Error creating token:', error)
      Toast.show(_(msg`Error creating token. Please try again.`))
    }
  }, [
    tokenName,
    tokenSymbol,
    chain,
    resetForm,
    control,
    walletClient,
    publicClient,
    _,
    switchChain,
  ])

  // Close dialog (cancel form)
  const onCancel = useCallback(() => {
    resetForm()
    control.close()
  }, [resetForm, control])

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
        disabled={!dirty || !isFormValid}
        size="small"
        color="primary"
        variant="ghost"
        style={[a.rounded_full]}
        testID="createTokenSubmitBtn">
        <ButtonText
          style={[
            a.text_md,
            (!dirty || !isFormValid) && t.atoms.text_contrast_low,
          ]}>
          <Trans>Create</Trans>
        </ButtonText>
      </Button>
    ),
    [_, t, dirty, isFormValid, onSubmit],
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
                  onPress={onSubmit}
                  disabled={!isFormValid}
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
