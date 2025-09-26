import React, {useRef, useState} from 'react'
import {TouchableOpacity, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as EmailValidator from 'email-validator'
import type tldts from 'tldts'
import {useAccount} from 'wagmi'

import {usePalette} from '#/lib/hooks/usePalette'
import {isEmailMaybeInvalid} from '#/lib/strings/email'
import {logger} from '#/logger'
import {TextLink} from '#/view/com/util/Link'
import {WalletComponents} from '#/screens/Login/LoginWallet'
import {ScreenTransition} from '#/screens/Login/ScreenTransition'
import {is13, is18, useSignupContext} from '#/screens/Signup/state'
import {Policies} from '#/screens/Signup/StepInfo/Policies'
import {atoms as a, useTheme} from '#/alf'
import * as DateField from '#/components/forms/DateField'
import {FormError} from '#/components/forms/FormError'
import {HostingProvider} from '#/components/forms/HostingProvider'
import * as TextField from '#/components/forms/TextField'
import {Envelope_Stroke2_Corner0_Rounded as Envelope} from '#/components/icons/Envelope'
import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as Ticket} from '#/components/icons/Ticket'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {BackNextButtons} from '../BackNextButtons'

function sanitizeDate(date: Date): Date {
  if (!date || date.toString() === 'Invalid Date') {
    logger.error(`Create account: handled invalid date for birthDate`, {
      hasDate: !!date,
    })
    return new Date()
  }
  return date
}

export function StepInfo({
  onPressBack,
  isServerError,
  refetchServer,
  isLoadingStarterPack,
}: {
  onPressBack: () => void
  isServerError: boolean
  refetchServer: () => void
  isLoadingStarterPack: boolean
}) {
  const {_} = useLingui()
  const {state, dispatch} = useSignupContext()
  const t = useTheme()

  const inviteCodeValueRef = useRef<string>(state.inviteCode)
  const emailValueRef = useRef<string>(state.email)
  const passwordValueRef = useRef<string>(state.password || '')
  const confirmPasswordValueRef = useRef<string>('')
  const prevEmailValueRef = useRef<string>(state.email)
  const account = useAccount()
  const pal = usePalette('default')

  const [hasWarnedEmail, setHasWarnedEmail] = React.useState<boolean>(false)
  const [useWallet, setUseWallet] = useState<boolean>(true)

  const tldtsRef = React.useRef<typeof tldts>()
  React.useEffect(() => {
    // @ts-expect-error - valid path
    import('tldts/dist/index.cjs.min.js').then(tldts => {
      tldtsRef.current = tldts
    })
    // This will get used in the avatar creator a few steps later, so lets preload it now
    // @ts-expect-error - valid path
    import('react-native-view-shot/src/index')
  }, [])

  const onNextPress = () => {
    const inviteCode = inviteCodeValueRef.current
    const email = emailValueRef.current
    const password = passwordValueRef.current
    const confirmPassword = confirmPasswordValueRef.current
    const emailChanged = prevEmailValueRef.current !== email
    const ethAddress = account.address

    if (emailChanged && tldtsRef.current) {
      if (isEmailMaybeInvalid(email, tldtsRef.current)) {
        prevEmailValueRef.current = email
        setHasWarnedEmail(true)
        return dispatch({
          type: 'setError',
          value: _(
            msg`It looks like you may have entered your email address incorrectly. Are you sure it's right?`,
          ),
        })
      }
    } else if (hasWarnedEmail) {
      setHasWarnedEmail(false)
    }
    prevEmailValueRef.current = email

    if (!is13(state.dateOfBirth)) {
      return
    }

    if (state.serviceDescription?.inviteCodeRequired && !inviteCode) {
      return dispatch({
        type: 'setError',
        value: _(msg`Please enter your invite code.`),
      })
    }
    if (!email) {
      return dispatch({
        type: 'setError',
        value: _(msg`Please enter your email.`),
      })
    }
    if (!EmailValidator.validate(email)) {
      return dispatch({
        type: 'setError',
        value: _(msg`Your email appears to be invalid.`),
      })
    }

    if (useWallet) {
      if (!ethAddress) {
        return dispatch({
          type: 'setError',
          value: _(msg`Please connect or create a wallet`),
        })
      }
      dispatch({type: 'setEthAddress', value: ethAddress})
      dispatch({type: 'setPassword', value: ''})
    } else {
      if (!password) {
        return dispatch({
          type: 'setError',
          value: _(msg`Please enter a password.`),
        })
      }
      if (password.length < 8) {
        return dispatch({
          type: 'setError',
          value: _(msg`Password must be at least 8 characters.`),
        })
      }
      if (password !== confirmPassword) {
        return dispatch({
          type: 'setError',
          value: _(msg`Passwords do not match.`),
        })
      }
      dispatch({type: 'setPassword', value: password})
      dispatch({type: 'setEthAddress', value: undefined})
    }

    dispatch({type: 'setInviteCode', value: inviteCode})
    dispatch({type: 'setEmail', value: email})
    dispatch({type: 'next'})
    logger.metric(
      'signup:nextPressed',
      {
        activeStep: state.activeStep,
      },
      {statsig: true},
    )
  }

  return (
    <ScreenTransition>
      <View style={[a.gap_md]}>
        <FormError error={state.error} />
        <View>
          <TextField.LabelText>
            <Trans>Hosting provider</Trans>
          </TextField.LabelText>
          <HostingProvider
            serviceUrl={state.serviceUrl}
            onSelectServiceUrl={v =>
              dispatch({type: 'setServiceUrl', value: v})
            }
          />
        </View>
        {(state.isLoading || isLoadingStarterPack) &&
        !inviteCodeValueRef.current &&
        !emailValueRef.current ? (
          <View style={[a.align_center]}>
            <Loader size="xl" />
          </View>
        ) : state.serviceDescription ? (
          <>
            {state.serviceDescription.inviteCodeRequired && (
              <View>
                <TextField.LabelText>
                  Invite code needed, DM @Aer0xander on
                  <TextLink
                    style={pal.link}
                    href="https://x.com/aer0xander"
                    text=" Twitter "
                  />
                  or
                  <TextLink
                    style={pal.link}
                    href="https://warpcast.com/aer0xander"
                    text=" Warpcast "
                  />
                  for an invite!
                </TextField.LabelText>
                <TextField.Root>
                  <TextField.Icon icon={Ticket} />
                  <TextField.Input
                    onChangeText={value => {
                      inviteCodeValueRef.current = value.trim()
                    }}
                    label={_(msg`Required for this provider`)}
                    defaultValue={state.inviteCode}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                  />
                </TextField.Root>
              </View>
            )}
            <View>
              <TextField.LabelText>
                <Trans>Email</Trans>
              </TextField.LabelText>
              <TextField.Root>
                <TextField.Icon icon={Envelope} />
                <TextField.Input
                  testID="emailInput"
                  onChangeText={value => {
                    emailValueRef.current = value.trim()
                    if (hasWarnedEmail) {
                      setHasWarnedEmail(false)
                    }
                  }}
                  label={_(msg`Enter your email address`)}
                  defaultValue={state.email}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                />
              </TextField.Root>
            </View>

            <View style={[a.mb_md]}>
              <Text style={[a.text_lg, a.font_bold, a.mb_sm]}>
                <Trans>Choose how to sign in</Trans>
              </Text>

              <View style={[a.flex_row, a.justify_between, a.gap_md]}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setUseWallet(true)}
                  style={[
                    a.flex_1,
                    a.p_md,
                    a.border_1,
                    {
                      backgroundColor: useWallet
                        ? t.atoms.bg_contrast_50.backgroundColor
                        : t.atoms.bg_contrast_25.backgroundColor,
                      borderColor: useWallet
                        ? '#0891B2'
                        : t.atoms.border_contrast_low.borderColor,
                      borderRadius: 12,
                    },
                  ]}>
                  <View
                    style={[
                      a.flex_row,
                      a.justify_between,
                      a.align_center,
                      a.mb_xs,
                    ]}>
                    <Text
                      style={[
                        a.text_md,
                        a.font_bold,
                        t.atoms.text_contrast_high,
                      ]}>
                      <Trans>Ethereum Wallet</Trans>
                    </Text>
                    <View
                      style={[
                        a.px_xs,
                        a.py_xxs,
                        {
                          backgroundColor: '#4ADE80',
                          borderRadius: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          marginLeft: 4,
                        },
                      ]}>
                      <Text
                        style={[a.text_xs, a.font_bold, {color: '#064E3B'}]}>
                        <Trans>Web3</Trans>
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[a.text_sm, t.atoms.text_contrast_medium, a.mb_sm]}>
                    <Trans>Sign in with your crypto wallet.</Trans>
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setUseWallet(false)}
                  style={[
                    a.flex_1,
                    a.p_md,
                    a.border_1,
                    {
                      backgroundColor: !useWallet
                        ? t.atoms.bg_contrast_50.backgroundColor
                        : t.atoms.bg_contrast_25.backgroundColor,
                      borderColor: !useWallet
                        ? '#0891B2'
                        : t.atoms.border_contrast_low.borderColor,
                      borderRadius: 12,
                    },
                  ]}>
                  <View
                    style={[
                      a.flex_row,
                      a.justify_between,
                      a.align_center,
                      a.mb_xs,
                    ]}>
                    <Text
                      style={[
                        a.text_md,
                        a.font_bold,
                        t.atoms.text_contrast_high,
                      ]}>
                      <Trans>Password</Trans>
                    </Text>
                    <View
                      style={[
                        a.px_xs,
                        a.py_xxs,
                        {
                          backgroundColor: '#93C5FD',
                          borderRadius: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          marginLeft: 4,
                        },
                      ]}>
                      <Text
                        style={[a.text_xs, a.font_bold, {color: '#1E3A8A'}]}>
                        <Trans>Simple</Trans>
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[a.text_sm, t.atoms.text_contrast_medium, a.mb_sm]}>
                    <Trans>Traditional email and password login.</Trans>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {useWallet ? (
              <View style={{zIndex: 1000000000000000}}>
                <TextField.LabelText>
                  <Trans>Connect or create your crypto wallet</Trans>
                </TextField.LabelText>
                <View
                  style={[a.flex_row, a.justify_between, a.gap_md, a.mb_sm]}>
                  <View
                    style={[
                      a.flex_1,
                      a.p_md,
                      a.border_1,
                      a.border_contrast_low,
                      {
                        backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
                        borderRadius: 12,
                      },
                    ]}>
                    <View
                      style={[
                        a.flex_row,
                        a.justify_between,
                        a.align_center,
                        a.mb_xs,
                      ]}>
                      <Text
                        style={[
                          a.text_md,
                          a.font_bold,
                          t.atoms.text_contrast_high,
                        ]}>
                        <Trans>Crypto Wallet</Trans>
                      </Text>
                      <View
                        style={[
                          a.px_xs,
                          a.py_xxs,
                          {
                            backgroundColor: '#4ADE80',
                            borderRadius: 4,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            marginLeft: 4,
                          },
                        ]}>
                        <Text
                          style={[a.text_xs, a.font_bold, {color: '#064E3B'}]}>
                          <Trans>Beginner-friendly</Trans>
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        a.text_sm,
                        t.atoms.text_contrast_medium,
                        a.mb_sm,
                      ]}>
                      <Trans>
                        Set up or sign in with your Base smart contract wallet
                      </Trans>
                    </Text>
                    <View
                      style={[
                        a.relative, // Make the container relative for proper positioning
                        a.z_50, // Set a high z-index
                        a.flex_row, // Add flex row to enable horizontal centering
                        a.justify_center, // Center content horizontally
                        {
                          position: 'relative', // Ensure proper stacking context
                        },
                      ]}>
                      <WalletComponents />
                    </View>
                  </View>

                  {/* <View
                    style={[
                      a.flex_1,
                      a.p_md,
                      a.border_1,
                      a.border_contrast_low,
                      {
                        backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
                        borderRadius: 12,
                      },
                    ]}>
                    <View
                      style={[
                        a.flex_row,
                        a.justify_between,
                        a.align_center,
                        a.mb_xs,
                      ]}>
                      <Text
                        style={[
                          a.text_md,
                          a.font_bold,
                          t.atoms.text_contrast_high,
                        ]}>
                        <Trans>Browser Wallet</Trans>
                      </Text>
                      <View
                        style={[
                          a.px_xs,
                          a.py_xxs,
                          {
                            backgroundColor: '#93C5FD',
                            borderRadius: 4,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            marginLeft: 4,
                          },
                        ]}>
                        <Text
                          style={[a.text_xs, a.font_bold, {color: '#1E3A8A'}]}>
                          <Trans>For existing wallets</Trans>
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        a.text_sm,
                        t.atoms.text_contrast_medium,
                        a.mb_sm,
                      ]}>
                      <Trans>
                        Already have MetaMask or another wallet? Connect it
                        here.
                      </Trans>
                    </Text>
                    <View style={[a.overflow_hidden, {borderRadius: 12}]}>
                      <ConnectButton />
                    </View>
                  </View> */}
                </View>
              </View>
            ) : (
              <>
                <View>
                  <TextField.LabelText>
                    <Trans>Password</Trans>
                  </TextField.LabelText>
                  <TextField.Root>
                    <TextField.Icon icon={Lock} />
                    <TextField.Input
                      testID="passwordInput"
                      onChangeText={value => {
                        passwordValueRef.current = value
                      }}
                      label={_(msg`Create a password`)}
                      secureTextEntry
                      autoCapitalize="none"
                      autoComplete="password-new"
                    />
                  </TextField.Root>
                </View>
                <View>
                  <TextField.LabelText>
                    <Trans>Confirm Password</Trans>
                  </TextField.LabelText>
                  <TextField.Root>
                    <TextField.Icon icon={Lock} />
                    <TextField.Input
                      testID="confirmPasswordInput"
                      onChangeText={value => {
                        confirmPasswordValueRef.current = value
                      }}
                      label={_(msg`Confirm your password`)}
                      secureTextEntry
                      autoCapitalize="none"
                      autoComplete="password-new"
                    />
                  </TextField.Root>
                </View>
              </>
            )}

            <View>
              <DateField.LabelText>
                <Trans>Your birth date</Trans>
              </DateField.LabelText>
              <DateField.DateField
                testID="date"
                value={DateField.utils.toSimpleDateString(state.dateOfBirth)}
                onChangeDate={date => {
                  dispatch({
                    type: 'setDateOfBirth',
                    value: sanitizeDate(new Date(date)),
                  })
                }}
                label={_(msg`Date of birth`)}
                accessibilityHint={_(msg`Select your date of birth`)}
              />
            </View>
            <Policies
              serviceDescription={state.serviceDescription}
              needsGuardian={!is18(state.dateOfBirth)}
              under13={!is13(state.dateOfBirth)}
            />
          </>
        ) : undefined}
      </View>
      <BackNextButtons
        hideNext={!is13(state.dateOfBirth)}
        showRetry={isServerError}
        isLoading={state.isLoading}
        onBackPress={onPressBack}
        onNextPress={onNextPress}
        onRetryPress={refetchServer}
        overrideNextText={hasWarnedEmail ? _(msg`It's correct`) : undefined}
      />
    </ScreenTransition>
  )
}
