import { animationFrameScheduler, EMPTY, fromEvent, interval, merge, Observable, Subject } from 'rxjs'
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
  tap,
  withLatestFrom,
} from 'rxjs/operators'
import { BEAN_SCORE, POWER_BEAN_SCORE } from './constant'
import { LevelConfig } from './levels'
import { Direction, Game, Pos, Reducer } from './types'
import { calPathRouting, getOppsiteDirection, isOnValidPath } from './utils'

const not = (a: boolean) => !a

// 玩家最后按下的方向
const lastDirection$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
  map<KeyboardEvent, Direction>(e => {
    if (e.key === 'w') {
      return 'up'
    } else if (e.key === 'a') {
      return 'left'
    } else if (e.key === 's') {
      return 'down'
    } else if (e.key === 'd') {
      return 'right'
    } else {
      return null
    }
  }),
  filter(Boolean),
  distinctUntilChanged(),
  startWith<Direction>('idle'),
  shareReplay(1),
)

const rawDelta$ = interval(0, animationFrameScheduler).pipe(
  startWith(performance.now()),
  map(() => performance.now()),
  pairwise(),
  map(([prev, cnt]) => (cnt - prev) / 1000),
)

export default function game(levelConfig: LevelConfig) {
  const initGame = new Game(levelConfig)
  const reducerProxy$ = new Subject<Reducer<Game>>()

  const game$ = reducerProxy$.pipe(
    scan<Reducer<Game>, Game>((game, reducer) => reducer(game), initGame),
    startWith(initGame),
    shareReplay(1),
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

  const nextPacman$ = delta$.pipe(
    withLatestFrom(lastDirection$, game$),
    map(([delta, input, { pacman, map }]) => {
      const { dir, col, row } = pacman
      pacman.dir = input
      const { vcol, vrow } = pacman.getSpeed()
      const nextCol = col + delta * vcol
      const nextRow = row + delta * vrow

      if (isOnValidPath(map, nextCol, nextRow, input)) {
        if (dir === input || dir === getOppsiteDirection(input)) {
          pacman.col = nextCol
          pacman.row = nextRow
        } else {
          pacman.col = Math.round(nextCol)
          pacman.row = Math.round(nextRow)
        }
        if (pacman.remain - delta < 0) {
          pacman.frameIndex = 1 - pacman.frameIndex
          pacman.remain = 0.2
        } else {
          pacman.remain -= delta
        }
      } else {
        pacman.frameIndex = 0
        pacman.remain = 0.2
      }
      return pacman
    }),
  )

  const eatBean$ = game$.pipe(
    sample(delta$),
    map(({ map, pacman }) => {
      const { col, row } = pacman
      const beanRow = Math.round(row)
      const beanCol = Math.round(col)
      if (Math.abs(Math.round(col) - col) < 0.2 && Math.abs(Math.round(row) - row) < 0.2) {
        if (map[beanRow][beanCol] === '.') {
          return { row: beanRow, col: beanCol }
        }
      }
      return null
    }),
    filter<Pos>(Boolean),
    share(),
  )

  function isSamePos(a: Pos, b: Pos) {
    return a.row === b.row && a.col === b.col
  }

  const eatPowerBean$ = game$.pipe(
    sample(delta$),
    map(({ powerBeans, pacman }) => {
      const { col, row } = pacman
      const beanCol = Math.round(col)
      const beanRow = Math.round(row)
      if (Math.abs(Math.round(col) - col) < 0.2 && Math.abs(Math.round(row) - row) < 0.2) {
        const beanPos = { row: beanRow, col: beanCol }
        if (powerBeans.find(pos => isSamePos(pos, beanPos))) {
          return beanPos
        }
      }
      return null
    }),
    filter<Pos>(Boolean),
    share(),
  )

  const nextPowerBeans$ = eatPowerBean$.pipe(
    withLatestFrom(game$),
    map(([beanPos, { powerBeans }]) => powerBeans.filter(pos => !isSamePos(pos, beanPos))),
  )

  const nextMap$ = eatBean$.pipe(
    withLatestFrom(game$),
    tap(([beanPos, { map }]) => (map[beanPos.row][beanPos.col] = ' ')), // TODO 不要原地修改
    map(([beanPos, { map }]) => map),
  )

  const nextScore$ = merge(
    eatBean$.pipe(
      withLatestFrom(game$),
      map(([eatBean, { score }]) => score + BEAN_SCORE),
    ),
    eatPowerBean$.pipe(
      withLatestFrom(game$),
      map(([eatPowerBean, { score }]) => score + POWER_BEAN_SCORE),
    ),
  )

  // init ghosts
  // path routing
  const calPathByTime$ = interval(1000).pipe(mapTo(true))

  const calPath$ = merge(calPathByTime$ /*calPathIfEnd$*/)
  calPath$.pipe(
    withLatestFrom(game$),
    map(([n, { ghosts, pacman, map }]) => ghosts.map(g => calPathRouting(g, pacman, map))),
  )

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

  const reducer$: Observable<Reducer<Game>> = merge(
    nextPacman$.pipe(map<Game['pacman'], Reducer<Game>>(pacman => game => ((game.pacman = pacman), game))),
    nextMap$.pipe(map<Game['map'], Reducer<Game>>(map => game => ((game.map = map), game))),
    nextPowerBeans$.pipe(
      map<Game['powerBeans'], Reducer<Game>>(powerBeans => game => ((game.powerBeans = powerBeans), game)),
    ),
    nextScore$.pipe(map<Game['score'], Reducer<Game>>(score => game => ((game.score = score), game))),
    // nextGhosts$.pipe(
    //   map<Game['ghosts'], Reducer<Game>>(ghosts => game => game.set('ghosts', ghosts)),
    // ),
  )

  reducer$.subscribe(reducerProxy$)

  return game$
}
