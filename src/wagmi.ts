import {createConfig, http} from 'wagmi'
import {base} from 'wagmi/chains'
import {baseAccount} from 'wagmi/connectors'

export const config = createConfig({
  chains: [base],
  connectors: [
    baseAccount({
      appName: 'Base App',
    }),
  ],
  transports: {
    [base.id]: http(),
  },
})
