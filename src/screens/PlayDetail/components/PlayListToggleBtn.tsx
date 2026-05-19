import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { toggleShowPlayList } from '@/core/player/playListUI'
import { useIsShowPlayList } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'

export default ({ size, width }: { size: number, width: number }) => {
  const theme = useTheme()
  const t = useI18n()
  const isShowPlayList = useIsShowPlayList()

  return (
    <TouchableOpacity
      style={{ width, height: width, justifyContent: 'center', alignItems: 'center' }}
      activeOpacity={0.5}
      onPress={toggleShowPlayList}
      accessibilityLabel={isShowPlayList ? t('player__show_lyric') : t('player__play_list')}
    >
      <Icon
        name="play-list"
        size={size}
        color={isShowPlayList ? theme['c-primary'] : (theme['c-font-label'] as string)}
      />
    </TouchableOpacity>
  )
}
