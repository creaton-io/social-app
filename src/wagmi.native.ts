import {
  createConnectorFromWallet,
  Wallets,
} from '@mobile-wallet-protocol/wagmi-connectors'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {createAppKit} from '@reown/appkit-react-native'
import {type Storage} from '@reown/appkit-react-native'
import {WagmiAdapter} from '@reown/appkit-wagmi-react-native'
import {safeJsonParse, safeJsonStringify} from '@walletconnect/safe-json'
import {type Connector, type CreateConnectorFn} from 'wagmi'
import {base} from 'wagmi/chains'

const metadata = {
  name: 'My App Name',
  customScheme: 'myapp://', // only custom scheme (e.g. `myapp://`) is supported in v1.0.0
  chainIds: [8453],
  logoUrl: 'https://example.com/logo.png',
}

const storage: Storage = {
  getKeys: async () => {
    return (await AsyncStorage.getAllKeys()) as string[]
  },
  getEntries: async <T = any>(): Promise<[string, T][]> => {
    const keys = await AsyncStorage.getAllKeys()
    return await Promise.all(
      keys.map(async key => [
        key,
        safeJsonParse((await AsyncStorage.getItem(key)) ?? '') as T,
      ]),
    )
  },
  setItem: async <T = any>(key: string, value: T) => {
    await AsyncStorage.setItem(key, safeJsonStringify(value))
  },
  getItem: async <T = any>(key: string): Promise<T | undefined> => {
    const item = await AsyncStorage.getItem(key)
    if (typeof item === 'undefined' || item === null) {
      return undefined
    }

    return safeJsonParse(item) as T
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key)
  },
}

const projectId = 'cd7a7bc5e49073beeeda2b833b560090' // Obtain from https://dashboard.reown.com/

const rawConnectors = [
  createConnectorFromWallet({
    metadata,
    wallet: Wallets.CoinbaseSmartWallet,
  }),
] as const satisfies readonly CreateConnectorFn[]

const connectors = rawConnectors as unknown as readonly CreateConnectorFn[] &
  Connector[]

export const wagmiAdapter = new WagmiAdapter({
  connectors: connectors,
  projectId,
  networks: [base], // Add all chains you want to support
})

export const appKit = createAppKit({
  projectId,
  // Add your AppKitNetwork array for 'networks' matching the wagmiCoreConfig chains
  // networks: [mainnet, sepolia, ...],
  adapters: [wagmiAdapter /* other adapters for other chain types */],
  metadata: {
    name: 'Creaton',
    description: 'Creaton',
    url: 'https://creaton.io',
    icons: [],
    redirect: {native: 'creaton://', universal: 'https://creaton.io'},
  },
  networks: [base],
  storage: storage,
})
