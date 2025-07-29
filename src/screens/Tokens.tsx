import {Pressable, StyleSheet, Text, View} from 'react-native'
import {Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQuery} from '@tanstack/react-query'
import {useChainId} from 'wagmi'

import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {useDopplerPonder} from '#/components/hooks/useDopplerPonder'
import * as Layout from '#/components/Layout'

export function TokensScreen() {
  const {_} = useLingui()
  const t = useTheme()
  const chainId = useChainId()

  const {getPoolsQuery} = useDopplerPonder('')

  const poolsQuery = useQuery({
    queryKey: ['pools'],
    queryFn: () => getPoolsQuery(chainId),
  })

  const handleItemPress = (item: any) => {
    console.log(item)
  }

  return (
    <Layout.Screen testID="tokens">
      <Layout.Header.Outer>
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Top Pools</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <View style={[a.flex_row, a.align_center, a.gap_sm]} />
      </Layout.Header.Outer>

      {poolsQuery.data?.items && poolsQuery.data.items.length > 0 && (
        <View style={[styles.listContainer]}>
          <List
            data={poolsQuery.data.items}
            renderItem={({item}) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => handleItemPress(item.id)}
                style={({pressed}) => [
                  styles.conversationItem,
                  pressed && {backgroundColor: t.palette.contrast_50},
                ]}>
                <View style={[a.flex_col]}>
                  <Text
                    style={[
                      styles.conversationText,
                      {color: t.palette.primary_500},
                    ]}>
                    {item.baseToken.name} / {item.quoteToken.name}
                  </Text>
                  <View style={[a.flex_row, a.gap_sm, a.mt_xs]}>
                    <Text
                      style={[
                        styles.conversationSubtext,
                        {color: t.palette.contrast_700},
                      ]}>
                      Volume: ${Number(item.volumeUsd).toLocaleString()}
                    </Text>
                    <Text
                      style={[
                        styles.conversationSubtext,
                        {
                          color:
                            Number(item.percentDayChange) >= 0
                              ? 'green'
                              : 'red',
                        },
                      ]}>
                      {Number(item.percentDayChange).toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}
            keyExtractor={item => item.address}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      <Layout.Center />
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
