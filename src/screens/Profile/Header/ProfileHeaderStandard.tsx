import React, {memo, useMemo} from 'react'
import {View} from 'react-native'
import {
  AppBskyActorDefs,
  moderateProfile,
  ModerationOpts,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {logger} from '#/logger'
import {isIOS} from '#/platform/detection'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {Shadow} from '#/state/cache/types'
import {useModalControls} from '#/state/modals'
import {
  useProfileBlockMutationQueue,
  useProfileFollowMutationQueue,
} from '#/state/queries/profile'
//import {H3, P, Text} from '#/components/Typography'
import {useResolveDidDocQuery} from '#/state/queries/resolve-uri'
import {useRequireAuth, useSession} from '#/state/session'
import {ProfileMenu} from '#/view/com/profile/ProfileMenu'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {MessageProfileButton} from '#/components/dms/MessageProfileButton'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {
  KnownFollowers,
  shouldShowKnownFollowers,
} from '#/components/KnownFollowers'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import {ProfileHeaderDisplayName} from './DisplayName'
import {ProfileHeaderHandle} from './Handle'
import {ProfileHeaderMetrics} from './Metrics'
import {ProfileHeaderShell} from './Shell'
import TipComponents from './TipComponents'

interface Props {
  profile: AppBskyActorDefs.ProfileViewDetailed
  descriptionRT: RichTextAPI | null
  moderationOpts: ModerationOpts
  hideBackButton?: boolean
  isPlaceholderProfile?: boolean
}

let ProfileHeaderStandard = ({
  profile: profileUnshadowed,
  descriptionRT,
  moderationOpts,
  hideBackButton = false,
  isPlaceholderProfile,
}: Props): React.ReactNode => {
  const profile: Shadow<AppBskyActorDefs.ProfileViewDetailed> =
    useProfileShadow(profileUnshadowed)
  const {currentAccount, hasSession} = useSession()
  const {_} = useLingui()
  const {openModal} = useModalControls()
  const {track} = useAnalytics()
  const basic = Dialog.useDialogControl()
  const moderation = useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    'ProfileHeader',
  )
  const [_queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile)
  const unblockPromptControl = Prompt.usePromptControl()
  const requireAuth = useRequireAuth()
  const isBlockedUser =
    profile.viewer?.blocking ||
    profile.viewer?.blockedBy ||
    profile.viewer?.blockingByList

  const onPressEditProfile = React.useCallback(() => {
    track('ProfileHeader:EditProfileButtonClicked')
    openModal({
      name: 'edit-profile',
      profile,
    })
  }, [track, openModal, profile])

  const useResolveDidQueryResult = useResolveDidDocQuery(profile.did)
  let fullEthAddress = ''
  if (
    useResolveDidQueryResult.data &&
    useResolveDidQueryResult.data.alsoKnownAs[1] !== undefined
  ) {
    const parts = useResolveDidQueryResult.data.alsoKnownAs[1].split(':')
    const ethereumAddress = parts[2]
    fullEthAddress = ethereumAddress
  }

  const onPressFollow = () => {
    requireAuth(async () => {
      try {
        track('ProfileHeader:FollowButtonClicked')
        await queueFollow()
        Toast.show(
          _(
            msg`Following ${sanitizeDisplayName(
              profile.displayName || profile.handle,
              moderation.ui('displayName'),
            )}`,
          ),
        )
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to follow', {message: String(e)})
          Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
        }
      }
    })
  }

  const onPressUnfollow = () => {
    requireAuth(async () => {
      try {
        track('ProfileHeader:UnfollowButtonClicked')
        await queueUnfollow()
        Toast.show(
          _(
            msg`No longer following ${sanitizeDisplayName(
              profile.displayName || profile.handle,
              moderation.ui('displayName'),
            )}`,
          ),
        )
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to unfollow', {message: String(e)})
          Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
        }
      }
    })
  }

  const unblockAccount = React.useCallback(async () => {
    track('ProfileHeader:UnblockAccountButtonClicked')
    try {
      await queueUnblock()
      Toast.show(_(msg`Account unblocked`))
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        logger.error('Failed to unblock account', {message: e})
        Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
      }
    }
  }, [_, queueUnblock, track])

  const isMe = React.useMemo(
    () => currentAccount?.did === profile.did,
    [currentAccount, profile],
  )

  return (
    <ProfileHeaderShell
      profile={profile}
      moderation={moderation}
      hideBackButton={hideBackButton}
      isPlaceholderProfile={isPlaceholderProfile}>
      <View
        style={[a.px_lg, a.pt_md, a.pb_sm, a.overflow_hidden]}
        pointerEvents={isIOS ? 'auto' : 'box-none'}>
        <View
          style={[
            {paddingLeft: 90},
            a.flex_row,
            a.justify_end,
            a.gap_sm,
            a.pb_sm,
            a.flex_wrap,
          ]}
          pointerEvents={isIOS ? 'auto' : 'box-none'}>
          {isMe ? (
            <Button
              testID="profileHeaderEditProfileButton"
              size="small"
              color="secondary"
              variant="solid"
              onPress={onPressEditProfile}
              label={_(msg`Edit profile`)}
              style={[a.rounded_full, a.py_sm]}>
              <ButtonText>
                <Trans>Edit Profile</Trans>
              </ButtonText>
            </Button>
          ) : profile.viewer?.blocking ? (
            profile.viewer?.blockingByList ? null : (
              <Button
                testID="unblockBtn"
                size="small"
                color="secondary"
                variant="solid"
                label={_(msg`Unblock`)}
                disabled={!hasSession}
                onPress={() => unblockPromptControl.open()}
                style={[a.rounded_full, a.py_sm]}>
                <ButtonText>
                  <Trans context="action">Unblock</Trans>
                </ButtonText>
              </Button>
            )
          ) : !profile.viewer?.blockedBy ? (
            <>
              {hasSession && <MessageProfileButton profile={profile} />}
              {fullEthAddress && (
                <Button
                  variant="gradient"
                  color="gradient_sunset"
                  size="small"
                  onPress={() => {
                    basic.open()
                  }}
                  label="Open basic dialog">
                  <ButtonText>Tip</ButtonText>
                </Button>
              )}

              <Button
                testID={profile.viewer?.following ? 'unfollowBtn' : 'followBtn'}
                size="small"
                color={profile.viewer?.following ? 'secondary' : 'primary'}
                variant="solid"
                label={
                  profile.viewer?.following
                    ? _(msg`Unfollow ${profile.handle}`)
                    : _(msg`Follow ${profile.handle}`)
                }
                onPress={
                  profile.viewer?.following ? onPressUnfollow : onPressFollow
                }
                style={[a.rounded_full, a.gap_xs, a.py_sm]}>
                <ButtonIcon
                  position="left"
                  icon={profile.viewer?.following ? Check : Plus}
                />
                <ButtonText>
                  {profile.viewer?.following ? (
                    <Trans>Following</Trans>
                  ) : profile.viewer?.followedBy ? (
                    <Trans>Follow Back</Trans>
                  ) : (
                    <Trans>Follow</Trans>
                  )}
                </ButtonText>
              </Button>
            </>
          ) : null}
          <ProfileMenu profile={profile} />
        </View>
        <View style={[a.flex_col, a.gap_xs, a.pb_sm]}>
          <ProfileHeaderDisplayName profile={profile} moderation={moderation} />
          <ProfileHeaderHandle profile={profile} />
        </View>
        {!isPlaceholderProfile && !isBlockedUser && (
          <>
            <ProfileHeaderMetrics profile={profile} />
            {descriptionRT && !moderation.ui('profileView').blur ? (
              <View pointerEvents="auto">
                <RichText
                  testID="profileHeaderDescription"
                  style={[a.text_md]}
                  numberOfLines={15}
                  value={descriptionRT}
                  enableTags
                  authorHandle={profile.handle}
                />
              </View>
            ) : undefined}

            {!isMe &&
              !isBlockedUser &&
              shouldShowKnownFollowers(profile.viewer?.knownFollowers) && (
                <View style={[a.flex_row, a.align_center, a.gap_sm, a.pt_md]}>
                  <KnownFollowers
                    profile={profile}
                    moderationOpts={moderationOpts}
                  />
                </View>
              )}
          </>
        )}
      </View>
      <Prompt.Basic
        control={unblockPromptControl}
        title={_(msg`Unblock Account?`)}
        description={_(
          msg`The account will be able to interact with you after unblocking.`,
        )}
        onConfirm={unblockAccount}
        confirmButtonCta={
          profile.viewer?.blocking ? _(msg`Unblock`) : _(msg`Block`)
        }
        confirmButtonColor="negative"
      />
      <Dialog.Outer control={basic}>
        <Dialog.Handle />

        <Dialog.Inner label="test" style={{width: 300}}>
          {/* <H3 nativeID="dialog-title">Dialog</H3>
          <P nativeID="dialog-description">A basic dialog</P> */}
          <TipComponents sendAddress={fullEthAddress} />
        </Dialog.Inner>
      </Dialog.Outer>
    </ProfileHeaderShell>
  )
}
ProfileHeaderStandard = memo(ProfileHeaderStandard)
export {ProfileHeaderStandard}
