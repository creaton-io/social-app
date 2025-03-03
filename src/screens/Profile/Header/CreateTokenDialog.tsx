import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {Shadow} from '#/state/cache/types'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

export function CreateTokenDialog({
  profile,
  control,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  control: Dialog.DialogControlProps
}) {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Dialog.Outer control={control} testID="createTokenModal">
      <Dialog.Handle />
      <Dialog.ScrollableInner label={_(msg`Create Token`)}>
        <View style={[a.p_lg]}>
          <View style={[a.pb_lg]}>
            <View style={[a.pt_md, a.pb_xl]}>
              <View
                style={[
                  a.py_md,
                  a.px_lg,
                  t.atoms.bg_contrast_25,
                  a.rounded_md,
                ]}>
                <View style={[a.flex_row, a.align_center, a.pb_xs]}>
                  <View style={[a.flex_1]}>
                    <Text style={[a.font_bold]}>{_(msg`Coming Soon`)}</Text>
                  </View>
                </View>
                <Text>
                  {_(
                    msg`This feature is coming soon. You'll be able to create your own token here.`,
                  )}
                </Text>
              </View>
            </View>
          </View>

          {isNative && (
            <Button
              variant="solid"
              color="primary"
              size="small"
              onPress={() => control.close()}
              label={_(msg`Close`)}>
              <ButtonText>
                <Trans>Close</Trans>
              </ButtonText>
            </Button>
          )}
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
