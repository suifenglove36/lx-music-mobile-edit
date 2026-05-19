import { memo, useCallback, useMemo, useRef, useState } from 'react'
import {
  Animated,
  LayoutAnimation,
  PanResponder,
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
  onGestureActiveChange,
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
  onGestureActiveChange?: (active: boolean) => void
}) => {
  const theme = useTheme()
  const isPlay = useIsPlay()
  const isActivePlaying = isActive && isPlay

  const translateY = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(1)).current
  const dragOpacity = useRef(new Animated.Value(1)).current
  const [isDragging, setIsDragging] = useState(false)
  const isGestureLockedRef = useRef(false)

  const setGestureLocked = useCallback((locked: boolean) => {
    if (isGestureLockedRef.current === locked) return
    isGestureLockedRef.current = locked
    onGestureActiveChange?.(locked)
  }, [onGestureActiveChange])

  const startDragVisual = useCallback(() => {
    setIsDragging(true)
    setGestureLocked(true)
    Animated.parallel([
      Animated.spring(scale, { toValue: 1.02, useNativeDriver: true, bounciness: 0 }),
      Animated.timing(dragOpacity, { toValue: 0.92, duration: 120, useNativeDriver: true }),
    ]).start()
  }, [dragOpacity, scale, setGestureLocked])

  const endDragVisual = useCallback((onEnd?: () => void) => {
    setIsDragging(false)
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 6 }),
      Animated.timing(dragOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setGestureLocked(false)
      onEnd?.()
    })
  }, [dragOpacity, scale, setGestureLocked, translateY])

  const commitReorder = useCallback((dy: number) => {
    if (!onReorder) return
    const step = Math.round(dy / (ROW_HEIGHT + ROW_GAP))
    if (!step) return
    const target = Math.max(reorderMin, Math.min(reorderMax, index + step))
    if (target === index) return
    runReorderLayoutAnimation()
    onReorder(index, target)
  }, [index, onReorder, reorderMax, reorderMin])

  const handlePress = useCallback(() => {
    if (isGestureLockedRef.current || isDragging) return
    onPress()
  }, [isDragging, onPress])

  const dragResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => sortable,
    onMoveShouldSetPanResponder: (_, gestureState) => (
      sortable && Math.abs(gestureState.dy) > 4
    ),
    onPanResponderGrant: () => {
      startDragVisual()
    },
    onPanResponderMove: (_, gestureState) => {
      translateY.setValue(gestureState.dy)
    },
    onPanResponderRelease: (_, gestureState) => {
      const dy = gestureState.dy
      endDragVisual(() => {
        commitReorder(dy)
      })
    },
    onPanResponderTerminate: () => {
      endDragVisual()
    },
  }), [commitReorder, endDragVisual, sortable, startDragVisual, translateY])

  const itemStyle = useMemo(() => {
    const base = {
      backgroundColor: isQueueItem ? theme['c-content-background'] : theme['c-main-background'],
      borderColor: 'transparent' as string,
      borderWidth: 1,
    }
    if (isActivePlaying) {
      return {
        ...base,
        borderColor: theme['c-primary-alpha-600'],
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

  return (
    <Animated.View
      style={[
        styles.rowWrap,
        {
          opacity: dragOpacity,
          transform: [{ translateY }, { scale }],
          zIndex: isDragging ? 20 : 0,
          elevation: isDragging ? 8 : 0,
        },
      ]}
    >
      <View style={[styles.item, itemStyle, isActivePlaying && styles.itemActivePlaying]}>
        <View
          style={[
            styles.dragHandle,
            {
              borderColor: theme['c-border-background'],
              backgroundColor: theme['c-content-background'],
              opacity: sortable ? 0.75 : 0.4,
            },
          ]}
          {...(sortable ? dragResponder.panHandlers : {})}
        >
          <Text size={13} color={theme['c-500']} style={styles.dragHandleText}>::</Text>
        </View>

        <TouchableOpacity
          style={styles.mainArea}
          activeOpacity={0.85}
          onPress={handlePress}
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

        <TouchableOpacity
          style={styles.rowButton}
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="close" size={15} color={theme['c-500']} />
        </TouchableOpacity>
      </View>
    </Animated.View>
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
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  itemActivePlaying: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  dragHandle: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  dragHandleText: {
    lineHeight: 13,
    fontWeight: '600',
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
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
})
