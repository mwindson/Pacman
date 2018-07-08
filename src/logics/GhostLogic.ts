import { List } from 'immutable'
import { combineLatest, Observable } from 'rxjs'
import { filter, map, sample, scan, startWith } from 'rxjs/operators'
import { GHOST_AUTO_ROUTE_INTERVAL } from '../constant'
import Ghost, { GhostColor } from '../sprites/Ghost'
import Pacman from '../sprites/Pacman'
import { MapItem, Pos } from '../types'
import { pointToPos, shuffle } from '../utils/common-utils'
import { PosUtils } from '../utils/pos-utils'
import FollowPath from './FollowPath'

interface GhostLogicSources {
  ghost: Observable<Ghost>
  mapItems: Observable<List<MapItem>>
  delta: Observable<number>
  pacman: Observable<Pacman>
}

interface GhostLogicSinks {
  nextGhost: Observable<Ghost>
  path: Observable<Pos[]>
}

export default function GhostLogic(
  { left, right, up, down, toPos, toIndex }: PosUtils,
  { ghost: ghost$, mapItems: mapItems$, delta: delta$, pacman: pacman$ }: GhostLogicSources,
): GhostLogicSinks {
  // TODO 还需要考虑其他 导致重新规划路线的情况
  const routeTick$ = delta$.pipe(
    scan((acc, delta) => {
      if (acc > GHOST_AUTO_ROUTE_INTERVAL) {
        return acc - GHOST_AUTO_ROUTE_INTERVAL + delta
      } else {
        return acc + delta
      }
    }, 0),
    filter(acc => acc >= GHOST_AUTO_ROUTE_INTERVAL),
    startWith(null),
  )

  const path$ = combineLatest(ghost$, mapItems$, pacman$).pipe(
    sample(routeTick$),
    map(([ghost, mapItems, pacman]) => {
      const startPos = pointToPos(ghost)
      const endPos = pointToPos(pacman)
      if (ghost.color === GhostColor.pink) {
        return findShortestPath(startPos, endPos, mapItems)
      } else {
        return findRandomPath(startPos, endPos, mapItems)
      }
    }),
  )

  const { nextGhost: nextGhost$ } = FollowPath({
    path: path$,
    ghost: ghost$,
    delta: delta$,
  })

  return { nextGhost: nextGhost$, path: path$ }

  // region function-definition
  function findRandomPath(startPos: Pos, endPos: Pos, mapItems: List<MapItem>): Pos[] {
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
      for (const dirFn of shuffle([left, right, up, down])) {
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

  function findShortestPath(startPos: Pos, endPos: Pos, mapItems: List<MapItem>): Pos[] {
    const prevMap = new Map<number, number>()
    prevMap.set(toIndex(startPos), -1)

    let frontier = new Set([toIndex(startPos)])
    while (!prevMap.has(toIndex(endPos))) {
      const nextSet = new Set<number>()
      for (const cntI of frontier) {
        const cntPos = toPos(cntI)
        for (const dirFn of [left, right, up, down]) {
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
  // endregion
}
