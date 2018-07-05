import { Observable } from 'rxjs'
import { filter, map, scan, switchMap, withLatestFrom } from 'rxjs/operators'
import { TILE_SIZE } from '../constant'
import Ghost from '../sprites/Ghost'
import { Direction, Pos } from '../types'
import { isOppositeDir } from '../utils/pos-utils'
import { add, pointToPos, posToPoint } from '../utils/common-utils'

interface RoutingCtx {
  posIndex: number
  dir: Direction
}

const initRoutingCtx: RoutingCtx = { posIndex: -1, dir: 'idle' }

export interface FollowRouteSources {
  route: Observable<Pos[]>
  ghost: Observable<Ghost>
  delta: Observable<number>
}

export interface FollowRouteSinks {
  nextGhost: Observable<Ghost>
}

export default function FollowRoute({
  delta: delta$,
  ghost: ghost$,
  route: route$,
}: FollowRouteSources): FollowRouteSinks {
  const ghostDesiredDir$ = route$.pipe(
    switchMap(route =>
      ghost$.pipe(
        scan<Ghost, RoutingCtx>((ctx, ghost) => {
          const nextPos = route[ctx.posIndex + 1]
          if (nextPos == null) {
            // ghost 到达了路径的终点，那就等在原地，等待下一次 route
            return { posIndex: ctx.posIndex, dir: 'idle' }
          }
          const nextPoint = posToPoint(nextPos)
          const dx = nextPoint.x - ghost.x
          const dy = nextPoint.y - ghost.y
          const absDx = Math.abs(dx)
          const absDy = Math.abs(dy)

          let nextDir: Direction
          if (absDx > absDy) {
            nextDir = dx > 0 ? 'right' : 'left'
          } else {
            nextDir = dy > 0 ? 'down' : 'up'
          }

          const incPosIndex = absDx < 0.2 * TILE_SIZE && absDy < 0.2 * TILE_SIZE

          return {
            dir: nextDir,
            posIndex: incPosIndex ? ctx.posIndex + 1 : ctx.posIndex,
          }
        }, initRoutingCtx),
        map(ctx => ctx.dir),
      ),
    ),
  )

  const nextGhost$ = delta$.pipe(
    withLatestFrom(ghostDesiredDir$, ghost$),
    filter(([delta, desiredDir]) => desiredDir !== 'idle'),
    map(([delta, desiredDir, ghost]) => {
      if (ghost.dir === desiredDir) {
        const speed = ghost.getSpeed()
        return ghost.update('x', add(delta * speed.vx)).update('y', add(delta * speed.vy))
      }

      if (ghost.dir === 'idle' || isOppositeDir(ghost.dir, desiredDir)) {
        return ghost.set('dir', desiredDir)
      }

      const posPoint = posToPoint(pointToPos(ghost))
      return ghost.merge({
        dir: desiredDir,
        x: posPoint.x,
        y: posPoint.y,
      })
    }),
  )

  return { nextGhost: nextGhost$ }
}
