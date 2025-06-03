import {useCallback, useEffect, useState} from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {type Conversation} from '@xmtp/browser-sdk'

import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Message_Stroke2_Corner0_Rounded as Message} from '#/components/icons/Message'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'
import {Text as TypographyText} from '#/components/Typography'
import {navigate} from '#/Navigation'
import {useXMTP} from './useXmtp'

type Props = NativeStackScreenProps<any, 'Xmtp'>

export function XmtpScreen({}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const {client, newDm} = useXMTP()
  const [newChatAddress, setNewChatAddress] = useState('')
  const dialogControl = Dialog.useDialogControl()

  useEffect(() => {
    console.log('GOT HERE THE CLIENT xmtpScreen', client)
    async function fetchConversations() {
      if (!client) return
      setConversations(await client.conversations.list())
    }
    fetchConversations()
  }, [client])

  const handleConversationPress = useCallback((conversationId: string) => {
    navigate('XmtpConversation', {conversation: conversationId})
  }, [])

  const handleNewChat = useCallback(async () => {
    if (!client) {
      console.error('XMTP client not initialized')
      return
    }

    try {
      let conversation: Conversation | undefined = await newDm(newChatAddress)
      if (!conversation) {
        console.error('Failed to create new conversation')
        return
      }

      // Navigate to the conversation
      navigate('XmtpConversation', {conversation: conversation.id})
      dialogControl.close()
      setNewChatAddress('')
    } catch (error) {
      console.error('Error creating new conversation:', error)
    }
  }, [client, newChatAddress, dialogControl, newDm])

  const renderItem = useCallback(
    ({item}: {item: Conversation}) => {
      return (
        <Pressable
          accessibilityRole="button"
          onPress={() => handleConversationPress(item.id)}
          style={({pressed}) => [
            styles.conversationItem,
            pressed && {backgroundColor: t.palette.contrast_50},
          ]}>
          <Text
            style={[styles.conversationText, {color: t.palette.primary_500}]}>
            {item.id}
          </Text>
          {item.metadata?.conversationType === 'dm' && (
            <Text
              style={[
                styles.conversationSubtext,
                {color: t.palette.contrast_700},
              ]}>
              <Trans>Direct Message</Trans>
            </Text>
          )}
          {item.metadata?.conversationType === 'group' && (
            <Text
              style={[
                styles.conversationSubtext,
                {color: t.palette.contrast_700},
              ]}>
              <Trans>Group Chat</Trans>
            </Text>
          )}
        </Pressable>
      )
    },
    [
      t.palette.primary_500,
      t.palette.contrast_700,
      t.palette.contrast_50,
      handleConversationPress,
    ],
  )

  const keyExtractor = useCallback((item: Conversation) => item.id, [])

  return (
    <Layout.Screen testID="xmtpScreen">
      <Layout.Header.Outer>
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>XMTP Messages</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <View style={[a.flex_row, a.align_center, a.gap_sm]}>
          <Button
            label={_(msg`New chat`)}
            color="primary"
            size="small"
            variant="solid"
            onPress={() => dialogControl.open()}>
            <ButtonIcon icon={Plus} position="left" />
            <ButtonText>
              <Trans>New chat</Trans>
            </ButtonText>
          </Button>
        </View>
      </Layout.Header.Outer>

      {conversations.length === 0 && (
        <Layout.Center>
          <View style={[a.pt_3xl, a.align_center]}>
            <Message width={48} fill={t.palette.primary_500} />
            <TypographyText style={[a.pt_md, a.pb_sm, a.text_2xl, a.font_bold]}>
              <Trans>Nothing here</Trans>
            </TypographyText>
            <TypographyText
              style={[
                a.text_md,
                a.pb_xl,
                a.text_center,
                a.leading_snug,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>You have no XMTP conversations yet.</Trans>
            </TypographyText>
          </View>
        </Layout.Center>
      )}

      {conversations.length > 0 && (
        <View style={[styles.listContainer]}>
          <List
            data={conversations}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      <Dialog.Outer control={dialogControl}>
        <Dialog.Handle />
        <Dialog.Inner label={_('New Chat')}>
          <TypographyText style={[a.text_md, a.mb_md]}>
            <Trans>
              Enter an Ethereum address or inbox ID to start a new conversation
            </Trans>
          </TypographyText>
          <View style={[a.mt_md]}>
            <Dialog.Input
              label={_('Address or inbox ID')}
              value={newChatAddress}
              onChangeText={setNewChatAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={[a.flex_row, a.justify_end, a.gap_md, a.mt_md]}>
            <Button
              label={_('Cancel')}
              color="secondary"
              variant="ghost"
              onPress={() => {
                dialogControl.close()
                setNewChatAddress('')
              }}>
              <ButtonText>
                <Trans>Cancel</Trans>
              </ButtonText>
            </Button>
            <Button
              label={_('Start Chat')}
              color="primary"
              size="small"
              variant="solid"
              onPress={handleNewChat}>
              <ButtonText>
                <Trans>Start Chat</Trans>
              </ButtonText>
            </Button>
          </View>
        </Dialog.Inner>
      </Dialog.Outer>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    minHeight: 400,
  },
  listContent: {
    paddingVertical: 10,
  },
  conversationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  conversationText: {
    fontSize: 16,
    fontWeight: '500',
  },
  conversationSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
})
