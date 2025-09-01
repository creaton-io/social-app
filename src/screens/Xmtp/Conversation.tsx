import {useCallback, useEffect, useState} from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {type Conversation, type DecodedMessage} from '@xmtp/browser-sdk'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft} from '#/components/icons/Arrow'
import * as Layout from '#/components/Layout'
import {Text as TypographyText} from '#/components/Typography'
import {navigate} from '#/Navigation'
import {useInitializeXMTP, useXMTP} from './useXmtp'

type Props = NativeStackScreenProps<any, 'XmtpConversation'>

interface XmtpMessage extends DecodedMessage {
  senderAddress: string
  content: string
  senderInboxId: string
  timestamp?: Date
}

export function XmtpConversationScreen({route}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const conversationId = route.params?.conversation
  const {client, sendMessage} = useXMTP()
  const {initializeIfNeeded} = useInitializeXMTP()
  const [messages, setMessages] = useState<XmtpMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [conversation, setConversation] = useState<Conversation | null>(null)

  useEffect(() => {
    // Initialize XMTP when entering the conversation screen
    const initialize = async () => {
      if (!client) {
        try {
          await initializeIfNeeded()
        } catch (error) {
          console.error('Failed to initialize XMTP:', error)
        }
      }
    }
    initialize()
  }, [client, initializeIfNeeded])

  useEffect(() => {
    async function fetchConversation() {
      if (!client) return

      try {
        const conv = await client.conversations.getConversationById(
          conversationId,
        )
        if (!conv) return

        setConversation(conv)

        // Load existing messages
        const msgs = await conv.messages()
        setMessages(
          (msgs as DecodedMessage[]).map(
            msg =>
              ({
                ...msg,
                timestamp: msg.sentAtNs
                  ? new Date(Number(msg.sentAtNs) / 1e6)
                  : undefined,
              } as XmtpMessage),
          ),
        )

        // Subscribe to new messages
        // const stream = await conv.streamMessages();
        // for await (const msg of stream) {
        //   setMessages(prev => [...prev, msg as XmtpMessage])
        // }
      } catch (error) {
        console.error('Error fetching conversation:', error)
      }
    }

    fetchConversation()
  }, [client, conversationId])

  const handleBack = useCallback(() => {
    navigate('Xmtp')
  }, [])

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !conversation || !client) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    // Optimistically add the message to the list
    const optimisticMessage = {
      content: messageContent,
      senderInboxId: client.inboxId || '',
      timestamp: new Date(),
      contentType: 'text',
      conversationId: conversationId,
      deliveryStatus: 'sent',
      id: `optimistic-${Date.now()}`,
      isSending: true,
      type: 'message',
      contentBytes: new TextEncoder().encode(messageContent),
      contentTopic: conversationId,
      messageVersion: 'v1',
      senderAddress: client.inboxId || '',
      recipientAddress: conversationId,
    } as unknown as XmtpMessage

    setMessages(prev => [...prev, optimisticMessage])

    try {
      await sendMessage(conversation, messageContent)
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove the optimistic message if sending failed
      setMessages(prev => prev.filter(msg => msg !== optimisticMessage))
    }
  }, [newMessage, conversation, client, sendMessage, conversationId])

  const handleKeyPress = useCallback(
    (e: any) => {
      if (
        e.nativeEvent.key === 'Enter' &&
        (e.nativeEvent.metaKey || e.nativeEvent.ctrlKey)
      ) {
        handleSend()
      }
    },
    [handleSend],
  )

  const isOwnMessage = (message: XmtpMessage) => {
    return client?.inboxId === message.senderInboxId
  }

  return (
    <Layout.Screen testID="xmtpConversationScreen">
      <Layout.Header.Outer>
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>XMTP Chat</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <View style={[a.flex_row, a.align_center, a.gap_sm]}>
          <Button
            label={_(msg`Back`)}
            color="primary"
            size="small"
            variant="ghost"
            onPress={handleBack}
            style={[a.mr_md]}>
            <ButtonIcon icon={ArrowLeft} position="left" />
            <ButtonText>
              <Trans>Back</Trans>
            </ButtonText>
          </Button>
        </View>
      </Layout.Header.Outer>

      <Layout.Content>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[a.flex_1]}>
          <ScrollView
            style={[a.flex_1, a.px_md, a.py_lg]}
            contentContainerStyle={[]}>
            {messages.map((message, index) => (
              <View
                key={index}
                style={[
                  a.p_md,
                  a.mb_sm,
                  a.rounded_md,
                  isOwnMessage(message)
                    ? [{backgroundColor: t.palette.primary_500}, a.self_end]
                    : [t.atoms.bg_contrast_50, a.self_start],
                  {maxWidth: '80%'},
                ]}>
                <TypographyText
                  style={[
                    a.text_xs,
                    a.mt_xs,
                    isOwnMessage(message)
                      ? {color: '#E0E0E0'}
                      : t.atoms.text_contrast_medium,
                  ]}
                  accessibilityLabel={_('Message date and time')}
                  accessibilityHint={_(
                    'The date and time this message was sent.',
                  )}>
                  {message.sentAtNs
                    ? new Date(Number(message.sentAtNs) / 1e6).toLocaleString()
                    : ''}
                </TypographyText>
                <TypographyText
                  style={[
                    isOwnMessage(message) ? {color: '#FFFFFF'} : t.atoms.text,
                  ]}>
                  {message.content}
                </TypographyText>
              </View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>

        <View
          style={[
            a.flex_row,
            a.p_md,
            t.atoms.bg,
            a.border_t,
            t.atoms.border_contrast_low,
          ]}>
          <TextInput
            style={[
              a.flex_1,
              a.p_md,
              a.rounded_md,
              t.atoms.bg_contrast_50,
              t.atoms.text,
              {minHeight: 40},
            ]}
            value={newMessage}
            onChangeText={setNewMessage}
            onKeyPress={handleKeyPress}
            placeholder={_('Type a message... (⌘+Enter to send)')}
            placeholderTextColor={t.palette.contrast_500}
            multiline
            accessibilityLabel={_('Message input')}
            accessibilityHint={_(
              'Type your message here. Press Command+Enter to send.',
            )}
          />
          <Button
            label={_(msg`Send`)}
            color="primary"
            size="small"
            variant="solid"
            onPress={handleSend}
            style={[a.ml_sm]}
            accessibilityLabel={_('Send message')}
            accessibilityHint={_('Tap to send your message')}>
            <ButtonText>
              <Trans>Send</Trans>
            </ButtonText>
          </Button>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}
