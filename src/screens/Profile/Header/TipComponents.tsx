import React, {useCallback} from 'react'
import {Avatar, Name} from '@coinbase/onchainkit/identity'
import type {LifeCycleStatus} from '@coinbase/onchainkit/transaction'
import {
  Transaction,
  TransactionButton,
  TransactionSponsor,
  //  TransactionStatus,
  //  TransactionStatusAction,
  //  TransactionStatusLabel,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel,
} from '@coinbase/onchainkit/transaction'
import {ConnectWallet, Wallet} from '@coinbase/onchainkit/wallet'
import {useAccount} from 'wagmi'

import * as TextField from '#/components/forms/TextField'
import {USDC, USDCLogo} from '#/components/icons/USDC'
import {contracts} from './contracts.ts'

export default function TipComponents({sendAddress}: {sendAddress?: string}) {
  const {address} = useAccount()
  const [value, setValue] = React.useState('')

  const handleOnStatus = useCallback((status: LifeCycleStatus) => {
    console.log('LifecycleStatus', status)
  }, [])

  return sendAddress && address ? (
    <Transaction
      contracts={contracts(sendAddress, value)}
      onStatus={handleOnStatus}>
      <TextField.Root>
        <TextField.Icon icon={USDCLogo} />
        <TextField.Input
          value={value}
          inputMode="numeric"
          onChangeText={setValue}
          label="Tip amount"
          style={{
            marginLeft: -10,
          }}
          isInvalid={
            value === '' || value === String(Number(value)) ? false : true
          }
        />
        <TextField.Icon icon={USDC} />
      </TextField.Root>
      <TransactionButton
        text="Tip me"
        disabled={value === '' || value !== String(Number(value))}
      />
      <TransactionSponsor />
      <TransactionToast>
        <TransactionToastIcon />
        <TransactionToastLabel />
        <TransactionToastAction />
      </TransactionToast>
    </Transaction>
  ) : (
    <Wallet>
      <ConnectWallet>
        <Avatar className="h-6 w-6" />
        <Name />
      </ConnectWallet>
    </Wallet>
  )
}
