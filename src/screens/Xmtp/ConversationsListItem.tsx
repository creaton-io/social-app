import {useState} from 'react'
import {useEffect} from 'react'
import {Pressable, StyleSheet, Text} from 'react-native'
import {Trans} from '@lingui/macro'
import {type Conversation, type Group} from '@xmtp/browser-sdk'

import {useTheme} from '#/alf'

export function ConversationsListItem({
  item,
  handleItemPress,
}: {
  item: Conversation | Group
  handleItemPress: (conversationId: string) => void
}) {
  const t = useTheme()

  const [members, setMembers] = useState<any[]>([])

  useEffect(() => {
    async function fetchMembers() {
      const fetchedMembers = await item.members()
      setMembers(fetchedMembers)
    }
    fetchMembers()
  }, [item])

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => handleItemPress(item.id)}
      style={({pressed}) => [
        styles.conversationItem,
        pressed && {backgroundColor: t.palette.contrast_50},
      ]}>
      <Text style={[styles.conversationText, {color: t.palette.primary_500}]}>
        {(item as Group).name || item.id}
      </Text>
      {item.metadata?.conversationType === 'group' && (
        <Text
          style={[styles.conversationSubtext, {color: t.palette.contrast_700}]}>
          {(item as Group).description}
        </Text>
      )}

      {members.length > 0 && (
        <Text
          style={[styles.conversationSubtext, {color: t.palette.contrast_700}]}>
          {members.map(member => member.inboxId).join(', ')}
        </Text>
      )}

      {item.metadata?.conversationType === 'dm' && (
        <Text
          style={[styles.conversationSubtext, {color: t.palette.contrast_700}]}>
          <Trans>Direct Message</Trans>
        </Text>
      )}
      {item.metadata?.conversationType === 'group' && (
        <Text
          style={[styles.conversationSubtext, {color: t.palette.contrast_700}]}>
          <Trans>Group Chat</Trans>
        </Text>
      )}
    </Pressable>
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
