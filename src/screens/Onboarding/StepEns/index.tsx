import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useAccount, useSignMessage} from 'wagmi'

import {useSession} from '#/state/session'
import {
  DescriptionText,
  OnboardingControls,
  TitleText,
} from '#/screens/Onboarding/Layout'
import {Context} from '#/screens/Onboarding/state'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {IconCircle} from '#/components/IconCircle'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {Text} from '#/components/Typography'

export function StepEns() {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {currentAccount} = useSession()
  const {dispatch} = React.useContext(Context)
  const [claiming, setClaiming] = React.useState(false)
  const [error, setError] = React.useState<string>('')

  // Extract the handle without the domain part for the subdomain
  const handle = currentAccount?.handle || ''
  const subdomain = handle.includes('.') ? handle.split('.')[0] : handle
  const ensSubdomain = `${subdomain}.creaton.eth`
  const {signMessageAsync} = useSignMessage()
  const {address} = useAccount()

  /**
   * Create a new subdomain (requires signature)
   */
  const createSubdomain = React.useCallback(
    async (subdomainName: string) => {
      try {
        // Sign the message
        const message = JSON.stringify({
          action: 'create',
          timestamp: new Date().toISOString(),
          subdomain,
        })

        const signature = await signMessageAsync({
          message: message,
        })

        // Prepare request body
        const requestBody = {
          message,
          signature,
          address,
          texts: [
            {key: 'com.atproto', value: subdomainName + '.creaton.social'},
          ],
        }

        return await fetch('http://localhost:3000/subdomains', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })
      } catch (err) {
        console.error('❌ Failed to create subdomain:', err)
        return {error: err}
      }
    },
    [signMessageAsync, address, subdomain],
  )

  const onClaimSubdomain = React.useCallback(async () => {
    setClaiming(true)
    setError('')
    try {
      // Use the actual createSubdomain function
      const result = await createSubdomain(subdomain)

      // Check if result is an error object or a Response
      if ('error' in result) {
        throw new Error('Failed to create subdomain')
      }

      dispatch({
        type: 'setEnsStepResults',
        claimed: true,
        subdomain: ensSubdomain,
      })

      // Automatically proceed to next step after claiming
      dispatch({type: 'next'})
    } catch (error) {
      // Handle error
      setError(_(msg`Failed to claim subdomain. Please try again.`))
    } finally {
      setClaiming(false)
    }
  }, [dispatch, ensSubdomain, createSubdomain, subdomain, _])

  const onSkip = React.useCallback(() => {
    dispatch({
      type: 'setEnsStepResults',
      claimed: false,
    })
    dispatch({type: 'next'})
  }, [dispatch])

  return (
    <View style={[a.align_start]} testID="onboardingEns">
      <IconCircle icon={Globe} style={[a.mb_2xl]} />

      <TitleText>
        <Trans>Claim your ENS subdomain</Trans>
      </TitleText>

      <DescriptionText>
        <Trans>
          Get your own creaton.eth subdomain to make receiving payments and
          messages easier.
        </Trans>
      </DescriptionText>

      <View style={[a.w_full, a.align_center, a.py_4xl]}>
        <View
          style={[
            a.p_xl,
            a.border,
            a.rounded_lg,
            a.w_full,
            t.atoms.border_contrast_low,
            t.atoms.bg_contrast_25,
          ]}>
          <View style={[a.align_center, a.gap_md]}>
            <Globe size="xl" style={{color: t.palette.primary_500}} />
            <View style={[a.align_center, a.gap_xs]}>
              <Text style={[a.font_bold, a.text_xl]}>
                <Trans>{ensSubdomain}</Trans>
              </Text>
              <Text style={[t.atoms.text_contrast_medium, a.text_sm]}>
                <Trans>Your ENS subdomain</Trans>
              </Text>
            </View>
          </View>
        </View>
      </View>

      <OnboardingControls.Portal>
        {error ? (
          <View style={[a.mb_md]}>
            <Text
              style={[
                a.text_sm,
                t.atoms.text_contrast_high,
                {color: t.palette.negative_400},
              ]}>
              {error}
            </Text>
          </View>
        ) : null}

        <View style={[a.gap_md, gtMobile ? a.flex_row : a.flex_col]}>
          <Button
            variant="outline"
            color="secondary"
            size="large"
            label={_(msg`Skip for now`)}
            onPress={onSkip}>
            <ButtonText>
              <Trans>Skip for now</Trans>
            </ButtonText>
          </Button>

          <Button
            disabled={claiming}
            variant="gradient"
            color="gradient_sky"
            size="large"
            label={_(msg`Claim ${ensSubdomain}`)}
            onPress={onClaimSubdomain}>
            <ButtonText>
              {claiming ? <Trans>Claiming...</Trans> : <Trans>Claim ENS</Trans>}
            </ButtonText>
            {!claiming && <ButtonIcon icon={ChevronRight} position="right" />}
          </Button>
        </View>
      </OnboardingControls.Portal>
    </View>
  )
}
