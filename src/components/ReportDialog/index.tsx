import React from 'react'
import {Pressable, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ReportOption} from '#/lib/moderation/useReportOptions'
import {useMyLabelersQuery} from '#/state/queries/preferences'
export {useDialogControl as useReportDialogControl} from '#/components/Dialog'

import {AppBskyLabelerDefs} from '@atproto/api'
import {BottomSheetScrollViewMethods} from '@discord/bottom-sheet/src'

import {atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {useDelayedLoading} from '#/components/hooks/useDelayedLoading'
import {useOnKeyboardDidShow} from '#/components/hooks/useOnKeyboard'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {SelectLabelerView} from './SelectLabelerView'
import {SelectReportOptionView} from './SelectReportOptionView'
import {SubmitView} from './SubmitView'
import {ReportDialogProps} from './types'

export function ReportDialog(props: ReportDialogProps) {
  return (
    <Dialog.Outer control={props.control}>
      <Dialog.Handle />

      <ReportDialogInner {...props} />
    </Dialog.Outer>
  )
}

function ReportDialogInner(props: ReportDialogProps) {
  const {_} = useLingui()
  const {
    isLoading: isLabelerLoading,
    data: labelers,
    error,
  } = useMyLabelersQuery()
  const isLoading = useDelayedLoading(500, isLabelerLoading)

  const ref = React.useRef<BottomSheetScrollViewMethods>(null)
  useOnKeyboardDidShow(() => {
    ref.current?.scrollToEnd({animated: true})
  })

  return (
    <Dialog.ScrollableInner label={_(msg`Report dialog`)} ref={ref}>
      {isLoading ? (
        <View style={[a.align_center, {height: 100}]}>
          <Loader size="xl" />
          {/* Here to capture focus for a hot sec to prevent flash */}
          <Pressable accessible={false} />
        </View>
      ) : error || !labelers ? (
        <View>
          <Text style={[a.text_md]}>
            <Trans>Something went wrong, please try again.</Trans>
          </Text>
        </View>
      ) : (
        <ReportDialogLoaded labelers={labelers} {...props} />
      )}
    </Dialog.ScrollableInner>
  )
}

function ReportDialogLoaded(
  props: ReportDialogProps & {
    labelers: AppBskyLabelerDefs.LabelerViewDetailed[]
  },
) {
  const [selectedLabeler, setSelectedLabeler] = React.useState<
    string | undefined
  >(props.labelers.length === 1 ? props.labelers[0].creator.did : undefined)
  const [selectedReportOption, setSelectedReportOption] = React.useState<
    ReportOption | undefined
  >()

  if (selectedReportOption && selectedLabeler) {
    return (
      <SubmitView
        {...props}
        selectedLabeler={selectedLabeler}
        selectedReportOption={selectedReportOption}
        goBack={() => setSelectedReportOption(undefined)}
        onSubmitComplete={() => props.control.close()}
      />
    )
  }
  if (selectedLabeler) {
    return (
      <SelectReportOptionView
        {...props}
        goBack={() => setSelectedLabeler(undefined)}
        onSelectReportOption={setSelectedReportOption}
      />
    )
  }
  return <SelectLabelerView {...props} onSelectLabeler={setSelectedLabeler} />
}
