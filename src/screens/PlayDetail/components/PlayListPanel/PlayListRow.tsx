import { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useIsPlay } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import PlayIndicator from './PlayIndicator'

export default memo(({
  index,
  name,
  singer,
  isActive,
  onPress,
  onRemove,
}: {
  index: number
  name: string
  singer: string
  isActive: boolean
  onPress: () => void
  onRemove: () => void
}) => {
  const theme = useTheme()
  const isPlay = useIsPlay()

  return (
    <TouchableOpacity
      style={[styles.item, isActive && { backgroundColor: theme['c-primary-background-hover'] }]}
      onPress={onPress}
      activeOpacity={0.7}
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
      <TouchableOpacity style={styles.removeBtn} onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="close" size={12} color={theme['c-400']} />
      </TouchableOpacity>
    </TouchableOpacity>
  )
})

const styles = createStyle({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
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
