import { useEffect, useMemo, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
// import { useLayout } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation'
import { HEADER_HEIGHT } from './components/Header'
import Image from '@/components/common/Image'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'
import { toggleShowPlayList } from '@/core/player/playListUI'
import { useIsShowPlayList } from '@/store/player/hook'
import { useI18n } from '@/lang'


export default ({ componentId, onTogglePlayList }: { componentId: string, onTogglePlayList?: () => void }) => {
  const t = useI18n()
  const isShowPlayList = useIsShowPlayList()
  const musicInfo = usePlayerMusicInfo()
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()

  const [animated, setAnimated] = useState(!!commonState.componentIds.playDetail)
  const [pic, setPic] = useState(musicInfo.pic)
  useEffect(() => {
    if (animated) setPic(musicInfo.pic)
  }, [musicInfo.pic, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })
  // console.log('render pic')

  const style = useMemo(() => {
    const imgWidth = Math.min(winWidth * 0.8, (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.5)
    return {
      width: imgWidth,
      height: imgWidth,
      borderRadius: 2,
    }
  }, [statusBarHeight, winHeight, winWidth])

  const handleCoverPress = () => {
    toggleShowPlayList()
    onTogglePlayList?.()
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={{ ...styles.content, elevation: animated ? 3 : 0 }}
        activeOpacity={0.85}
        onPress={handleCoverPress}
        accessibilityLabel={isShowPlayList ? t('player__show_lyric') : t('player__play_list')}
      >
        <Image url={pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={style} />
      </TouchableOpacity>
    </View>
  )
}

const styles = createStyle({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    // elevation: 3,
    backgroundColor: 'rgba(0,0,0,0)',
    borderRadius: 4,
  },
})
