import React from 'react'
import {StyleSheet, TextProps} from 'react-native'
import Svg, {
  Defs,
  LinearGradient,
  Path,
  PathProps,
  Stop,
  SvgProps,
} from 'react-native-svg'

// Use aspect ratio from previous SVG
const ratio = 200 / 180

type Props = {
  fill?: PathProps['fill']
  style?: TextProps['style']
} & Omit<SvgProps, 'style'>

export const Logo = React.forwardRef(function LogoImpl(props: Props, ref) {
  // ... existing code ...

  const {...rest} = props
  const styles = StyleSheet.flatten(props.style)
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32)

  return (
    <Svg
      fill="none"
      // @ts-ignore it's fiiiiine
      ref={ref}
      viewBox="0 0 180 180"
      {...rest}
      style={[{width: size, height: size * ratio}, styles]}>
      <Defs>
        <LinearGradient
          id="grd1"
          x1="166.696"
          y1="153.348"
          x2="79.279"
          y2="196.092"
          gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#63c88e" />
          <Stop offset="1" stopColor="#26359c" />
        </LinearGradient>
        <LinearGradient
          id="grd2"
          x1="15"
          y1="72.359"
          x2="91.248"
          y2="72.359"
          gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#63c88e" />
          <Stop offset="1" stopColor="#26359c" />
        </LinearGradient>
      </Defs>
      <Path
        fill="#43e296"
        d="M98.52 58.38L65.14 24.84L117.33 24.91L150.97 58.44C136.47 72.93 112.97 72.91 98.52 58.38Z"
      />
      <Path
        fill="#43e296"
        d="M116.55 99.81L91.49 124.87L66.42 99.81L91.49 74.75L116.55 99.81Z"
      />
      <Path
        fill="url(#grd1)"
        d="M91.25 148.93L42.4 100.09L117.33 24.91L65.14 24.84L15.52 74.46L15.52 125.7L65.02 175.16L117.53 175.16L149.53 143.16C135.03 128.66 111.52 128.66 97.02 143.16L91.25 148.93Z"
      />
      <Path
        fill="#42389d"
        d="M97.08 143.1L65.02 175.16L117.53 175.16L149.53 143.16L149.47 143.1C135 128.64 111.55 128.64 97.08 143.1Z"
      />
      <Path
        fill="url(#grd2)"
        d="M42.4 100.09L15.52 74.36L15 125.35L65.02 175.16L91.25 148.94L42.4 100.09Z"
      />
    </Svg>
  )
})
