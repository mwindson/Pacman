import { List } from 'immutable'
import { combineLatest, Observable } from 'rxjs'
import { filter, map, sample, scan, share, startWith } from 'rxjs/operators'
import { GHOST_AUTO_ROUTE_INTERVAL } from '../constant'
import Ghost from '../sprites/ghosts'
import Pacman from '../sprites/Pacman'
import { MapItem, Pos } from '../types'
import { pointToPos } from '../utils/common-utils'
import { PosUtils } from '../utils/pos-utils'
import * as routings from '../utils/routings'
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

export default function PinkGhostLogic(
  posUtils: PosUtils,
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
    share(),
  )

  const path$ = combineLatest(ghost$, mapItems$, pacman$).pipe(
    sample(routeTick$),
    map(([ghost, mapItems, pacman]) => {
      const startPos = pointToPos(ghost)
      const endPos = pointToPos(pacman)
      return routings.shortest(posUtils, startPos, endPos, mapItems)
    }),
  )

  const { nextGhost: nextGhost$ } = FollowPath({
    path: path$,
    ghost: ghost$,
    delta: delta$,
  })

  return { nextGhost: nextGhost$, path: path$ }
}
