import { memo, useCallback, useMemo } from 'react'
import {
  LayoutAnimation,
  Platform,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useIsPlay } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import { PlayDot, PlayEqBars } from './PlayIndicator'

export const ROW_HEIGHT = 54
export const ROW_GAP = 8

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const runReorderLayoutAnimation = () => {
  LayoutAnimation.configureNext({
    duration: 220,
    update: { type: LayoutAnimation.Types.easeInEaseOut },
    create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  })
}

export default memo(({
  index,
  name,
  singer,
  isActive,
  isQueueItem = false,
  sortable = false,
  reorderMin = 0,
  reorderMax = Number.MAX_SAFE_INTEGER,
  onPress,
  onRemove,
  onReorder,
}: {
  index: number
  name: string
  singer: string
  isActive: boolean
  isQueueItem?: boolean
  sortable?: boolean
  reorderMin?: number
  reorderMax?: number
  onPress: () => void
  onRemove: () => void
  onReorder?: (fromIndex: number, toIndex: number) => void
}) => {
  const theme = useTheme()
  const isPlay = useIsPlay()
  const isActivePlaying = isActive && isPlay

  const canMoveUp = sortable && index > reorderMin
  const canMoveDown = sortable && index < reorderMax

  const handleMoveUp = useCallback(() => {
    if (!canMoveUp || !onReorder) return
    runReorderLayoutAnimation()
    onReorder(index, index - 1)
  }, [canMoveUp, index, onReorder])

  const handleMoveDown = useCallback(() => {
    if (!canMoveDown || !onReorder) return
    runReorderLayoutAnimation()
    onReorder(index, index + 1)
  }, [canMoveDown, index, onReorder])

  const itemStyle = useMemo(() => {
    const base = {
      backgroundColor: isQueueItem ? theme['c-content-background'] : theme['c-main-background'],
      borderColor: 'transparent' as string,
      borderWidth: 1,
    }
    if (isActivePlaying) {
      return {
        ...base,
        backgroundColor: theme['c-primary-alpha-900'],
      }
    }
    if (isActive) {
      return {
        ...base,
        borderColor: theme['c-primary-alpha-700'],
      }
    }
    return base
  }, [isActive, isActivePlaying, isQueueItem, theme])

  const moveIconColor = theme['c-500']
  const moveIconDisabledColor = theme['c-300']

  return (
    <View style={styles.rowWrap}>
      <View style={[styles.item, itemStyle]}>
        <TouchableOpacity
          style={styles.mainArea}
          activeOpacity={0.85}
          onPress={onPress}
        >
          <Text size={12} color={theme['c-500']} style={styles.index}>{index + 1}</Text>
          {isActive ? <PlayDot /> : null}
          {isActive ? <PlayEqBars isPlaying={isPlay} /> : null}
          <View style={styles.meta}>
            <Text
              size={14}
              color={isActive ? theme['c-primary-font'] : theme['c-font']}
              numberOfLines={1}
              style={styles.name}
            >
              {name}
            </Text>
            <Text
              size={12}
              color={isActive ? theme['c-primary-alpha-300'] : theme['c-500']}
              numberOfLines={1}
              style={styles.singer}
            >
              {singer}
            </Text>
          </View>
        </TouchableOpacity>

        {sortable ? (
          <>
            <TouchableOpacity
              style={styles.rowButton}
              onPress={handleMoveUp}
              disabled={!canMoveUp}
              accessibilityLabel="上移"
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <View style={styles.chevronUp}>
                <Icon
                  name="chevron-right"
                  size={14}
                  color={canMoveUp ? moveIconColor : moveIconDisabledColor}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rowButton}
              onPress={handleMoveDown}
              disabled={!canMoveDown}
              accessibilityLabel="下移"
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <View style={styles.chevronDown}>
                <Icon
                  name="chevron-right"
                  size={14}
                  color={canMoveDown ? moveIconColor : moveIconDisabledColor}
                />
              </View>
            </TouchableOpacity>
          </>
        ) : null}

        <TouchableOpacity
          style={styles.rowButton}
          onPress={onRemove}
          accessibilityLabel="删除"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="close" size={15} color={theme['c-500']} />
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = createStyle({
  rowWrap: {
    marginBottom: ROW_GAP,
  },
  item: {
    minHeight: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  index: {
    width: 24,
    textAlign: 'right',
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  name: {
    lineHeight: 19,
  },
  singer: {
    lineHeight: 16,
  },
  rowButton: {
    width: 26,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  chevronUp: {
    transform: [{ rotate: '-90deg' }],
  },
  chevronDown: {
    transform: [{ rotate: '90deg' }],
  },
})
