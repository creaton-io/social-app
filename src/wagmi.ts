import {getDefaultConfig} from '@rainbow-me/rainbowkit'
import {http} from 'wagmi'
import {baseSepolia, goerli, mainnet} from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'Creaton',
  projectId: 'YOUR_PROJECT_ID', // Get your project ID from WalletConnect Cloud
  chains: [baseSepolia, mainnet, goerli],
  transports: {
    [baseSepolia.id]: http(),
    [mainnet.id]: http(),
    [goerli.id]: http(),
  },
})
