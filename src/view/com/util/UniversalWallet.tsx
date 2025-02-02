import React from 'react'
import {StyleSheet, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useMinimalShellFabTransform} from '#/lib/hooks/useMinimalShellTransform'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {clamp} from '#/lib/numbers'
import {isWeb} from '#/platform/detection'
import {WalletComponents} from '#/screens/Login/LoginWallet'

export function UniversalWallet() {
  const insets = useSafeAreaInsets()
  const {isMobile, isTablet} = useWebMediaQueries()
  const fabMinimalShellTransform = useMinimalShellFabTransform()

  const size = isTablet ? styles.sizeLarge : styles.sizeRegular

  const tabletSpacing = isTablet
    ? {right: 200, top: 50}
    : {right: 96, top: clamp(insets.top, 15, 60) + 15}

  if (isTablet === false) return undefined

  return (
    <View
      style={[
        styles.outer,
        size,
        tabletSpacing,
        isMobile && fabMinimalShellTransform,
      ]}>
      <WalletComponents />
    </View>
  )
}

const styles = StyleSheet.create({
  sizeRegular: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  sizeLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  outer: {
    // @ts-ignore web-only
    position: isWeb ? 'fixed' : 'absolute',
    zIndex: 1,
    cursor: 'pointer',
  },
  inner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
