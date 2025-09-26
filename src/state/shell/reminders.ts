import {logger} from '#/logger'
import * as persisted from '#/state/persisted'
import {type SessionAccount} from '../session'
import {isOnboardingActive} from './onboarding'

export function shouldRequestEmailConfirmation(account: SessionAccount) {
  // ignore logged out
  if (!account) return false
  // ignore confirmed accounts, this is the success state of this reminder
  if (account.emailConfirmed) return false
  // wait for onboarding to complete
  if (isOnboardingActive()) return false
  // matter of fact, just always ignore cause no email is needed
  return false

  // const snoozedAt = persisted.get('reminders').lastEmailConfirm
  // const today = new Date()

  // logger.debug('Checking email confirmation reminder', {
  //   today,
  //   snoozedAt,
  // })

  // // never been snoozed, new account
  // if (!snoozedAt) {
  //   return true
  // }

  // // already snoozed today
  // if (simpleAreDatesEqual(new Date(Date.parse(snoozedAt)), new Date())) {
  //   return false
  // }

  // return true
}

export function snoozeEmailConfirmationPrompt() {
  const lastEmailConfirm = new Date().toISOString()
  logger.debug('Snoozing email confirmation reminder', {
    snoozedAt: lastEmailConfirm,
  })
  persisted.write('reminders', {
    ...persisted.get('reminders'),
    lastEmailConfirm,
  })
}
