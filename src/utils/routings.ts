import { List } from 'immutable'
import { MapItem, Pos } from '../types'
import { shuffle } from './common-utils'
import { PosUtils } from './pos-utils'

export function shortest(
  { toIndex, toPos, directions }: PosUtils,
  startPos: Pos,
  endPos: Pos,
  mapItems: List<MapItem>,
): Pos[] {
  const prevMap = new Map<number, number>()
  prevMap.set(toIndex(startPos), -1)

  let frontier = new Set([toIndex(startPos)])
  while (!prevMap.has(toIndex(endPos))) {
    const nextSet = new Set<number>()
    for (const cntI of frontier) {
      const cntPos = toPos(cntI)
      for (const dirFn of directions) {
        const nextPos = dirFn(cntPos)
        if (nextPos == null) {
          // 超出了边界
          continue
        }
        const nextI = toIndex(nextPos)
        if (
          mapItems.get(nextI) !== MapItem.obstacle && // 该位置没有障碍物
          !frontier.has(nextI) && // 该位置没有正在被访问
          !prevMap.has(nextI) // 该位置曾经也没有被访问过
        ) {
          nextSet.add(nextI)
          prevMap.set(nextI, cntI)
        }
      }
      frontier = nextSet
    }
  }

  const indexArray: number[] = []
  let i = toIndex(endPos)
  while (i !== toIndex(startPos)) {
    indexArray.unshift(i)
    i = prevMap.get(i)
  }
  return indexArray.map(toPos)
}

export function random(
  { toIndex, toPos, directions }: PosUtils,
  startPos: Pos,
  endPos: Pos,
  mapItems: List<MapItem>,
): Pos[] {
  const visited = new Set<number>()
  const path: Pos[] = []
  dfs(toIndex(startPos))
  return path

  function dfs(cntIndex: number) {
    visited.add(cntIndex)
    if (cntIndex === toIndex(endPos) || path.length >= 20) {
      return true
    }
    const cntPos = toPos(cntIndex)
    for (const dirFn of shuffle(directions)) {
      const nextPos = dirFn(cntPos)
      if (nextPos == null) {
        // 超出了边界
        continue
      }
      const nextIndex = toIndex(nextPos)
      if (
        mapItems.get(nextIndex) !== MapItem.obstacle && // 该位置没有障碍物
        !visited.has(nextIndex) // 该位置没有被访问过
      ) {
        path.push(nextPos)
        if (dfs(nextIndex)) {
          return true
        }
        path.pop()
      }
    }
    visited.delete(cntIndex)
    return false
  }
}
