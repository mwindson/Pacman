import { is, List, OrderedSet, Range } from 'immutable'
import { animationFrameScheduler, combineLatest, EMPTY, fromEvent, interval, merge, Observable, Subject } from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  map,
  mapTo,
  pairwise,
  sample,
  scan,
  share,
  shareReplay,
  startWith,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators'
import { BEAN_SCORE, POWER_BEAN_SCORE, TILE_SIZE } from './constant'
import { LevelConfig } from './levels'
import Pacman from './sprites/Pacman'
import { Direction, MapItem, Point, Pos, Sink } from './types'
import { isOppositeDir } from './utils/pos-utils'
import { mapKeyboardEventToDirection } from './utils/utils'

const not = (a: boolean) => !a
const add = (a: number) => (b: number) => a + b

// x 处于 TILE_SIZE 的小数部分是否处于 [min, max] 之间
const between = (x: number, min: number, max: number, debug = false) => {
  if (debug) {
    debugger
  }
  const mod = (x % TILE_SIZE) / TILE_SIZE
  return (min <= mod && mod <= max) || (min - 1 <= mod && mod <= max - 1) || (min + 1 <= mod && mod <= max + 1)
}

const sharedKeydown$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(share())
const sharedKeyup$ = fromEvent<KeyboardEvent>(document, 'keyup').pipe(share())

type UpDown = { type: 'down' | 'up'; dir: Direction }

const desiredDir$ = merge(
  sharedKeydown$.pipe(
    mapKeyboardEventToDirection,
    map<Direction, UpDown>(downDir => ({ type: 'down', dir: downDir })),
  ),
  sharedKeyup$.pipe(
    mapKeyboardEventToDirection,
    map<Direction, UpDown>(upDir => ({ type: 'up', dir: upDir })),
  ),
).pipe(
  scan<UpDown, OrderedSet<Direction>>(
    (set, { type, dir }) => (type === 'down' ? set.add(dir) : set.remove(dir)),
    OrderedSet(),
  ),
  startWith(OrderedSet()),
  distinctUntilChanged(is),
  map<OrderedSet<Direction>, Direction>(set => (set.isEmpty() ? 'idle' : set.last())),
  shareReplay(1),
)

const rawDelta$ = interval(0, animationFrameScheduler).pipe(
  startWith(performance.now()),
  map(() => performance.now()),
  pairwise(),
  map(([prev, cnt]) => cnt - prev),
)

const paused$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
  filter(e => e.key === 'Escape'),
  scan<KeyboardEvent, boolean>(not, false),
  startWith(false),
  shareReplay(1),
)

const delta$ = paused$.pipe(
  switchMap(paused => (paused ? EMPTY : rawDelta$)),
  share(),
)

export function getInitMapItems(levelConfig: LevelConfig): List<MapItem> {
  const M = levelConfig.map.length
  const N = levelConfig.map[0].length
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

export default function game(levelConfig: LevelConfig): Observable<Sink> {
  const { M, N } = levelConfig

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

  const nextScoreProxy$ = new Subject<number>()
  const score$ = nextScoreProxy$.pipe(
    startWith(0),
    shareReplay(1),
  )

  // const aroundInfoDiv = document.querySelector('#around-info') as HTMLDivElement

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

  return combineLatest(pacman$, mapItems$, score$, paused$).pipe(
    map(([pacman, mapItems, score, paused]) => ({
      pacman,
      mapItems,
      score,
      paused,
    })),
  )

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
