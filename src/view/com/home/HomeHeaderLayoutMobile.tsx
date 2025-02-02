import React from 'react'
import {View} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useHaptics} from '#/lib/haptics'
import {useMinimalShellHeaderTransform} from '#/lib/hooks/useMinimalShellTransform'
import {emitSoftReset} from '#/state/events'
import {useSession} from '#/state/session'
import {useShellLayout} from '#/state/shell/shell-layout'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {ButtonIcon} from '#/components/Button'
import {Hashtag_Stroke2_Corner0_Rounded as FeedsIcon} from '#/components/icons/Hashtag'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'

export function HomeHeaderLayoutMobile({
  children,
}: {
  children: React.ReactNode
  tabBarAnchor: JSX.Element | null | undefined
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {headerHeight} = useShellLayout()
  const headerMinimalShellTransform = useMinimalShellHeaderTransform()
  const {hasSession} = useSession()
  const playHaptic = useHaptics()

  // TEMPORARY - REMOVE AFTER MILLY
  // This will just cause the icon to shake a bit when the user first opens the app, drawing attention to the celebration
  // 🎉
  const rotate = useSharedValue(0)
  const reducedMotion = useReducedMotion()

  // Run this a single time on app mount.
  React.useEffect(() => {
    if (reducedMotion) return

    // Waits 1500ms, then rotates 10 degrees with a spring animation. Repeats once.
    rotate.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(10, {duration: 100}),
          withSpring(0, {
            mass: 1,
            damping: 1,
            stiffness: 200,
            overshootClamping: false,
          }),
        ),
        2,
        false,
      ),
    )
  }, [rotate, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotateZ: `${rotate.value}deg`,
      },
    ],
  }))

  return (
    <Animated.View
      style={[
        a.fixed,
        a.z_10,
        t.atoms.bg,
        {
          top: 0,
          left: 0,
          right: 0,
        },
        headerMinimalShellTransform,
      ]}
      onLayout={e => {
        headerHeight.set(e.nativeEvent.layout.height)
      }}>
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.Slot>
          <Layout.Header.MenuButton />
        </Layout.Header.Slot>

        <View style={[a.flex_1, a.align_center]}>
          <PressableScale
            targetScale={0.9}
            onPress={() => {
              emitSoftReset()
            }}
            onPressIn={() => {
              playHaptic('Heavy')
            }}
            onPressOut={() => {
              playHaptic('Light')
            }}>
            <Logo width={30} />
          </PressableScale>
        </View>

        <Layout.Header.Slot>
          {hasSession && (
            <Link
              testID="viewHeaderHomeFeedPrefsBtn"
              to="/feeds"
              hitSlop={HITSLOP_10}
              label={_(msg`View your feeds and explore more`)}
              size="small"
              variant="ghost"
              color="secondary"
              shape="square"
              style={[
                a.justify_center,
                {
                  marginRight: -Layout.BUTTON_VISUAL_ALIGNMENT_OFFSET,
                },
              ]}>
              <ButtonIcon icon={FeedsIcon} size="lg" />
            </Link>
          )}
        </Layout.Header.Slot>
      </Layout.Header.Outer>
      {children}
    </Animated.View>
  )
}
