// const clickContractAddress = '0x67c97D1FB8184F038592b2109F854dfb09C77C75';
// const clickContractAbi = [
//   {
//     type: 'function',
//     name: 'click',
//     inputs: [],
//     outputs: [],
//     stateMutability: 'nonpayable',
//   },
// ] as const;

// export const contracts = [
//   {
//     address: clickContractAddress as `0x${string}`,
//     abi: clickContractAbi,
//     functionName: 'click',
//     args: [],
//   },
// ];

const usdcContractAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
const usdcContractAbi = [
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      {name: 'to', type: 'address'},
      {name: 'amount', type: 'uint256'},
    ],
    outputs: [{name: '', type: 'bool'}],
    stateMutability: 'nonpayable',
  },
] as const

export function contracts(address: string, amount: string) {
  return [
    {
      address: usdcContractAddress as `0x${string}`,
      abi: usdcContractAbi,
      functionName: 'transfer',
      args: [address, amount],
    },
  ]
}
