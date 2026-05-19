import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LIST_IDS } from '@/config/constant'
import { getListMusics, overwriteListMusics, removeListMusics, updateListMusicPosition } from '@/core/list'
import { updatePlayIndex } from '@/core/player/playInfo'
import { playListById, playNext } from '@/core/player/player'
import { clearTempPlayeList, moveTempPlayList, removeTempPlayList } from '@/core/player/tempPlayList'
import { setPlayListId } from '@/core/player/playInfo'
import listAction from '@/store/list/action'
import listState from '@/store/list/state'
import playerState from '@/store/player/state'
import { useIsPlay, useIsShowPlayList, usePlayMusicInfo, useTempPlayList } from '@/store/player/hook'
type ListItem = LX.Music.MusicInfo | LX.Download.ListItem

const getMusicInfo = (item: ListItem | LX.Player.PlayMusicInfo | null | undefined) => {
  if (!item) return null
  if ('musicInfo' in item && item.musicInfo) return item.musicInfo
  if ('metadata' in item && item.metadata?.musicInfo) return item.metadata.musicInfo
  return item as LX.Music.MusicInfo
}

export default () => {
  const isShowPlayList = useIsShowPlayList()
  const playMusicInfo = usePlayMusicInfo()
  const tempPlayList = useTempPlayList()
  const isPlay = useIsPlay()

  const [isLoading, setIsLoading] = useState(false)
  const [currentItems, setCurrentItems] = useState<ListItem[]>([])
  const loadSeqRef = useRef(0)
  const scrollToIndexRef = useRef<((index: number) => void) | null>(null)

  const activeListIdResolved = playerState.playInfo.playerListId ?? playMusicInfo.listId ?? null
  const currentSourceListId = activeListIdResolved == LIST_IDS.TEMP
    ? (listState.tempListMeta.id || null)
    : activeListIdResolved
  const isTempPlayListVisible = tempPlayList.length > 0

  const currentPlayingIndex = useMemo(() => {
    if (!currentItems.length || !playMusicInfo.musicInfo?.id) return -1
    return currentItems.findIndex(item => getMusicInfo(item)?.id == playMusicInfo.musicInfo?.id)
  }, [currentItems, playMusicInfo.musicInfo?.id])

  const currentPreItems = useMemo(() => {
    if (currentPlayingIndex < 0) return currentItems
    return currentItems.slice(0, currentPlayingIndex + 1)
  }, [currentItems, currentPlayingIndex])

  const currentPostItems = useMemo(() => {
    if (currentPlayingIndex < 0) return []
    return currentItems.slice(currentPlayingIndex + 1)
  }, [currentItems, currentPlayingIndex])

  const currentListLabel = useMemo(() => {
    const listId = currentSourceListId
    if (!listId) return '当前播放列表'
    if (listId == LIST_IDS.DEFAULT) return listState.defaultList.name
    if (listId == LIST_IDS.LOVE) return listState.loveList.name
    const userList = listState.userList.find(item => item.id === listId)
    return userList?.name ?? '播放列表'
  }, [currentSourceListId])

  const emptyCurrentHint = useMemo(() => {
    if (!activeListIdResolved) {
      return '没有可展示的播放列表，先从歌曲列表开始播放。'
    }
    return '这个列表当前为空，点击刷新试试。'
  }, [activeListIdResolved])

  const getItemName = (item: ListItem) => getMusicInfo(item)?.name || '未知歌曲'
  const getItemSinger = (item: ListItem) => getMusicInfo(item)?.singer || '未知歌手'
  const getTempItemName = (item: LX.Player.PlayMusicInfo) => getMusicInfo(item)?.name || '未知歌曲'
  const getTempItemSinger = (item: LX.Player.PlayMusicInfo) => getMusicInfo(item)?.singer || '未知歌手'

  const getCurrentPostItemIndex = (index: number) => (
    currentPlayingIndex < 0 ? index : currentPlayingIndex + 1 + index
  )

  const isCurrentPlayingItem = useCallback((item: ListItem | LX.Player.PlayMusicInfo) => {
    const musicInfo = getMusicInfo(item)
    return !!musicInfo && playMusicInfo.musicInfo?.id === musicInfo.id
  }, [playMusicInfo.musicInfo?.id])

  const isSamePlayingMusic = useCallback((musicInfo: LX.Music.MusicInfo | null) => (
    !!musicInfo &&
    playMusicInfo.musicInfo?.id == musicInfo.id &&
    isPlay
  ), [isPlay, playMusicInfo.musicInfo?.id])

  const promoteCurrentListToTemp = useCallback(async() => {
    if (!activeListIdResolved || activeListIdResolved == LIST_IDS.TEMP) return false
    listAction.setTempListMeta({ id: activeListIdResolved })
    await overwriteListMusics(LIST_IDS.TEMP, [...currentItems] as LX.Music.MusicInfo[])
    setPlayListId(LIST_IDS.TEMP)
    playerState.playMusicInfo.listId = LIST_IDS.TEMP
    updatePlayIndex()
    return true
  }, [activeListIdResolved, currentItems])

  const reloadCurrentList = useCallback(async() => {
    const seq = ++loadSeqRef.current
    setIsLoading(true)
    try {
      if (!activeListIdResolved) {
        if (seq == loadSeqRef.current) setCurrentItems([])
        return
      }
      const list = await getListMusics(activeListIdResolved)
      if (seq != loadSeqRef.current) return
      setCurrentItems([...list])
    } catch (err) {
      console.error(err)
      if (seq == loadSeqRef.current) setCurrentItems([])
    } finally {
      if (seq == loadSeqRef.current) {
        setIsLoading(false)
        if (isShowPlayList && currentPlayingIndex >= 0) {
          requestAnimationFrame(() => {
            scrollToIndexRef.current?.(currentPlayingIndex)
          })
        }
      }
    }
  }, [activeListIdResolved, currentPlayingIndex, isShowPlayList])

  const reorderCurrentListItem = useCallback(async(sourceIndex: number, targetIndex: number) => {
    if (!activeListIdResolved) return
    if (sourceIndex === targetIndex) return
    const item = currentItems[sourceIndex]
    const musicInfo = getMusicInfo(item)
    if (!musicInfo) return
    if (activeListIdResolved != LIST_IDS.TEMP) {
      await promoteCurrentListToTemp()
    }
    await updateListMusicPosition(LIST_IDS.TEMP, targetIndex, [musicInfo.id])
    updatePlayIndex()
    await reloadCurrentList()
  }, [activeListIdResolved, currentItems, promoteCurrentListToTemp, reloadCurrentList])

  const handlePlayCurrentItem = useCallback((item: ListItem) => {
    if (!activeListIdResolved) return
    const musicInfo = getMusicInfo(item)
    if (!musicInfo) return
    if (isSamePlayingMusic(musicInfo)) return
    void playListById(activeListIdResolved, musicInfo.id)
  }, [activeListIdResolved, isSamePlayingMusic])

  const handlePlayTempItem = useCallback((item: LX.Player.PlayMusicInfo) => {
    const musicInfo = getMusicInfo(item)
    if (!musicInfo || !item.listId) return
    if (isSamePlayingMusic(musicInfo)) return
    const tempIndex = playerState.tempPlayList.findIndex(m => getMusicInfo(m)?.id == musicInfo.id)
    if (tempIndex >= 0) {
      if (tempIndex > 0) moveTempPlayList(tempIndex, 0)
      void playNext(true)
    } else {
      void playListById(item.listId, musicInfo.id)
    }
  }, [isSamePlayingMusic])

  const handleReorderTempItem = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    moveTempPlayList(fromIndex, toIndex)
  }, [])

  const handleRemoveCurrentItem = useCallback(async(index: number) => {
    if (!activeListIdResolved) return
    const item = currentItems[index]
    const musicInfo = getMusicInfo(item)
    if (!musicInfo) return

    if (activeListIdResolved != LIST_IDS.TEMP) {
      await promoteCurrentListToTemp()
    }

    await removeListMusics(LIST_IDS.TEMP, [musicInfo.id])
    updatePlayIndex()
    if (playMusicInfo.musicInfo?.id == musicInfo.id) {
      void playNext(true)
    }
    await reloadCurrentList()
  }, [activeListIdResolved, currentItems, playMusicInfo.musicInfo?.id, promoteCurrentListToTemp, reloadCurrentList])

  const handleClearCurrent = useCallback(async() => {
    if (!activeListIdResolved || !currentItems.length) return
    if (activeListIdResolved != LIST_IDS.TEMP && !(await promoteCurrentListToTemp())) return
    const ids = currentItems.map(item => getMusicInfo(item)?.id).filter(Boolean) as string[]
    if (!ids.length) return
    await removeListMusics(LIST_IDS.TEMP, ids)
    if (activeListIdResolved == LIST_IDS.TEMP && playMusicInfo.musicInfo) {
      void playNext(true)
    }
    await reloadCurrentList()
  }, [activeListIdResolved, currentItems, playMusicInfo.musicInfo, promoteCurrentListToTemp, reloadCurrentList])

  const registerScrollToIndex = useCallback((fn: (index: number) => void) => {
    scrollToIndexRef.current = fn
  }, [])

  useEffect(() => {
    void reloadCurrentList()
  }, [activeListIdResolved, reloadCurrentList])

  useEffect(() => {
    const handleListChange = (ids: string[]) => {
      if (!activeListIdResolved) return
      if (activeListIdResolved == LIST_IDS.TEMP) {
        if (!ids.includes(LIST_IDS.TEMP)) return
      } else if (!ids.includes(activeListIdResolved)) {
        return
      }
      void reloadCurrentList()
    }

    global.app_event.on('myListMusicUpdate', handleListChange)
    return () => {
      global.app_event.off('myListMusicUpdate', handleListChange)
    }
  }, [activeListIdResolved, reloadCurrentList])

  useEffect(() => {
    if (!isShowPlayList || isLoading || currentPlayingIndex < 0) return
    requestAnimationFrame(() => {
      scrollToIndexRef.current?.(currentPlayingIndex)
    })
  }, [isShowPlayList, isLoading, currentPlayingIndex])

  return {
    isLoading,
    currentItems,
    tempPlayList,
    activeListId: activeListIdResolved,
    currentListLabel,
    emptyCurrentHint,
    currentPreItems,
    currentPostItems,
    isTempPlayListVisible,
    currentPlayingIndex,
    getCurrentPostItemIndex,
    reorderCurrentListItem,
    handleReorderTempItem,
    getItemName,
    getItemSinger,
    getTempItemName,
    getTempItemSinger,
    isCurrentPlayingItem,
    reloadCurrentList,
    handlePlayCurrentItem,
    handlePlayTempItem,
    handleRemoveCurrentItem,
    handleRemoveTempItem: removeTempPlayList,
    handleClearCurrent,
    handleClearTemp: clearTempPlayeList,
    registerScrollToIndex,
  }
}
