/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {HeadersMap, XRPCError} from '@atproto/xrpc'
import {type ValidationResult, BlobRef} from '@atproto/lexicon'
import {CID} from 'multiformats/cid'
import {validate as _validate} from '../../../../lexicons'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util'

const is$typed = _is$typed,
  validate = _validate
const id = 'com.atproto.server.createSIWERegistration'

export interface QueryParams {}

export interface InputSchema {
  /** EthAddress the user wants to register with. */
  ethAddress: string
}

export interface OutputSchema {
  /** The SIWE message to be signed by the user's wallet. */
  siweMessage: string
}

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
  qp?: QueryParams
  encoding?: 'application/json'
}

export interface Response {
  success: boolean
  headers: HeadersMap
  data: OutputSchema
}

export function toKnownErr(e: any) {
  return e
}
