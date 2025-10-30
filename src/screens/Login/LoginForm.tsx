import React, {useRef, useState} from 'react'
import {
  ActivityIndicator,
  Keyboard,
  LayoutAnimation,
  type TextInput,
  View,
} from 'react-native'
import {
  ComAtprotoServerCreateSession,
  type ComAtprotoServerDescribeServer,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useRequestNotificationsPermission} from '#/lib/notifications/notifications'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {createFullHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {useSetHasCheckedForStarterPack} from '#/state/preferences/used-starter-packs'
import {useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {FormError} from '#/components/forms/FormError'
import {HostingProvider} from '#/components/forms/HostingProvider'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as Ticket} from '#/components/icons/Ticket'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {FormContainer} from './FormContainer'
import {WalletComponents} from './LoginWallet'
type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

export function LoginForm({
  error,
  serviceUrl,
  serviceDescription,
  initialHandle,
  setError,
  setServiceUrl,
  onPressRetryConnect,
  onPressBack,
  onPressSignSIWE,
  onPressForgotPassword,
  onAttemptSuccess,
  onAttemptFailed,
}: {
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  initialHandle: string
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressRetryConnect: () => void
  onPressBack: () => void
  onPressSignSIWE: (currentIdentifier: string) => Promise<string>
  onPressForgotPassword: () => void
  onAttemptSuccess: () => void
  onAttemptFailed: () => void
}) {
  const t = useTheme()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [isAuthFactorTokenNeeded, setIsAuthFactorTokenNeeded] =
    useState<boolean>(false)
  const [isAuthFactorTokenValueEmpty, setIsAuthFactorTokenValueEmpty] =
    useState<boolean>(true)
  const [useSiweLogin, setUseSiweLogin] = useState<boolean>(true)
  const identifierValueRef = useRef<string>(initialHandle || '')
  const passwordValueRef = useRef<string>('')
  const siweSignatureValueRef = useRef<string>('')
  const authFactorTokenValueRef = useRef<string>('')
  const passwordRef = useRef<TextInput>(null)
  const {_} = useLingui()
  const {login} = useSessionApi()
  const requestNotificationsPermission = useRequestNotificationsPermission()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const setHasCheckedForStarterPack = useSetHasCheckedForStarterPack()

  const onPressSelectService = React.useCallback(() => {
    Keyboard.dismiss()
  }, [])

  const onPressNext = async () => {
    if (isProcessing) return
    Keyboard.dismiss()
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setError('')

    const identifier = identifierValueRef.current.toLowerCase().trim()
    const password = passwordValueRef.current
    const siweSignature = siweSignatureValueRef.current
    const authFactorToken = authFactorTokenValueRef.current

    if (!identifier) {
      setError(_(msg`Please enter your username`))
      return
    }

    if (!useSiweLogin && !password) {
      setError(_(msg`Please enter your password`))
      return
    }

    if (useSiweLogin && !siweSignature) {
      setError(_(msg`Please sign with your wallet`))
      return
    }

    setIsProcessing(true)

    try {
      // try to guess the handle if the user just gave their own username
      let fullIdent = identifier
      if (
        !identifier.includes('@') && // not an email
        !identifier.includes('.') && // not a domain
        serviceDescription &&
        serviceDescription.availableUserDomains.length > 0
      ) {
        let matched = false
        for (const domain of serviceDescription.availableUserDomains) {
          if (fullIdent.endsWith(domain)) {
            matched = true
          }
        }
        if (!matched) {
          fullIdent = createFullHandle(
            identifier,
            serviceDescription.availableUserDomains[0],
          )
        }
      }

      // Login with either password or SIWE signature
      await login(
        {
          service: serviceUrl,
          identifier: fullIdent,
          password: useSiweLogin ? undefined : password,
          siweSignature: useSiweLogin ? siweSignature : undefined,
          authFactorToken: authFactorToken ? authFactorToken.trim() : undefined,
        },
        'LoginForm',
      )
      onAttemptSuccess()
      setShowLoggedOut(false)
      setHasCheckedForStarterPack(true)
      requestNotificationsPermission('Login')
    } catch (e: any) {
      const errMsg = e.toString()
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setIsProcessing(false)
      if (
        e instanceof ComAtprotoServerCreateSession.AuthFactorTokenRequiredError
      ) {
        setIsAuthFactorTokenNeeded(true)
      } else {
        onAttemptFailed()
        if (errMsg.includes('Token is invalid')) {
          logger.debug('Failed to login due to invalid 2fa token', {
            error: errMsg,
          })
          setError(_(msg`Invalid 2FA confirmation code.`))
        } else if (
          errMsg.includes('Authentication Required') ||
          errMsg.includes('Invalid identifier or password')
        ) {
          logger.debug('Failed to login due to invalid credentials', {
            error: errMsg,
          })
          setError(_(msg`Incorrect username or password`))
        } else if (isNetworkError(e)) {
          logger.warn('Failed to login due to network error', {error: errMsg})
          setError(
            _(
              msg`Unable to contact your service. Please check your Internet connection.`,
            ),
          )
        } else {
          logger.warn('Failed to login', {error: errMsg})
          setError(cleanError(errMsg))
        }
      }
    }
  }

  return (
    <FormContainer testID="loginForm" titleText={<Trans>Sign in</Trans>}>
      {useSiweLogin && (
        <View style={[a.mb_lg]}>
          <Text style={[a.text_lg, a.font_bold, a.mb_md]}>
            <Trans>Wallet</Trans>
          </Text>

          <View style={[a.flex_row, a.justify_between, a.gap_md]}>
            <View
              style={[
                a.flex_1,
                a.p_md,
                a.border,
                t.atoms.border_contrast_low,
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
                  style={[a.text_md, a.font_bold, t.atoms.text_contrast_high]}>
                  <Trans>
                    Choose the wallet you used to create your account
                  </Trans>
                </Text>
              </View>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mb_sm]}>
                <Trans>
                  If you used a password, click on "Use password instead"
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
            {/* 
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
                  style={[a.text_md, a.font_bold, t.atoms.text_contrast_high]}>
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
                  <Text style={[a.text_xs, a.font_bold, {color: '#1E3A8A'}]}>
                    <Trans>For existing wallets</Trans>
                  </Text>
                </View>
              </View>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mb_sm]}>
                <Trans>
                  Already have MetaMask or another wallet? Connect it here.
                </Trans>
              </Text>
              <View style={[a.overflow_hidden, {borderRadius: 12}]}>
                <ConnectButton />
              </View>
            </View> */}
          </View>
        </View>
      )}
      <View>
        <TextField.LabelText>
          <Trans>Hosting provider</Trans>
        </TextField.LabelText>
        <HostingProvider
          serviceUrl={serviceUrl}
          onSelectServiceUrl={setServiceUrl}
          onOpenDialog={onPressSelectService}
        />
      </View>
      <View>
        <TextField.LabelText>
          <Trans>Account</Trans>
        </TextField.LabelText>
        <View style={[a.gap_sm]}>
          <TextField.Root>
            <TextField.Icon icon={At} />
            <TextField.Input
              testID="loginUsernameInput"
              label={_(msg`Username or email address`)}
              autoCapitalize="none"
              autoFocus
              autoCorrect={false}
              autoComplete="username"
              returnKeyType="next"
              textContentType="username"
              defaultValue={initialHandle || ''}
              onChangeText={v => {
                identifierValueRef.current = v
              }}
              onSubmitEditing={() => {
                if (!useSiweLogin) {
                  passwordRef.current?.focus()
                }
              }}
              blurOnSubmit={false} // prevents flickering due to onSubmitEditing going to next field
              editable={!isProcessing}
              accessibilityHint={_(
                msg`Enter the username or email address you used when you created your account`,
              )}
            />
            <TextField.SuffixText
              label={_(msg`Domain suffix`)}
              accessibilityHint={_(msg`The domain suffix for your account`)}>
              .creaton.social
            </TextField.SuffixText>
          </TextField.Root>

          {!useSiweLogin && (
            <TextField.Root>
              <TextField.Icon icon={Lock} />
              <TextField.Input
                testID="loginPasswordInput"
                inputRef={passwordRef}
                label={_(msg`Password`)}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                returnKeyType="done"
                enablesReturnKeyAutomatically={true}
                secureTextEntry={true}
                textContentType="password"
                clearButtonMode="while-editing"
                onChangeText={v => {
                  passwordValueRef.current = v
                }}
                onSubmitEditing={onPressNext}
                blurOnSubmit={false} // HACK: https://github.com/facebook/react-native/issues/21911#issuecomment-558343069 Keyboard blur behavior is now handled in onSubmitEditing
                editable={!isProcessing}
                accessibilityHint={_(msg`Enter your password`)}
              />
              <Button
                testID="forgotPasswordButton"
                onPress={onPressForgotPassword}
                label={_(msg`Forgot password?`)}
                accessibilityHint={_(msg`Opens password reset form`)}
                variant="solid"
                color="secondary"
                style={[
                  a.rounded_sm,
                  // t.atoms.bg_contrast_100,
                  {marginLeft: 'auto', left: 6, padding: 6},
                  a.z_10,
                ]}>
                <ButtonText>
                  <Trans>Forgot?</Trans>
                </ButtonText>
              </Button>
            </TextField.Root>
          )}
        </View>
      </View>
      {isAuthFactorTokenNeeded && (
        <View>
          <TextField.LabelText>
            <Trans>2FA Confirmation</Trans>
          </TextField.LabelText>
          <TextField.Root>
            <TextField.Icon icon={Ticket} />
            <TextField.Input
              testID="loginAuthFactorTokenInput"
              label={_(msg`Confirmation code`)}
              autoCapitalize="none"
              autoFocus
              autoCorrect={false}
              autoComplete="one-time-code"
              returnKeyType="done"
              textContentType="username"
              blurOnSubmit={false} // prevents flickering due to onSubmitEditing going to next field
              onChangeText={v => {
                setIsAuthFactorTokenValueEmpty(v === '')
                authFactorTokenValueRef.current = v
              }}
              onSubmitEditing={onPressNext}
              editable={!isProcessing}
              accessibilityHint={_(
                msg`Input the code which has been emailed to you`,
              )}
              style={[
                {
                  textTransform: isAuthFactorTokenValueEmpty
                    ? 'none'
                    : 'uppercase',
                },
              ]}
            />
          </TextField.Root>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mt_sm]}>
            <Trans>
              Check your email for a sign in code and enter it here.
            </Trans>
          </Text>
        </View>
      )}
      <FormError error={error} />
      <View style={[a.flex_row, a.align_center, a.pt_md]}>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="secondary"
          size="large"
          onPress={onPressBack}>
          <ButtonText>
            <Trans>Back</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        {!serviceDescription && error ? (
          <Button
            testID="loginRetryButton"
            label={_(msg`Retry`)}
            accessibilityHint={_(msg`Retries signing in`)}
            variant="solid"
            color="secondary"
            size="large"
            onPress={onPressRetryConnect}>
            <ButtonText>
              <Trans>Retry</Trans>
            </ButtonText>
          </Button>
        ) : !serviceDescription ? (
          <>
            <ActivityIndicator />
            <Text style={[t.atoms.text_contrast_high, a.pl_md]}>
              <Trans>Connecting...</Trans>
            </Text>
          </>
        ) : (
          <>
            {useSiweLogin ? (
              <Button
                testID="signSIWEButton"
                onPress={() => {
                  const currentIdentifier = identifierValueRef.current
                    .toLowerCase()
                    .trim()
                  if (!currentIdentifier) {
                    setError(_(msg`Please enter your username first`))
                    return
                  }
                  onPressSignSIWE(currentIdentifier)
                    .then(signature => {
                      siweSignatureValueRef.current = signature
                      onPressNext()
                      console.log('Signature: ', signature)
                    })
                    .catch(signError => {
                      setError(
                        signError.message || 'Failed to sign with wallet',
                      )
                      console.log('Error: ', signError)
                    })
                }}
                label={_(msg`Sign SIWE`)}
                accessibilityHint={_(msg`Sign SIWE to log in`)}
                variant="solid"
                color="primary"
                size="large">
                <ButtonText>
                  <Trans>Log in with wallet signature</Trans>
                </ButtonText>
                {isProcessing && <ButtonIcon icon={Loader} />}
              </Button>
            ) : (
              <Button
                testID="loginNextButton"
                label={_(msg`Next`)}
                accessibilityHint={_(msg`Navigates to the next screen`)}
                variant="solid"
                color="primary"
                size="large"
                onPress={onPressNext}>
                <ButtonText>
                  <Trans>Next</Trans>
                </ButtonText>
                {isProcessing && <ButtonIcon icon={Loader} />}
              </Button>
            )}
          </>
        )}
      </View>
      <View style={[a.flex_row, a.justify_center, a.mt_md]}>
        <Button
          variant="ghost"
          color="secondary"
          onPress={() => setUseSiweLogin(!useSiweLogin)}
          label={_(
            msg`Switch to ${useSiweLogin ? 'password' : 'wallet'} login`,
          )}
          accessibilityHint={_(
            msg`Switch to ${useSiweLogin ? 'password' : 'wallet'} login`,
          )}>
          <ButtonText>
            <Trans>
              {useSiweLogin
                ? 'Use password instead'
                : 'Use wallet signature instead'}
            </Trans>
          </ButtonText>
        </Button>
      </View>
    </FormContainer>
  )
}
