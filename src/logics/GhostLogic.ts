import { List } from 'immutable'
import { combineLatest, Observable } from 'rxjs'
import { filter, map, sample, scan, startWith, switchMap, withLatestFrom } from 'rxjs/operators'
import { TILE_SIZE } from '../constant'
import Ghost from '../sprites/Ghost'
import Pacman from '../sprites/Pacman'
import { Direction, MapItem, Pos } from '../types'
import { isOppositeDir } from '../utils/pos-utils'
import { add, pointToPos, posToPoint } from '../utils/utils'

// TODO test
const M = 31
const N = 28

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

const AUTO_ROUTE_TIMEOUT = 2000

export default function GhostLogic({
  ghost: ghost$,
  mapItems: mapItems$,
  delta: delta$,
  pacman: pacman$,
}: GhostLogicSources): GhostLogicSinks {
  const routeTick$ = delta$.pipe(
    scan((acc, delta) => {
      if (acc > AUTO_ROUTE_TIMEOUT) {
        return acc - AUTO_ROUTE_TIMEOUT + delta
      } else {
        return acc + delta
      }
    }, 0),
    filter(acc => acc >= AUTO_ROUTE_TIMEOUT),
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

  const ghostDesiredDir$ = route$.pipe(
    switchMap(route => {
      let posIndex = -1 // TODO 改为 scan，去掉 let
      return ghost$.pipe(
        map<Ghost, Direction>(ghost => {
          const nextPos = route[posIndex + 1]
          if (nextPos == null) {
            // ghost 到达了路径的终点，那就等在原地，等待下一次 route
            return 'idle'
          }
          const nextPoint = posToPoint(nextPos)
          const dx = nextPoint.x - ghost.x
          const dy = nextPoint.y - ghost.y
          let absDx = Math.abs(dx)
          let absDy = Math.abs(dy)

          if (absDx < 0.2 * TILE_SIZE && absDy < 0.2 * TILE_SIZE) {
            posIndex++
          }

          if (absDx > absDy) {
            return dx > 0 ? 'right' : 'left'
          } else {
            return dy > 0 ? 'down' : 'up'
          }
        }),
      )
    }),
  )

  const nextGhost$ = delta$.pipe(
    withLatestFrom(ghostDesiredDir$, ghost$),
    map(([delta, desiredDir, ghost]) => {
      if (desiredDir === 'idle') {
        return null
      }
      const turned = ghost.set('dir', desiredDir)
      const speed = ghost.getSpeed()
      const moved = ghost.update('x', add(delta * speed.vx)).update('y', add(delta * speed.vy))

      const pos = {
        row: Math.round(ghost.y / TILE_SIZE),
        col: Math.round(ghost.x / TILE_SIZE),
      }

      if (ghost.dir === 'idle') {
        return turned
      }

      const placeAtPosCenter = ghost.set('x', pos.col * TILE_SIZE).set('y', pos.row * TILE_SIZE)

      if (ghost.dir === desiredDir) {
        return moved
      }

      if (isOppositeDir(ghost.dir, desiredDir)) {
        return turned
      }

      return placeAtPosCenter.set('dir', desiredDir)
    }),
    filter(Boolean),
  )

  return { nextGhost: nextGhost$, route: route$ }
}

const toIndex = (p: Pos) => p.row * N + p.col
const toPos = (i: number): Pos => ({ row: Math.floor(i / N), col: i % N })

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

function left(pos: Pos): Pos {
  if (pos.col > 0) {
    return { row: pos.row, col: pos.col - 1 }
  } else {
    return null
  }
}

function right(pos: Pos): Pos {
  if (pos.col < N - 1) {
    return { row: pos.row, col: pos.col + 1 }
  } else {
    return null
  }
}

function up(pos: Pos): Pos {
  if (pos.row > 0) {
    return { row: pos.row - 1, col: pos.col }
  } else {
    return null
  }
}

function down(pos: Pos): Pos {
  if (pos.row < M - 1) {
    return { row: pos.row + 1, col: pos.col }
  }
}
