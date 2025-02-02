import {createConfig, http} from 'wagmi'
import {baseSepolia} from 'wagmi/chains'
import {coinbaseWallet} from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  multiInjectedProviderDiscovery: false,
  connectors: [
    coinbaseWallet({
      appName: 'Creaton',
      preference: 'all', // set this to `all` to use EOAs as well
      version: '4',
    }),
  ],
  ssr: false,
  transports: {
    [baseSepolia.id]: http(),
  },
})
