import {useCallback, useEffect, useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {createDrift} from '@delvtech/drift'
import {viemAdapter} from '@delvtech/drift-viem'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {CommandBuilder, V4ActionBuilder, V4ActionType} from 'doppler-router'
import {
  DOPPLER_V4_ADDRESSES,
  dopplerAbi,
  universalRouterAbi,
} from 'doppler-v4-sdk'
import {ReadQuoter} from 'doppler-v4-sdk/dist/entities/quoter/ReadQuoter'
import {
  type Address,
  encodeAbiParameters,
  formatEther,
  formatUnits,
  keccak256,
  maxUint256,
  parseEther,
  parseUnits,
  type PublicClient,
} from 'viem'
import * as chains from 'viem/chains'
import {useAccount, useBalance, usePublicClient, useWalletClient} from 'wagmi'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {type CreatorToken} from '#/components/hooks/useDopplerPonder'
import {RichText} from '#/components/RichText'

export function TokenDetailsDialog({
  control,
  creatorTokens,
}: {
  control: Dialog.DialogControlProps
  creatorTokens: CreatorToken[]
}) {
  const {_} = useLingui()
  const account = useAccount()
  const {data: walletClient} = useWalletClient(account)
  const publicClient = usePublicClient()
  const t = useTheme()
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [_quotedAmount, setQuotedAmount] = useState<bigint | null>(null)
  const [poolKeyAddress, setPoolKeyAddress] = useState<string | null>(null)
  const [chainName, setChainName] = useState<string | null>(null)

  const pool = creatorTokens[0].pool
  const {v4Quoter, universalRouter} = DOPPLER_V4_ADDRESSES[pool.chainId]
  const {data: _baseTokenBalance} = useBalance({
    address: account.address,
    token: pool.baseToken.address as Address,
  })

  const {data: _quoteTokenBalance} = useBalance({
    address: account.address,
    token: pool.quoteToken.address as Address,
  })

  const getPoolKey = useCallback(async () => {
    const poolKey = await publicClient?.readContract({
      address: pool.address as Address,
      abi: dopplerAbi,
      functionName: 'poolKey',
    })

    if (!poolKey) return

    return {
      currency0: poolKey[0],
      currency1: poolKey[1],
      fee: poolKey[2],
      tickSpacing: poolKey[3],
      hooks: poolKey[4],
    }
  }, [pool, publicClient])

  useEffect(() => {
    if (!pool) return
    const getPoolKeyAddress = async () => {
      const key = await getPoolKey()
      if (!key) return
      const encodedKey = encodeAbiParameters(
        [
          {type: 'address'},
          {type: 'address'},
          {type: 'uint24'},
          {type: 'int24'},
          {type: 'address'},
        ],
        [key.currency0, key.currency1, key.fee, key.tickSpacing, key.hooks],
      )
      setPoolKeyAddress(keccak256(encodedKey))

      setChainName(
        Object.values(chains)
          .find(value => value.id === +pool.chainId)
          ?.name.toLowerCase() ?? 'Unknown',
      )
    }

    getPoolKeyAddress()
  }, [pool, publicClient, getPoolKey])

  const fetchQuote = async (amountIn: bigint) => {
    if (!pool) return
    const drift = createDrift({
      adapter: viemAdapter({
        publicClient: publicClient as PublicClient,
        walletClient: walletClient,
      }) as any, // Type assertion needed due to adapter version mismatch
    })
    const quoter = new ReadQuoter(v4Quoter, drift)

    const key = await getPoolKey()
    if (!key) return

    const quote = await quoter.quoteExactInputV4({
      poolKey: key,
      zeroForOne: activeTab === 'buy' ? true : false,
      exactAmount: amountIn,
      hookData: '0x',
    })

    return quote?.amountOut
  }

  const executeSwap = async (amountIn: bigint) => {
    if (!pool) return
    if (!account.address || !walletClient)
      throw new Error('account must be connected')

    const poolKey = await publicClient?.readContract({
      address: pool.address as Address,
      abi: dopplerAbi,
      functionName: 'poolKey',
    })

    if (!poolKey) return

    const key = {
      currency0: poolKey[0],
      currency1: poolKey[1],
      fee: poolKey[2],
      tickSpacing: poolKey[3],
      hooks: poolKey[4],
    }

    const zeroForOne = activeTab === 'buy' ? true : false

    const actionBuilder = new V4ActionBuilder()
    const [actions, params] = actionBuilder
      .addSwapExactInSingle(key, zeroForOne, amountIn, 0n, '0x')
      .addAction(V4ActionType.SETTLE_ALL, [
        zeroForOne ? key.currency0 : key.currency1,
        maxUint256,
      ])
      .addAction(V4ActionType.TAKE_ALL, [
        zeroForOne ? key.currency1 : key.currency0,
        0,
      ])
      .build()
    const [commands, inputs] = new CommandBuilder()
      .addV4Swap(actions, params)
      .build()

    await walletClient?.writeContract({
      address: universalRouter,
      abi: universalRouterAbi,
      functionName: 'execute',
      args: [commands, inputs],
      value: zeroForOne ? amountIn : 0n,
    })
  }

  const formatNumber = (value: bigint) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(formatEther(value)))
  }

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100)
  }

  const handleAmountChange = async (value: string) => {
    setAmount(value)
    if (value && pool) {
      try {
        const amountIn = parseEther(value)
        const quote = await fetchQuote(amountIn)
        setQuotedAmount(quote ?? null)
      } catch (error) {
        console.error('Error fetching quote:', error)
        setQuotedAmount(null)
      }
    } else {
      setQuotedAmount(null)
    }
  }

  const onCancel = useCallback(() => {
    control.close()
  }, [control])

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

  return (
    <Dialog.Outer control={control} testID="tokenDetailsModal">
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`Token Details`)}
        style={[a.overflow_hidden]}
        contentContainerStyle={[a.px_0, a.pt_0]}
        header={
          <Dialog.Header renderLeft={cancelButton}>
            <Dialog.HeaderText>
              <Trans>Token Details</Trans>
            </Dialog.HeaderText>
          </Dialog.Header>
        }>
        <View style={[a.p_lg]}>
          <View style={[a.pb_lg, a.pt_md]}>
            {creatorTokens?.map((token, index) => (
              <View key={index} style={[a.gap_md]}>
                {token.image && (
                  <View style={[a.align_center]}>
                    <Image
                      source={{uri: token.image}}
                      style={[{width: 100, height: 100}, a.rounded_md]}
                    />
                  </View>
                )}

                <View style={[a.gap_sm]}>
                  <View style={[a.flex_row, a.gap_sm, a.justify_between]}>
                    <View style={[a.gap_2xs, {width: '50%'}]}>
                      <RichText
                        value={_(msg`Token Name`)}
                        style={[a.text_sm, t.atoms.text_contrast_medium]}
                      />
                      <RichText
                        value={`${token.name} (${token.symbol})`}
                        style={[a.text_md]}
                      />
                    </View>
                    <View style={[a.gap_2xs, {width: '50%'}]}>
                      <RichText
                        value={_(msg`Market Cap`)}
                        style={[a.text_sm, t.atoms.text_contrast_medium]}
                      />
                      <RichText
                        value={formatNumber(BigInt(pool.marketCapUsd) || 0n)}
                        style={[a.text_md]}
                      />
                    </View>
                  </View>

                  <View style={[a.flex_row, a.gap_sm, a.justify_between]}>
                    <View style={[a.gap_2xs, {width: '50%'}]}>
                      <RichText
                        value={_(msg`24h Change`)}
                        style={[a.text_sm, t.atoms.text_contrast_medium]}
                      />
                      <RichText
                        value={formatPercent(
                          Number(pool.percentDayChange) || 0,
                        )}
                        style={[a.text_md]}
                      />
                    </View>

                    <View style={[a.gap_2xs, {width: '50%'}]}>
                      <RichText
                        value={_(msg`Total Supply`)}
                        style={[a.text_sm, t.atoms.text_contrast_medium]}
                      />
                      <RichText
                        value={formatUnits(BigInt(token.totalSupply), 18)}
                        style={[a.text_md]}
                      />
                    </View>
                  </View>
                  <View style={[a.flex_row, a.gap_sm, a.justify_between]}>
                    <View style={[a.gap_2xs, {width: '50%'}]}>
                      <RichText
                        value={_(msg`Holder Count`)}
                        style={[a.text_sm, t.atoms.text_contrast_medium]}
                      />
                      <RichText
                        value={token.holderCount.toString()}
                        style={[a.text_md]}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={[a.p_lg, a.pt_0]}>
          <View style={[a.gap_md]}>
            <View style={[a.flex_row, a.gap_sm]}>
              <Button
                label={_(msg`Buy`)}
                variant="outline"
                color={activeTab === 'buy' ? 'primary' : 'secondary'}
                size="small"
                onPress={() => setActiveTab('buy')}
                style={[a.flex_1, a.justify_center]}>
                <ButtonText>
                  <Trans>Buy</Trans>
                </ButtonText>
              </Button>
              <Button
                label={_(msg`Sell`)}
                variant="outline"
                color={activeTab === 'sell' ? 'primary' : 'secondary'}
                size="small"
                onPress={() => setActiveTab('sell')}
                style={[a.flex_1, a.justify_center]}>
                <ButtonText>
                  <Trans>Sell</Trans>
                </ButtonText>
              </Button>
            </View>

            <View>
              <TextField.LabelText>
                <Trans>
                  Amount (
                  {activeTab === 'buy'
                    ? pool.quoteToken.symbol
                    : pool.baseToken.symbol}
                  )
                </Trans>
              </TextField.LabelText>
              <TextField.Root>
                <TextField.Input
                  testID="tokenAmountInput"
                  value={amount}
                  onChangeText={handleAmountChange}
                  label={_(msg`Amount`)}
                  placeholder={_(msg`0.00`)}
                  keyboardType="decimal-pad"
                />
              </TextField.Root>

              {_quotedAmount !== null && (
                <RichText
                  value={`You will receive: ${formatEther(_quotedAmount)} ${
                    activeTab === 'buy'
                      ? pool.baseToken.symbol
                      : pool.quoteToken.symbol
                  }`}
                  style={[a.text_sm, t.atoms.text_contrast_medium, a.pt_sm]}
                />
              )}
            </View>

            <Button
              testID="swapTokenButton"
              variant="solid"
              color="primary"
              size="large"
              onPress={() => executeSwap(parseUnits(amount, 18))}
              label={_(msg`Swap`)}
              style={[a.w_full]}>
              <ButtonText>
                <Trans>Swap</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>

        {chainName && poolKeyAddress && (
          <View style={[a.p_lg, a.pt_0]}>
            <iframe
              height="800px"
              width="100%"
              id="geckoterminal-embed"
              title="GeckoTerminal Embed"
              src={`https://www.geckoterminal.com/${chainName}/pools/${poolKeyAddress}?embed=1&info=0&swaps=1&grayscale=0&light_chart=0&chart_type=price&resolution=5m`}
              allow="clipboard-write"
              allowFullScreen
            />
          </View>
        )}
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
