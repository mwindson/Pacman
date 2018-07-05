import { List } from 'immutable'
import { combineLatest, merge, Observable, Subject } from 'rxjs'
import {
  endWith,
  filter,
  map,
  mapTo,
  pairwise,
  sample,
  scan,
  share,
  shareReplay,
  startWith,
  switchMapTo,
  takeWhile,
  withLatestFrom,
  groupBy,
  tap,
} from 'rxjs/operators'
import { BEAN_SCORE, CONTROL_CONFIG, POWER_BEAN_EFFECT_TIMEOUT, POWER_BEAN_SCORE, TILE_SIZE } from './constant'
import { LevelConfig } from './levels'
import GhostLogic from './logics/GhostLogic'
import Ghost from './sprites/Ghost'
import Pacman from './sprites/Pacman'
import { MapItem, Point, Pos, Sink } from './types'
import getDesiredDir from './utils/getDesiredDir'
import getInitMapItems from './utils/getInitConfig'
import { getDeltaFromPaused, getPaused } from './utils/paused-and-delta'
import { isOppositeDir } from './utils/pos-utils'
import { add, between, debug } from './utils/utils'

export default function game(levelConfig: LevelConfig): Observable<Sink> {
  const { M, N } = levelConfig

  const desiredDir$ = getDesiredDir(CONTROL_CONFIG)
  const paused$ = getPaused(CONTROL_CONFIG).pipe(shareReplay(1))
  const delta$ = getDeltaFromPaused(paused$).pipe(share())

  const nextMapItemsProxy$ = new Subject<List<MapItem>>()
  const mapItems$ = nextMapItemsProxy$.pipe(
    startWith(getInitMapItems(levelConfig)),
    shareReplay(1),
  )

  const nextPacmanProxy$ = new Subject<Pacman>()
  const pacman$ = nextPacmanProxy$.pipe(
    startWith(new Pacman()),
    shareReplay(1),
  )

  const nextGhostListProxy$ = new Subject<List<Ghost>>()
  const ghostList$ = nextGhostListProxy$.pipe(
    startWith(List.of(new Ghost())),
    shareReplay(1),
    // tap(x => console.log('ghostList$', String(x))),
  )

  const pinkGhost$ = ghostList$.pipe(
    map(ghosts => ghosts.find(g => g.color === 'pink')),
    // debug('pink-ghost'),
  )
  const { nextGhost: nextPinkGhost$, route: route$ } = GhostLogic({
    ghost: pinkGhost$,
    mapItems: mapItems$,
    delta: delta$,
    pacman: pacman$,
  })

  const nextGhostList$ = nextPinkGhost$.pipe(map(g => List.of(g)))
  nextGhostList$.subscribe(nextGhostListProxy$)

  const nextScoreProxy$ = new Subject<number>()
  const score$ = nextScoreProxy$.pipe(
    startWith(0),
    shareReplay(1),
  )

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

  const isMoving$ = delta$.pipe(
    withLatestFrom(pacman$),
    map(([delta, pacman]) => pacman),
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

  const eatBean$ = combineLatest(mapItems$, pacman$).pipe(
    sample(delta$),
    map(([mapItems, pacman]) => {
      const t = getMapItemIndex(pacman)
      return mapItems.get(t) === MapItem.bean ? t : -1
    }),
    filter(t => t !== -1),
    share(),
  )

  const eatPowerBean$ = combineLatest(mapItems$, pacman$).pipe(
    sample(delta$),
    map(([mapItems, pacman]) => {
      const t = getMapItemIndex(pacman)
      return mapItems.get(t) === MapItem.powerBean ? t : -1
    }),
    filter(t => t !== -1),
    share(),
  )

  const powerBeanCountdown$ = eatPowerBean$.pipe(
    switchMapTo(
      delta$.pipe(
        scan((countdown, delta) => countdown - delta, POWER_BEAN_EFFECT_TIMEOUT),
        startWith(POWER_BEAN_EFFECT_TIMEOUT),
        takeWhile(countdown => countdown > 0),
        endWith(0),
      ),
    ),
    startWith(0),
  )

  const nextMapItems$ = merge(eatBean$, eatPowerBean$).pipe(
    withLatestFrom(mapItems$),
    map(([t, mapItems]) => mapItems.set(t, MapItem.empty)),
  )

  const nextScore$ = merge(eatBean$.pipe(mapTo(BEAN_SCORE)), eatPowerBean$.pipe(mapTo(POWER_BEAN_SCORE))).pipe(
    withLatestFrom(score$),
    map(([score, add]) => score + add),
  )

  nextPacman$.subscribe(nextPacmanProxy$)
  nextMapItems$.subscribe(nextMapItemsProxy$)
  nextScore$.subscribe(nextScoreProxy$)

  // init ghosts
  // path routing
  // const calPathByTime$ = interval(1000).pipe(mapTo(true))
  //
  // const calPath$ = merge(calPathByTime$ /*calPathIfEnd$*/)
  // calPath$.pipe(
  //   withLatestFrom(game$),
  //   map(([n, { ghosts, pacman, map }]) => ghosts.map(g => calPathRouting(g, pacman, map))),
  // )

  // const nextGhosts$ = delta$.pipe(
  //   withLatestFrom(game$),
  // map(([delta, { pacman, ghosts, map }]) => ghosts.map(ghost => ghost.move(pacman, delta, map))),
  // )

  // pacman collide with ghost
  // const collideWithGhost$ = delta$.pipe(
  //   withLatestFrom(nextGhosts$, nextPacman$),
  //   map(([ticker, ghosts, pacman]) => {
  //     let collided = false
  //     ghosts.forEach(g => {
  //       const dist = Math.pow(g.col - pacman.col, 2) + Math.pow(g.row - pacman.row, 2)
  //       if (dist < 10) {
  //         collided = true
  //       }
  //     })
  //     return collided
  //   }),
  //   filter(Boolean),
  // )

  const part1$ = combineLatest(pacman$, mapItems$, score$, paused$, powerBeanCountdown$, ghostList$).pipe(
    map(([pacman, mapItems, score, paused, powerBeanCountdown, ghostList]) => ({
      pacman,
      mapItems,
      score,
      paused,
      powerBeanCountdown,
      ghostList,
    })),
  )

  return combineLatest(part1$, route$).pipe(map(([part1, route]) => ({ ...part1, route })))

  // region function-definitions
  function canMove(mapItems: List<MapItem>, pos: Pos) {
    if (pos == null) {
      return false
    }
    const item = mapItems.get(pos.row * N + pos.col)
    return item !== MapItem.obstacle
  }

  function getAroundInfo(mapItems: List<MapItem>, pos: Pos) {
    return {
      left: canMove(mapItems, left(pos)),
      right: canMove(mapItems, right(pos)),
      up: canMove(mapItems, up(pos)),
      down: canMove(mapItems, down(pos)),
    }
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

  function getMapItemIndex(point: Point) {
    const row = Math.round(point.y / TILE_SIZE)
    const col = Math.round(point.x / TILE_SIZE)
    return row * N + col
  }
  // endregion
}
