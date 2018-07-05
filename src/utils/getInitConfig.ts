import { List, Range } from 'immutable'
import { LevelConfig } from '../levels'
import { MapItem } from '../types'

export default function getInitMapItems(levelConfig: LevelConfig): List<MapItem> {
  const { N, M } = levelConfig
  return Range(0, M * N)
    .map(i => {
      const row = Math.floor(i / N)
      const col = i % N
      const char = levelConfig.map[row][col]
      if (char === 'X') {
        return MapItem.obstacle
      } else if (char === '.') {
        return MapItem.bean
      } else if (char === 'D') {
        return MapItem.door
      } else if (char === 'P') {
        return MapItem.powerBean
      } else if (char === ' ') {
        return MapItem.empty
      } else {
        throw new Error('Invalid map item')
      }
    })
    .toList()
}
