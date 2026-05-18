import { createStyle } from '@/utils/tools'
import { View } from 'react-native'
import PlayModeBtn from './PlayModeBtn'
import MusicAddBtn from './MusicAddBtn'
import DesktopLyricBtn from './DesktopLyricBtn'
import CommentBtn from './CommentBtn'
import PlayListToggleBtn from '@/screens/PlayDetail/components/PlayListToggleBtn'
import { BTN_ICON_SIZE, BTN_WIDTH } from './Btn'

export default () => {
  return (
    <View style={styles.container}>
      <DesktopLyricBtn />
      <MusicAddBtn />
      <PlayModeBtn />
      <PlayListToggleBtn size={BTN_ICON_SIZE} width={BTN_WIDTH} />
      <CommentBtn />
    </View>
  )
}


const styles = createStyle({
  container: {
    // flexShrink: 0,
    // flexGrow: 0,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
})
