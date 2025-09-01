import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Client,
  type ClientOptions,
  type Conversation,
  type Signer,
} from '@xmtp/browser-sdk'
import {ReactionCodec} from '@xmtp/content-type-reaction'
import {RemoteAttachmentCodec} from '@xmtp/content-type-remote-attachment'
import {ReplyCodec} from '@xmtp/content-type-reply'
import {TransactionReferenceCodec} from '@xmtp/content-type-transaction-reference'
import {WalletSendCallsCodec} from '@xmtp/content-type-wallet-send-calls'
import {toBytes} from 'viem'
import {useSignMessage} from 'wagmi'
import {useSwitchChain} from 'wagmi'
import {useAccount} from 'wagmi'

export type InitializeClientOptions = {
  dbEncryptionKey?: Uint8Array
  env?: ClientOptions['env']
  loggingLevel?: ClientOptions['loggingLevel']
  signer: Signer
}

export type XMTPContextValue = {
  /**
   * The XMTP client instance
   */
  client?: Client<any>
  /**
   * Set the XMTP client instance
   */
  setClient: React.Dispatch<React.SetStateAction<Client<any> | undefined>>
  initialize: (
    options: InitializeClientOptions,
  ) => Promise<Client<any> | undefined>
  initializing: boolean
  error: Error | null
  disconnect: () => void
  newConversation: (
    inboxIdOrAddress: string[],
    options?: {groupName?: string; groupDescription?: string},
  ) => Promise<Conversation<any> | undefined>
  sendMessage: (
    conversation: Conversation<any>,
    content: string,
  ) => Promise<void>
  createSCWSigner: (
    address: `0x${string}`,
    signMessage: (message: string) => Promise<string> | string,
    chainId: bigint | number,
  ) => Signer
}

export const XMTPContext = createContext<XMTPContextValue>({
  setClient: () => {},
  initialize: () => Promise.reject(new Error('XMTPProvider not available')),
  initializing: false,
  error: null,
  disconnect: () => {},
  newConversation: () =>
    Promise.reject(new Error('XMTPProvider not available')),
  sendMessage: () => Promise.reject(new Error('XMTPProvider not available')),
  createSCWSigner: () => {
    throw new Error('XMTPProvider not available')
  },
})

export type XMTPProviderProps = React.PropsWithChildren & {
  /**
   * Initial XMTP client instance
   */
  client?: Client<any>
}

export const XMTPProvider: React.FC<XMTPProviderProps> = ({
  children,
  client: initialClient,
}) => {
  const [client, setClient] = useState<Client<any> | undefined>(initialClient)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const initializingRef = useRef(false)

  console.log('XMTPProvider render:', {
    hasClient: !!client,
    initializing,
    error: error?.message,
  })

  const account = useAccount()
  const {switchChain} = useSwitchChain()
  const {signMessageAsync} = useSignMessage()

  /**
   * Initialize an XMTP client
   */
  const initialize = useCallback(
    async ({
      dbEncryptionKey,
      env,
      loggingLevel,
      signer,
    }: InitializeClientOptions) => {
      // only initialize a client if one doesn't already exist
      if (!client) {
        // if the client is already initializing, don't do anything
        if (initializingRef.current) {
          return undefined
        }

        // flag the client as initializing
        initializingRef.current = true

        // reset error state
        setError(null)
        // reset initializing state
        setInitializing(true)

        let xmtpClient: Client<any>

        try {
          // create a new XMTP client
          xmtpClient = await Client.create(signer, {
            env,
            loggingLevel,
            dbEncryptionKey,
            codecs: [
              new ReactionCodec(),
              new ReplyCodec(),
              new RemoteAttachmentCodec(),
              new TransactionReferenceCodec(),
              new WalletSendCallsCodec(),
            ],
          })

          setClient(xmtpClient)
        } catch (e) {
          setClient(undefined)
          setError(e as Error)
          // re-throw error for upstream consumption
          throw e
        } finally {
          initializingRef.current = false
          setInitializing(false)
        }

        return xmtpClient
      }
      return client
    },
    [client],
  )

  const disconnect = useCallback(() => {
    if (client) {
      client.close()
      setClient(undefined)
    }
  }, [client, setClient])

  const newConversation = useCallback(
    async (
      inboxIdOrAddress: string[],
      options?: {groupName?: string; groupDescription?: string},
    ) => {
      if (!client) return

      //All inboxIds are valid ethereum addresses or inboxIds
      const validInboxIds = [
        ...inboxIdOrAddress.map(id => id.trim()).filter(isValidInboxId),
        ...inboxIdOrAddress.map(id => id.trim()).filter(isValidEthereumAddress),
      ]

      if (validInboxIds.length === 1) {
        return await client.conversations.newDm(validInboxIds[0])
      } else if (inboxIdOrAddress.length > 1) {
        return await client.conversations.newGroup(validInboxIds, {
          name: options?.groupName,
          description: options?.groupDescription,
        })
      } else {
        console.error('Invalid member ID format')
        return
      }
    },
    [client],
  )

  const sendMessage = useCallback(
    async (conversation: Conversation<any>, content: string) => {
      if (!client) {
        console.error('XMTP client not initialized')
        return
      }

      try {
        await conversation.sendOptimistic(content)
        await conversation.publishMessages()
      } catch (e) {
        console.error('Error sending message:', e)
        throw e
      }
    },
    [client],
  )

  const createSCWSigner = useCallback(
    (
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
          } catch (e) {
            console.error('Error in Smart Contract Wallet signMessage:', e)
            throw e
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
    },
    [],
  )

  useEffect(() => {
    // XMTP initialization is now manual - call initialize() when needed
    // This effect has been removed to prevent automatic initialization
  }, [
    account.address,
    account.chainId,
    switchChain,
    signMessageAsync,
    initialize,
    createSCWSigner,
  ])

  // XMTP initialization is now manual - removed auto-initialization
  // to prevent signing prompts when users don't access chat features

  // memo-ize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      client,
      setClient,
      initialize,
      initializing,
      error,
      disconnect,
      newConversation,
      sendMessage,
      createSCWSigner,
    }),
    [
      client,
      initialize,
      initializing,
      error,
      disconnect,
      newConversation,
      sendMessage,
      createSCWSigner,
    ],
  )

  return <XMTPContext.Provider value={value}>{children}</XMTPContext.Provider>
}

export const useXMTP = () => {
  return useContext(XMTPContext)
}

/**
 * Hook to initialize XMTP client when entering chat-related screens
 * This prevents automatic initialization and signing prompts when users
 * aren't using chat features
 */
export const useInitializeXMTP = () => {
  const {client, initialize, initializing, createSCWSigner} = useXMTP()
  const account = useAccount()
  const {signMessageAsync} = useSignMessage()
  const [hasAttemptedInit, setHasAttemptedInit] = useState(false)

  const initializeIfNeeded = useCallback(async () => {
    if (!account.address || client || initializing || hasAttemptedInit) {
      return
    }

    console.log('Initializing XMTP for chat access...')
    setHasAttemptedInit(true)

    try {
      const signer = createSCWSigner(
        account.address,
        (message: string) => signMessageAsync({message}),
        account.chainId ?? 1,
      )

      const dbEncryptionKey =
        typeof window !== 'undefined'
          ? window.crypto.getRandomValues(new Uint8Array(32))
          : new Uint8Array(32) // Fallback for native

      await initialize({
        dbEncryptionKey,
        env: 'dev',
        loggingLevel: 'debug',
        signer,
      })
    } catch (error) {
      console.error('XMTP initialization failed:', error)
      // Reset hasAttemptedInit so user can try again
      setHasAttemptedInit(false)
      throw error
    }
  }, [
    account.address,
    account.chainId,
    client,
    initializing,
    hasAttemptedInit,
    initialize,
    createSCWSigner,
    signMessageAsync,
  ])

  // Reset attempt flag when account changes
  useEffect(() => {
    setHasAttemptedInit(false)
  }, [account.address])

  return {
    initializeIfNeeded,
    isInitialized: !!client,
    isInitializing: initializing,
    hasAttemptedInit,
  }
}

export const isValidEthereumAddress = (
  address: string,
): address is `0x${string}` => /^0x[a-fA-F0-9]{40}$/.test(address)

export const isValidInboxId = (inboxId: string): inboxId is string =>
  /^[a-z0-9]{64}$/.test(inboxId)
