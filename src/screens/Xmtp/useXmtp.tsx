import {useEffect, useState} from 'react'
import {Client, type Conversation, type Signer} from '@xmtp/browser-sdk'
import {toBytes} from 'viem'
import {useAccount, useSignMessage, useSwitchChain} from 'wagmi'

export function useXmtp() {
  const account = useAccount()
  const {switchChain} = useSwitchChain()
  const {signMessageAsync} = useSignMessage()

  const [ready, setReady] = useState(false)
  const [client, setClient] = useState<Client | null>(null)

  useEffect(() => {
    if (!account.address) return
  }, [account.address])

  useEffect(() => {
    async function initClient() {
      if (!account.address) return

      // Switch to mainnet
      switchChain({chainId: 1})

      // Create signer but don't use it yet
      const signer = createSCWSigner(
        account.address,
        (message: string) => signMessageAsync({message}),
        account.chainId,
      )

      const dbEncryptionKey = window.crypto.getRandomValues(new Uint8Array(32))
      const newClient = await Client.create(signer, {dbEncryptionKey})
      setClient(newClient)
      setReady(true)
    }

    initClient()

    return () => {
      setReady(false)
    }
  }, [account.address, account.chainId, switchChain, signMessageAsync])

  const newDm = async (inboxIdOrAddress: string) => {
    if (!client) return

    let conversation: Conversation | undefined
    if (isValidEthereumAddress(inboxIdOrAddress)) {
      conversation = await client.conversations.newDmWithIdentifier({
        identifier: inboxIdOrAddress,
        identifierKind: 'Ethereum',
      })
    } else if (isValidInboxId(inboxIdOrAddress)) {
      conversation = await client.conversations.newDm(inboxIdOrAddress)
    } else {
      console.error('Invalid member ID format')
      return
    }

    return conversation
  }

  const sendMessage = async (conversation: Conversation, content: string) => {
    if (!client) {
      console.error('XMTP client not initialized')
      return
    }

    try {
      await conversation.sendOptimistic(content)
      await conversation.publishMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  const createSCWSigner = (
    address: `0x${string}`,
    signMessage: (message: string) => Promise<string> | string,
    chainId: bigint | number = 1,
  ): Signer => {
    console.log('Creating Smart Contract Wallet signer for address:', address)

    return {
      // Mark this as a Smart Contract Wallet signer
      type: 'SCW',
      getIdentifier: () => ({
        identifier: address.toLowerCase(),
        identifierKind: 'Ethereum',
      }),
      signMessage: async (message: string) => {
        // Sign the message using the smart contract wallet
        console.log('Smart Contract Wallet signing message')
        try {
          const signature = await signMessage(message)
          console.log('Smart Contract Wallet signature received:', signature)

          const signatureBytes = toBytes(signature)
          console.log('Signature bytes length:', signatureBytes.length)

          return signatureBytes
        } catch (error) {
          console.error('Error in Smart Contract Wallet signMessage:', error)
          throw error
        }
      },
      // Include getChainId for SCW compatibility
      getChainId: () => {
        console.log('SCW getChainId called, value:', chainId)
        return typeof chainId === 'undefined'
          ? BigInt(1)
          : BigInt(chainId.toString())
      },
    }
  }

  return {
    ready,
    client,
    newDm,
    sendMessage,
  }
}

export const isValidEthereumAddress = (
  address: string,
): address is `0x${string}` => /^0x[a-fA-F0-9]{40}$/.test(address)

export const isValidInboxId = (inboxId: string): inboxId is string =>
  /^[a-z0-9]{64}$/.test(inboxId)
