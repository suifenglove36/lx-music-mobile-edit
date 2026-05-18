import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { useI18n } from '@/lang'
import PlayListRow from './PlayListRow'
import usePlayListPanel from './usePlayListPanel'

export default () => {
  const theme = useTheme()
  const t = useI18n()
  const scrollRef = useRef<ScrollView>(null)
  const confirmRef = useRef<ConfirmAlertType>(null)
  const [confirmProps, setConfirmProps] = useState<{ text: string, onConfirm: () => void } | null>(null)

  const {
    isLoading,
    currentItems,
    tempPlayList,
    activeListId,
    currentListLabel,
    emptyCurrentHint,
    currentPreItems,
    currentPostItems,
    isTempPlayListVisible,
    getCurrentPostItemIndex,
    getItemName,
    getItemSinger,
    getTempItemName,
    getTempItemSinger,
    isCurrentPlayingItem,
    reloadCurrentList,
    handlePlayCurrentItem,
    handlePlayTempItem,
    handleRemoveCurrentItem,
    handleRemoveTempItem,
    handleClearCurrent,
    handleClearTemp,
    registerScrollToIndex,
  } = usePlayListPanel()

  const rowOffsets = useRef<number[]>([])
  const ROW_HEIGHT = 52

  useEffect(() => {
    registerScrollToIndex((index: number) => {
      const offset = rowOffsets.current[index] ?? index * ROW_HEIGHT
      scrollRef.current?.scrollTo({ y: Math.max(0, offset - 80), animated: true })
    })
  }, [registerScrollToIndex])

  const showConfirm = (text: string, onConfirm: () => void) => {
    setConfirmProps({ text, onConfirm })
    requestAnimationFrame(() => {
      confirmRef.current?.setVisible(true)
    })
  }

  const subtitle = useMemo(() => {
    const parts: string[] = []
    if (activeListId) parts.push(`${currentItems.length} 首`)
    if (isTempPlayListVisible) parts.push(`稍后播放 ${tempPlayList.length} 首`)
    return parts.join(' · ')
  }, [activeListId, currentItems.length, isTempPlayListVisible, tempPlayList.length])

  let rowIndex = 0
  const trackRowOffset = () => {
    const current = rowIndex
    rowIndex += 1
    return current * ROW_HEIGHT
  }

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text size={18} style={styles.title}>播放列表</Text>
          <Text size={12} color={theme['c-500']} numberOfLines={2}>
            {currentListLabel}{subtitle ? ` · ${subtitle}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.iconButton, { borderColor: theme['c-border-background'] }]}
          onPress={() => { void reloadCurrentList() }}
          disabled={isLoading}
        >
          <Icon name="list-order" size={16} color={theme['c-500']} />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text size={15}>{currentListLabel}</Text>
          <Text size={11} color={theme['c-500']}>
            {activeListId ? '点击播放、左滑删除' : '当前没有可展示的列表'}
          </Text>
        </View>
        <TouchableOpacity
          disabled={!currentItems.length}
          onPress={() => {
            showConfirm(`确定清空「${currentListLabel}」中的全部歌曲吗？`, () => { void handleClearCurrent() })
          }}
        >
          <Text size={12} color={currentItems.length ? theme['c-primary'] : theme['c-300']}>清空当前列表</Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={theme['c-primary']} />
            <Text size={12} color={theme['c-500']} style={{ marginTop: 10 }}>正在读取播放列表...</Text>
          </View>
        ) : currentItems.length ? (
          <>
            {currentPreItems.map((item, index) => {
              const listIndex = index
              rowOffsets.current[listIndex] = trackRowOffset()
              return (
                <PlayListRow
                  key={`pre_${getItemName(item)}_${listIndex}`}
                  index={listIndex}
                  name={getItemName(item)}
                  singer={getItemSinger(item)}
                  isActive={isCurrentPlayingItem(item)}
                  onPress={() => { handlePlayCurrentItem(item) }}
                  onRemove={() => { void handleRemoveCurrentItem(listIndex) }}
                />
              )
            })}

            {isTempPlayListVisible ? (
              <View style={[styles.queueCard, { borderColor: theme['c-border-background'] }]}>
                <View style={styles.queueHeader}>
                  <View style={{ flex: 1 }}>
                    <Text size={14}>稍后播放</Text>
                    <Text size={11} color={theme['c-500']}>
                      {tempPlayList.length} 首会排在当前歌曲后面
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      showConfirm('确定清空稍后播放列表吗？', () => { handleClearTemp() })
                    }}
                  >
                    <Text size={12} color={theme['c-primary']}>清空稍后播放</Text>
                  </TouchableOpacity>
                </View>
                {tempPlayList.map((item, index) => (
                  <PlayListRow
                    key={`temp_${getTempItemName(item)}_${index}`}
                    index={index}
                    name={getTempItemName(item)}
                    singer={getTempItemSinger(item)}
                    isActive={isCurrentPlayingItem(item)}
                    onPress={() => { handlePlayTempItem(item) }}
                    onRemove={() => { handleRemoveTempItem(index) }}
                  />
                ))}
              </View>
            ) : null}

            {currentPostItems.map((item, index) => {
              const listIndex = getCurrentPostItemIndex(index)
              rowOffsets.current[listIndex] = trackRowOffset()
              return (
                <PlayListRow
                  key={`post_${getItemName(item)}_${listIndex}`}
                  index={listIndex}
                  name={getItemName(item)}
                  singer={getItemSinger(item)}
                  isActive={isCurrentPlayingItem(item)}
                  onPress={() => { handlePlayCurrentItem(item) }}
                  onRemove={() => { void handleRemoveCurrentItem(listIndex) }}
                />
              )
            })}
          </>
        ) : (
          <>
            <View style={[styles.centerBox, { borderColor: theme['c-border-background'] }]}>
              <Icon name="list-order" size={28} color={theme['c-400']} />
              <Text size={14} style={{ marginTop: 8 }}>列表为空</Text>
              <Text size={12} color={theme['c-500']} style={{ marginTop: 4, textAlign: 'center', paddingHorizontal: 24 }}>
                {emptyCurrentHint}
              </Text>
            </View>
            {isTempPlayListVisible ? (
              <View style={[styles.queueCard, { borderColor: theme['c-border-background'] }]}>
                <View style={styles.queueHeader}>
                  <View style={{ flex: 1 }}>
                    <Text size={14}>稍后播放</Text>
                    <Text size={11} color={theme['c-500']}>
                      {tempPlayList.length} 首待播放歌曲
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      showConfirm('确定清空稍后播放列表吗？', () => { handleClearTemp() })
                    }}
                  >
                    <Text size={12} color={theme['c-primary']}>清空稍后播放</Text>
                  </TouchableOpacity>
                </View>
                {tempPlayList.map((item, index) => (
                  <PlayListRow
                    key={`temp_empty_${getTempItemName(item)}_${index}`}
                    index={index}
                    name={getTempItemName(item)}
                    singer={getTempItemSinger(item)}
                    isActive={isCurrentPlayingItem(item)}
                    onPress={() => { handlePlayTempItem(item) }}
                    onRemove={() => { handleRemoveTempItem(index) }}
                  />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {confirmProps ? (
        <ConfirmAlert
          ref={confirmRef}
          text={confirmProps.text}
          cancelText={t('cancel')}
          confirmText={t('confirm')}
          onConfirm={() => {
            confirmProps.onConfirm()
            confirmRef.current?.setVisible(false)
          }}
          onCancel={() => {
            confirmRef.current?.setVisible(false)
          }}
        />
      ) : null}
    </View>
  )
}

const styles = createStyle({
  panel: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  title: {
    fontWeight: '600',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 16,
  },
  centerBox: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    marginHorizontal: 6,
    padding: 20,
  },
  queueCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
})
