import playerActions from '@/store/player/action'
import playerState from '@/store/player/state'

export const setShowPlayList = (isShowPlayList: boolean) => {
  playerActions.setShowPlayList(isShowPlayList)
}

export const toggleShowPlayList = () => {
  playerActions.setShowPlayList(!playerState.isShowPlayList)
}
