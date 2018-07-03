import { List } from 'immutable'
import {
  animationFrameScheduler,
  EMPTY,
  fromEvent,
  interval,
  merge,
  Observable,
  Subject,
} from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  map,
  mapTo,
  pairwise,
  scan,
  share,
  shareReplay,
  startWith,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators'
import { BEAN_SCORE, POWER_BEAN_SCORE } from './constant'
import { Ghost } from './sprites/ghost'
import Pacman from './sprites/Pacman'
import { Direction, Game, LevelConfig, Reducer } from './types'
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

export default function game(levelData: LevelConfig) {
  const initGame = new Game(levelData)
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
      let nextPacman = pacman.set('dir', input)
      const { vcol, vrow } = nextPacman.getSpeed()
      const nextCol = col + delta * vcol
      const nextRow = row + delta * vrow

      if (isOnValidPath(map, nextCol, nextRow, input)) {
        if (dir === input || dir === getOppsiteDirection(input)) {
          nextPacman = nextPacman.set('col', nextCol).set('row', nextRow)
        } else {
          nextPacman = nextPacman.set('col', Math.round(nextCol)).set('row', Math.round(nextRow))
        }
        if (pacman.remain - delta < 0) {
          nextPacman = nextPacman.set('frameIndex', 1 - pacman.frameIndex).set('remain', 0.2)
        } else {
          nextPacman = nextPacman.set('remain', pacman.remain - delta)
        }
      } else {
        nextPacman = nextPacman.set('frameIndex', 0).set('remain', 0.2)
      }
      return nextPacman
    }),
  )

  // pacman eat bean
  const eatBean$: Observable<[number, number]> = delta$.pipe(
    withLatestFrom(game$),
    map(([ticker, game]) => game),
    map(({ map, pacman }) => {
      const { col, row } = pacman
      const c = Math.round(col)
      const r = Math.round(row)
      if (Math.abs(Math.round(col) - col) < 0.2 && Math.abs(Math.round(row) - row) < 0.2) {
        if (map.get(r).get(c) === '.') {
          return [r, c] as [number, number]
        }
      }
      return null
    }),
    filter(Boolean),
    share(),
  )

  // pacman eat powerbean
  const eatPowerBean$: Observable<[number, number]> = delta$.pipe(
    withLatestFrom(game$),
    map(([ticker, game]) => game),
    map(({ powerBeans, pacman }) => {
      const { col, row } = pacman
      const c = Math.round(col)
      const r = Math.round(row)
      if (Math.abs(Math.round(col) - col) < 0.2 && Math.abs(Math.round(row) - row) < 0.2) {
        const a = powerBeans.find(pos => pos.get(0) === r && pos.get(1) === c)
        if (powerBeans.find(pos => pos.get(0) === r && pos.get(1) === c)) {
          return [r, c]
        }
      }
      return null
    }),
    filter(Boolean),
    share(),
  )

  // calculate new power beans list
  const nextPowerBeans$ = eatPowerBean$.pipe(
    withLatestFrom(game$),
    map(([eatPowerBean, { powerBeans }]) =>
      powerBeans.filterNot(pos => pos.get(0) === eatPowerBean[0] && pos.get(1) === eatPowerBean[1]),
    ),
  )

  const nextMap$ = merge(
    eatBean$.pipe(
      withLatestFrom(game$),
      map(([eatBean, { map }]) => map.setIn(eatBean, ' ')),
    ),
    eatPowerBean$.pipe(
      withLatestFrom(game$),
      map(([eatPowerBean, { map }]) => map.setIn(eatPowerBean, ' ')),
    ),
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
    nextPacman$.pipe(
      map<Game['pacman'], Reducer<Game>>(pacman => game => game.set('pacman', pacman)),
    ),
    nextMap$.pipe(map<Game['map'], Reducer<Game>>(map => game => game.set('map', map))),
    nextPowerBeans$.pipe(
      map<Game['powerBeans'], Reducer<Game>>(powerBeans => game =>
        game.set('powerBeans', powerBeans),
      ),
    ),
    nextScore$.pipe(map<Game['score'], Reducer<Game>>(score => game => game.set('score', score))),
    // nextGhosts$.pipe(
    //   map<Game['ghosts'], Reducer<Game>>(ghosts => game => game.set('ghosts', ghosts)),
    // ),
  )

  reducer$.subscribe(reducerProxy$)

  return game$
}
