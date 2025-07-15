import {createDrift} from '@delvtech/drift'
import {viemAdapter} from '@delvtech/drift-viem'
import {CommandBuilder, V4ActionBuilder, V4ActionType} from 'doppler-router'
import {
  DOPPLER_V4_ADDRESSES,
  dopplerAbi,
  ReadQuoter,
  universalRouterAbi,
} from 'doppler-v4-sdk'
import {
  type Address,
  encodeAbiParameters,
  keccak256,
  maxUint256,
  type PublicClient,
} from 'viem'
import {useAccount, usePublicClient, useWalletClient} from 'wagmi'

import {type Pool} from './useDopplerPonder'

export const useDoppler = () => {
  const account = useAccount()
  const {data: walletClient} = useWalletClient(account)
  const publicClient = usePublicClient()

  const getDrift = () => {
    return createDrift({
      adapter: viemAdapter({
        publicClient: publicClient as PublicClient,
        walletClient: walletClient,
      }) as any, // Type assertion needed due to adapter version mismatch
    })
  }

  const getPoolKey = async (pool: Pool) => {
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
  }

  const getPoolKeyAddress = async (pool: Pool) => {
    const key = await getPoolKey(pool)
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
    return keccak256(encodedKey)
  }

  const fetchQuote = async (
    pool: Pool,
    amountIn: bigint,
    zeroForOne: boolean,
  ) => {
    const {v4Quoter} = DOPPLER_V4_ADDRESSES[pool.chainId]
    if (!pool) return

    const drift = getDrift()
    const quoter = new ReadQuoter(v4Quoter, drift)

    const key = await getPoolKey(pool)
    if (!key) return

    const quote = await quoter.quoteExactInputV4({
      poolKey: key,
      zeroForOne,
      exactAmount: amountIn,
      hookData: '0x',
    })

    return quote?.amountOut
  }

  const executeSwap = async (
    pool: Pool,
    amountIn: bigint,
    zeroForOne: boolean,
  ) => {
    if (!pool) {
      throw new Error('Pool is not defined')
    }
    if (!account.address || !walletClient) {
      throw new Error('account must be connected')
    }
    if (amountIn === 0n) {
      throw new Error('Amount in is 0')
    }

    const {universalRouter} = DOPPLER_V4_ADDRESSES[pool.chainId]

    const key = await getPoolKey(pool)
    if (!key) return

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

    return await walletClient?.writeContract({
      address: universalRouter,
      abi: universalRouterAbi,
      functionName: 'execute',
      args: [commands, inputs],
      value: zeroForOne ? amountIn : 0n,
    })
  }

  return {
    getDrift,
    getPoolKey,
    getPoolKeyAddress,
    fetchQuote,
    executeSwap,
  }
}
