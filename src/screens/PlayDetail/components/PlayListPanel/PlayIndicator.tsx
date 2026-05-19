import { memo, useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

const EqBar = ({ anim, minH, maxH, color }: { anim: Animated.Value, minH: number, maxH: number, color: string }) => {
  const height = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [minH, maxH],
  })
  return <Animated.View style={[styles.eqBar, { height, backgroundColor: color }]} />
}

export const PlayDot = memo(() => {
  const theme = useTheme()
  const dotAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    )
    dotLoop.start()
    return () => {
      dotLoop.stop()
    }
  }, [dotAnim])

  const dotScale = dotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  })

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          backgroundColor: theme['c-primary'],
          transform: [{ scale: dotScale }],
        },
      ]}
    />
  )
})

export const PlayEqBars = memo(({ isPlaying }: { isPlaying: boolean }) => {
  const theme = useTheme()
  const eq1 = useRef(new Animated.Value(0)).current
  const eq2 = useRef(new Animated.Value(0)).current
  const eq3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!isPlaying) return
    const createEqLoop = (anim: Animated.Value, duration: number) => Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: duration / 2, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: duration / 2, useNativeDriver: false }),
      ]),
    )
    const loop1 = createEqLoop(eq1, 700)
    const loop2 = createEqLoop(eq2, 560)
    const loop3 = createEqLoop(eq3, 640)
    loop1.start()
    loop2.start()
    loop3.start()
    return () => {
      loop1.stop()
      loop2.stop()
      loop3.stop()
      eq1.setValue(0)
      eq2.setValue(0)
      eq3.setValue(0)
    }
  }, [isPlaying, eq1, eq2, eq3])

  const barColor = isPlaying ? theme['c-primary'] : theme['c-500']

  return (
    <View style={styles.eq}>
      <EqBar anim={eq1} minH={5} maxH={14} color={barColor} />
      <EqBar anim={eq2} minH={6} maxH={16} color={barColor} />
      <EqBar anim={eq3} minH={5} maxH={12} color={barColor} />
    </View>
  )
})

const styles = createStyle({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  eq: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    width: 24,
    height: 16,
  },
  eqBar: {
    width: 3,
    borderRadius: 999,
    opacity: 0.55,
  },
})
