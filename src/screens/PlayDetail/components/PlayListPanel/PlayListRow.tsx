import { memo, useCallback, useMemo, useRef } from 'react'
import { Animated, PanResponder, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useIsPlay } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import PlayIndicator from './PlayIndicator'

const SWIPE_OPEN = -72
const SWIPE_TRIGGER = -48
const ROW_STEP = 52

export default memo(({
  index,
  name,
  singer,
  isActive,
  sortable = false,
  onPress,
  onRemove,
  onReorder,
  onGestureActiveChange,
}: {
  index: number
  name: string
  singer: string
  isActive: boolean
  sortable?: boolean
  onPress: () => void
  onRemove: () => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  onGestureActiveChange?: (active: boolean) => void
}) => {
  const theme = useTheme()
  const isPlay = useIsPlay()
  const translateX = useRef(new Animated.Value(0)).current
  const isOpenRef = useRef(false)
  const isGestureLockedRef = useRef(false)
  const reorderAccumRef = useRef(0)
  const reorderingRef = useRef(false)

  const setGestureLocked = useCallback((locked: boolean) => {
    if (isGestureLockedRef.current === locked) return
    isGestureLockedRef.current = locked
    onGestureActiveChange?.(locked)
  }, [onGestureActiveChange])

  const snapSwipe = useCallback((open: boolean) => {
    isOpenRef.current = open
    Animated.spring(translateX, {
      toValue: open ? SWIPE_OPEN : 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start()
  }, [translateX])

  const handlePress = useCallback(() => {
    if (isGestureLockedRef.current) return
    if (isOpenRef.current) {
      snapSwipe(false)
      return
    }
    onPress()
  }, [onPress, snapSwipe])

  const handleRemove = useCallback(() => {
    snapSwipe(false)
    onRemove()
  }, [onRemove, snapSwipe])

  const swipeResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => (
      !reorderingRef.current &&
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
      Math.abs(gestureState.dx) > 6
    ),
    onPanResponderGrant: () => {
      setGestureLocked(true)
    },
    onPanResponderMove: (_, gestureState) => {
      if (reorderingRef.current) return
      const base = isOpenRef.current ? SWIPE_OPEN : 0
      const next = Math.min(0, Math.max(SWIPE_OPEN, base + gestureState.dx))
      translateX.setValue(next)
    },
    onPanResponderRelease: (_, gestureState) => {
      if (reorderingRef.current) return
      const base = isOpenRef.current ? SWIPE_OPEN : 0
      const finalX = Math.min(0, Math.max(SWIPE_OPEN, base + gestureState.dx))
      if (finalX <= SWIPE_TRIGGER) {
        snapSwipe(true)
      } else {
        snapSwipe(false)
      }
      setGestureLocked(false)
    },
    onPanResponderTerminate: () => {
      snapSwipe(isOpenRef.current)
      setGestureLocked(false)
    },
  }), [setGestureLocked, snapSwipe, translateX])

  const reorderResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => sortable,
    onMoveShouldSetPanResponder: (_, gestureState) => (
      sortable && Math.abs(gestureState.dy) > 6
    ),
    onPanResponderGrant: () => {
      reorderingRef.current = true
      reorderAccumRef.current = 0
      setGestureLocked(true)
    },
    onPanResponderMove: (_, gestureState) => {
      if (!onReorder) return
      reorderAccumRef.current += gestureState.dy
      if (reorderAccumRef.current > ROW_STEP) {
        onReorder(index, index + 1)
        reorderAccumRef.current = 0
      } else if (reorderAccumRef.current < -ROW_STEP) {
        onReorder(index, index - 1)
        reorderAccumRef.current = 0
      }
    },
    onPanResponderRelease: () => {
      reorderingRef.current = false
      reorderAccumRef.current = 0
      setGestureLocked(false)
    },
    onPanResponderTerminate: () => {
      reorderingRef.current = false
      reorderAccumRef.current = 0
      setGestureLocked(false)
    },
  }), [index, onReorder, setGestureLocked, sortable])

  return (
    <View style={styles.rowWrap}>
      <View style={[styles.deleteAction, { backgroundColor: '#e74c3c' }]}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleRemove} activeOpacity={0.8}>
          <Icon name="close" size={14} color="#fff" />
          <Text size={12} color="#fff" style={{ marginTop: 2 }}>删除</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.item,
          { transform: [{ translateX }] },
          isActive && { backgroundColor: theme['c-primary-background-hover'] },
        ]}
        {...swipeResponder.panHandlers}
      >
        <View
          style={styles.dragHandle}
          {...(sortable ? reorderResponder.panHandlers : {})}
        >
          {sortable ? (
            <Text size={12} color={theme['c-400']}>⋮⋮</Text>
          ) : (
            <View style={styles.dragHandlePlaceholder} />
          )}
        </View>

        <TouchableOpacity
          style={styles.mainTap}
          onPress={handlePress}
          activeOpacity={0.7}
          delayLongPress={sortable ? 280 : undefined}
        >
          <View style={styles.indexCell}>
            {isActive
              ? <PlayIndicator isPlaying={isPlay} />
              : <Text size={12} color={theme['c-400']}>{index + 1}</Text>}
          </View>
          <View style={styles.meta}>
            <Text size={14} color={isActive ? theme['c-primary-font'] : theme['c-font']} numberOfLines={1}>{name}</Text>
            <Text size={11} color={isActive ? theme['c-primary-alpha-300'] : theme['c-500']} numberOfLines={1}>{singer}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeBtn}
          onPress={handleRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="close" size={12} color={theme['c-400']} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
})

const styles = createStyle({
  rowWrap: {
    position: 'relative',
    marginBottom: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  deleteAction: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 18,
  },
  deleteBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 8,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  dragHandle: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  dragHandlePlaceholder: {
    width: 12,
    height: 12,
  },
  mainTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  indexCell: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  removeBtn: {
    padding: 4,
  },
})
