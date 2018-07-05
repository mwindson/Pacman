import { List } from 'immutable'
import { combineLatest, Observable } from 'rxjs'
import { filter, map, sample, scan, startWith } from 'rxjs/operators'
import { GHOST_AUTO_ROUTE_INTERVAL } from '../constant'
import Ghost from '../sprites/Ghost'
import Pacman from '../sprites/Pacman'
import { MapItem, Pos } from '../types'
import { pointToPos } from '../utils/common-utils'
import { PosUtils } from '../utils/pos-utils'
import FollowRoute from './FollowRoute'

type GhostLogicSources = {
  ghost: Observable<Ghost>
  mapItems: Observable<List<MapItem>>
  delta: Observable<number>
  pacman: Observable<Pacman>
}

interface GhostLogicSinks {
  nextGhost: Observable<Ghost>
  route: Observable<Pos[]>
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

  const route$ = combineLatest(ghost$, mapItems$, pacman$).pipe(
    sample(routeTick$),
    map(([ghost, mapItems, pacman]) => {
      const startPos = pointToPos(ghost)
      const endPos = pointToPos(pacman)
      return findShortestPath(startPos, endPos, mapItems)
    }),
  )

  const { nextGhost: nextGhost$ } = FollowRoute({
    route: route$,
    ghost: ghost$,
    delta: delta$,
  })

  return { nextGhost: nextGhost$, route: route$ }

  // region function-definition
  function findShortestPath(startPos: Pos, endPos: Pos, mapItems: List<MapItem>) {
    const prevMap = new Map<number, number>()
    prevMap.set(toIndex(startPos), -1)

    let frontier = new Set([toIndex(startPos)])
    while (!prevMap.has(toIndex(endPos))) {
      const nextSet = new Set<number>()
      for (const cntI of frontier) {
        const cntPos = toPos(cntI)
        for (const dirFn of [left, right, up, down]) {
          const nextPos = dirFn(cntPos)
          if (nextPos == null) continue // 超出了边界
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
