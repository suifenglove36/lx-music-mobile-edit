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

export default memo(({ isPlaying }: { isPlaying: boolean }) => {
  const theme = useTheme()
  const dotAnim = useRef(new Animated.Value(0)).current
  const eq1 = useRef(new Animated.Value(0)).current
  const eq2 = useRef(new Animated.Value(0)).current
  const eq3 = useRef(new Animated.Value(0)).current

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

  useEffect(() => {
    if (!isPlaying) return
    const createEqLoop = (anim: Animated.Value, duration: number) => Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: duration / 2, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: duration / 2, useNativeDriver: false }),
      ]),
    )
    const loops = [
      createEqLoop(eq1, 700).start(),
      createEqLoop(eq2, 560).start(),
      createEqLoop(eq3, 640).start(),
    ]
    return () => {
      eq1.setValue(0)
      eq2.setValue(0)
      eq3.setValue(0)
      loops.forEach(l => (l as unknown as { stop?: () => void }).stop?.())
    }
  }, [isPlaying, eq1, eq2, eq3])

  const dotScale = dotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  })

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.dot, { backgroundColor: theme['c-primary-font'], transform: [{ scale: dotScale }] }]} />
      {isPlaying ? (
        <View style={styles.eq}>
          <EqBar anim={eq1} minH={4} maxH={12} color={theme['c-primary-font']} />
          <EqBar anim={eq2} minH={5} maxH={14} color={theme['c-primary-font']} />
          <EqBar anim={eq3} minH={4} maxH={11} color={theme['c-primary-font']} />
        </View>
      ) : null}
    </View>
  )
})

const styles = createStyle({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  eq: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 14,
  },
  eqBar: {
    width: 2,
    borderRadius: 999,
    backgroundColor: 'currentColor',
    opacity: 0.55,
  },
})
