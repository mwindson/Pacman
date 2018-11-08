import { List } from 'immutable'
import { Observable } from 'rxjs'
import { map, pairwise, sample, startWith, withLatestFrom } from 'rxjs/operators'
import { TILE_SIZE } from '../constant'
import Pacman from '../sprites/Pacman'
import { Direction, MapItem } from '../types'
import { add, between } from '../utils/common-utils'
import { isOppositeDir, PosUtils } from '../utils/pos-utils'

export interface PacmanLogicSources {
  delta: Observable<number>
  desiredDir: Observable<Direction>
  mapItems: Observable<List<MapItem>>
  pacman: Observable<Pacman>
}

export interface PacmanLogicSinks {
  nextPacman: Observable<Pacman>
}

export default function PacmanLogic(
  { getAroundInfo }: PosUtils,
  {
    delta: delta$,
    desiredDir: desiredDir$,
    mapItems: mapItems$,
    pacman: pacman$,
  }: PacmanLogicSources,
): PacmanLogicSinks {
  const movedPacman$ = delta$.pipe(
    withLatestFrom(desiredDir$, mapItems$, pacman$),
    map(([delta, desiredDir, mapItems, pacman]) => {
      const turned = pacman.set('dir', desiredDir)
      const speed = pacman.getSpeed()
      const moved = pacman.update('x', add(delta * speed.vx)).update('y', add(delta * speed.vy))

      const pos = {
        row: Math.round(pacman.y / TILE_SIZE),
        col: Math.round(pacman.x / TILE_SIZE),
      }

      // pacman 目前没有移动，直接更新为新的方向
      if (pacman.dir === 'idle') {
        return turned
      }

      const aroundInfo = getAroundInfo(mapItems, pos)

      // pacman 是否能够继续向前移动
      const canMoveOn =
        aroundInfo[pacman.dir] ||
        (moved.dir === 'left' && between(moved.x, 0, 0.5)) ||
        (moved.dir === 'right' && between(moved.x, 0.5, 1)) ||
        (moved.dir === 'up' && between(moved.y, 0, 0.5)) ||
        (moved.dir === 'down' && between(moved.y, 0.5, 1))

      const placeAtPosCenter = pacman.set('x', pos.col * TILE_SIZE).set('y', pos.row * TILE_SIZE)

      // pacman 继续向前进行移动
      if (desiredDir === 'idle' || pacman.dir === desiredDir) {
        return canMoveOn ? moved : placeAtPosCenter
      }

      // pacman 向反方向进行运动
      if (isOppositeDir(pacman.dir, desiredDir)) {
        return turned
      }

      // pacman 是否能够转向 desiredDir
      const canTurn =
        aroundInfo[desiredDir] &&
        ((pacman.dir === 'left' && between(pacman.x, 0, 0.2)) ||
          (pacman.dir === 'right' && between(pacman.x, 0.8, 1)) ||
          (pacman.dir === 'up' && between(pacman.y, 0, 0.2)) ||
          (pacman.dir === 'down' && between(pacman.y, 0.8, 1)))

      // pacman 处于路口，且能够进行转向，直接将 pacman 放到路口处
      if (canTurn) {
        return placeAtPosCenter.set('dir', desiredDir)
      }

      // 默认情况下继续向前移动
      return canMoveOn ? moved : placeAtPosCenter
    }),
  )

  const isMoving$ = pacman$.pipe(
    sample(delta$),
    pairwise(),
    map(([prev, cnt]) => prev.movedDistance !== cnt.movedDistance),
    startWith(false),
  )

  // 更新 pacman 的移动距离累计 & 移动状态
  const nextPacman$ = movedPacman$.pipe(
    withLatestFrom(pacman$, isMoving$),
    map(([moved, pacman, isMoving]) => {
      const d = Math.abs(moved.x - pacman.x) + Math.abs(moved.y - pacman.y)
      return moved.update('movedDistance', add(d)).set('isMoving', isMoving)
    }),
  )

  return { nextPacman: nextPacman$ }
}
