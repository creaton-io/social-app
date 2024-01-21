import React from 'react'
import Svg, {Path, SvgProps, PathProps} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'

const ratio = 17 / 64

export function Logotype({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const pal = usePalette('default')
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32)

  return (
    <Svg
      fill="none"
      viewBox="0 0 64 17"
      {...rest}
      width={size}
      height={Number(size) * ratio}>
      <Path
        fill={fill || pal.text.color}
        d="M8.478 6.252c1.503.538 2.3 1.78 2.3 3.172 0 2.356-1.576 3.785-4.6 3.785H0V0h5.974c2.875 0 4.267 1.466 4.267 3.413 0 1.3-.594 2.245-1.763 2.839Zm-2.69-4.193H2.504v3.45h3.284c1.28 0 1.967-.667 1.967-1.78 0-1.02-.705-1.67-1.967-1.67Zm-3.284 9.072h3.544c1.41 0 2.17-.65 2.17-1.818 0-1.224-.723-1.837-2.17-1.837H2.504v3.655ZM14.251 13.209h-2.337V0h2.337v13.209ZM22.001 8.998V3.636h2.338v9.573h-2.263v-1.392c-.724 1.076-1.726 1.614-3.006 1.614-2.022 0-3.34-1.224-3.34-3.45V3.636h2.338v5.955c0 1.206.594 1.818 1.8 1.818 1.132 0 2.133-.835 2.133-2.411ZM34.979 8.59v.556h-7.161c.167 1.651 1.076 2.467 2.486 2.467 1.076 0 1.8-.463 2.189-1.372h2.244c-.5 1.947-2.17 3.19-4.452 3.19-1.428 0-2.579-.463-3.45-1.372-.872-.91-1.318-2.115-1.318-3.637 0-1.502.427-2.708 1.299-3.636.872-.909 2.004-1.372 3.432-1.372 1.447 0 2.597.482 3.45 1.428.854.946 1.28 2.208 1.28 3.747Zm-4.75-3.358c-1.28 0-2.17.742-2.393 2.281h4.805c-.204-1.391-1.057-2.281-2.411-2.281ZM40.16 13.469c-2.783 0-4.249-1.095-4.379-3.303h2.282c.13 1.188.724 1.633 2.134 1.633 1.261 0 1.892-.39 1.892-1.15 0-.687-.445-1.02-1.874-1.262l-1.094-.185c-2.097-.353-3.136-1.318-3.136-2.894 0-1.8 1.429-2.894 3.97-2.894 2.728 0 4.138 1.075 4.23 3.246h-2.207c-.056-1.169-.742-1.577-2.023-1.577-1.113 0-1.67.371-1.67 1.113 0 .668.483.965 1.596 1.169l1.206.186c2.32.426 3.32 1.28 3.32 2.912 0 1.93-1.557 3.006-4.247 3.006ZM54.667 13.209h-2.671l-2.783-4.453-1.447 1.447v3.006h-2.3V0h2.3v7.606l3.896-3.97h2.783l-3.618 3.618 3.84 5.955ZM60.772 6.048l.78-2.412H64l-3.692 10.352c-.39 1.057-.872 1.818-1.484 2.245-.612.426-1.484.63-2.634.63-.39 0-.724-.018-1.02-.055V14.97h.89c1.057 0 1.577-.65 1.577-1.54 0-.445-.149-1.094-.446-1.929l-2.746-7.866h2.487l.779 2.393c.575 1.8 1.076 3.58 1.521 5.343.408-1.521.928-3.302 1.54-5.324Z"
      />
    </Svg>
  )
}
