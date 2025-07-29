import {useQuery} from '@tanstack/react-query'
import {GraphQLClient} from 'graphql-request'

export const client = new GraphQLClient('https://doppler-dev.ponder-dev.com/')

const GET_USER_CREATOR_TOKENS_QUERY = `
query UserCreatorTokens($creatorAddress: String!) {
  tokens(where: { creatorAddress: $creatorAddress }) {
    items {
      address
      chainId
      name
      symbol
      decimals
      tokenUriData
      totalSupply
      image
      isDerc20
      derc20Data {
        v2Pool
        migratedAt
      }
      firstSeenAt
      lastSeenAt
      pool {
        address
        volumeUsd
        percentDayChange
        marketCapUsd
        baseToken {
          name
          symbol
          address
        }
        quoteToken {
          name
          symbol
          address
        }
        chainId
      }
      volumeUsd
      holderCount
      creatorAddress
    }
    pageInfo {
      startCursor
      endCursor
      hasNextPage
      hasPreviousPage
    }
    totalCount
  }
}
`

const GET_POOLS_QUERY = `
query TopPools($chainId: BigInt!) {
  pools(where: {chainId: $chainId}, orderBy: "volumeUsd", orderDirection:"DESC") {
    items {
      address
      price
      volumeUsd
      percentDayChange
      marketCapUsd
      baseToken {
        name
        symbol
        address
      }
      quoteToken {
        name
        symbol
        address
      }
      chainId
    }
    pageInfo {
      startCursor
      endCursor
      hasNextPage
      hasPreviousPage
    }
    totalCount
  }
}
`

export type CreatorToken = {
  address: string
  chainId: number
  name: string
  symbol: string
  decimals: number
  tokenUriData: string
  totalSupply: string
  image: string
  isDerc20: boolean
  derc20Data: {
    v2Pool: string
    migratedAt: string
  }
  firstSeenAt: string
  lastSeenAt: string
  pool: Pool
  volumeUsd: string
  holderCount: number
  creatorAddress: string
}

export type Tokens = {
  items: CreatorToken[]
  pageInfo: {
    startCursor: string
    endCursor: string
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  totalCount: number
}

export type Pools = {
  items: Pool[]
  pageInfo: {
    startCursor: string
    endCursor: string
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  totalCount: number
}

export type Pool = {
  address: string
  volumeUsd: string
  percentDayChange: string
  marketCapUsd: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  chainId: number
}

const getUserCreatorTokensQuery = async (
  creatorAddress: string,
): Promise<Tokens> => {
  const response = await client.request<{tokens: Tokens}>(
    GET_USER_CREATOR_TOKENS_QUERY,
    {creatorAddress},
  )
  return response.tokens
}

const getPoolsQuery = async (chainId: number): Promise<Pools> => {
  const response = await client.request<{pools: Pools}>(GET_POOLS_QUERY, {
    chainId: chainId.toString(),
  })
  return response.pools
}

export const useDopplerPonder = (creatorAddress: string) => {
  const getUserCreatorTokens = useQuery({
    queryKey: ['creatorTokens', creatorAddress],
    queryFn: () => getUserCreatorTokensQuery(creatorAddress),
  })

  return {
    getUserCreatorTokens,
    getPoolsQuery,
    creatorTokens: getUserCreatorTokens.data?.items,
  }
}
