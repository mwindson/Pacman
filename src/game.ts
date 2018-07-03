import { List } from 'immutable'
import { animationFrameScheduler, fromEvent, interval, merge, Observable, Subject } from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  map,
  mapTo,
  scan,
  share,
  shareReplay,
  startWith,
  tap,
  withLatestFrom,
} from 'rxjs/operators'
import Action, {
  UpdateGhosts,
  UpdateMap,
  UpdatePacman,
  UpdatePowerBeans,
  UpdateScore,
} from './Action'
import { BEAN_SCORE, POWER_BEAN_SCORE, TICKER_INTERVAL } from './constant'
import draw from './drawing/draw'
import { Pacman } from './Sprite'
import { Ghost } from './sprites/ghost'
import { Direction, Game, LevelConfig } from './types'
import { calPathRouting, getOppsiteDirection, isOnValidPath } from './utils'

function initGameFn(levelConfig: LevelConfig) {
  const pacman = new Pacman()
  const ghostData = [{ color: 'pink', pos: { x: 0, y: 0 } }]
  const ghosts = List(ghostData.map(d => new Ghost()))

  return new Game({
    map: List(levelConfig.map).map(s => List(s)),
    pacman,
    powerBeans: List(levelConfig.power_beans).map(pos => List(pos)),
    ghosts,
    score: 0,
  })
}

export default function game(levelData: LevelConfig, canvas: HTMLCanvasElement) {
  const initGame = initGameFn(levelData)
  const actionProxy$ = new Subject<Action>()

  const game$ = actionProxy$.pipe(
    scan<Action, Game>((game, action) => {
      if (action.type === 'update-map') {
        return game.set('map', action.map)
      }
      if (action.type === 'update-pacman') {
        return game.set('pacman', action.pacman)
      }
      if (action.type === 'update-power-beans') {
        return game.set('powerBeans', action.powerBeans)
      }
      if (action.type === 'update-score') {
        return game.set('score', action.score)
      }
      if (action.type === 'update-ghosts') {
        return game.set('ghosts', action.ghosts)
      }
      return game
    }, initGame),
    startWith(initGame),
    shareReplay(1),
  )

  const ticker$ = interval(0, animationFrameScheduler).pipe(
    map(() => ({ time: performance.now(), deltaTime: null as number })),
    scan((previous, current) => ({
      time: current.time,
      deltaTime: (current.time - previous.time) / 1000,
    })),
  )

  const input$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
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
    tap(console.log),
  )

  const nextPacmanPos$ = ticker$.pipe(
    withLatestFrom(input$, game$),
    map(([{ deltaTime }, input, { pacman, map }]) => {
      const { dir, col, row } = pacman
      let nextPacman = pacman.set('dir', input)
      const { vx, vy } = nextPacman.getSpeed()
      const nc = col + deltaTime * vx
      const nr = row + deltaTime * vy
      if (isOnValidPath(map, nc, nr, input)) {
        if (dir === input || dir === getOppsiteDirection(input)) {
          nextPacman = nextPacman.set('col', nc).set('row', nr)
        } else {
          nextPacman = nextPacman.set('col', Math.round(nc)).set('row', Math.round(nr))
        }
        if (pacman.remain - deltaTime < 0) {
          nextPacman = nextPacman.set('frameIndex', 1 - pacman.frameIndex).set('remain', 0.2)
        } else {
          nextPacman = nextPacman.set('remain', pacman.remain - deltaTime)
        }
      } else {
        nextPacman = nextPacman.set('frameIndex', 0).set('remain', 0.2)
      }
      return nextPacman
    }),
  )

  // pacman eat bean
  const eatBean$: Observable<[number, number]> = ticker$.pipe(
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
  const eatPowerBean$: Observable<[number, number]> = ticker$.pipe(
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
    eatBean$.pipe(withLatestFrom(game$), map(([eatBean, { map }]) => map.setIn(eatBean, ' '))),
    eatPowerBean$.pipe(
      withLatestFrom(game$),
      map(([eatPowerBean, { map }]) => map.setIn(eatPowerBean, ' ')),
    ),
  )

  const nextScore$ = merge(
    eatBean$.pipe(withLatestFrom(game$), map(([eatBean, { score }]) => score + BEAN_SCORE)),
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
  const nextGhosts$ = ticker$.pipe(
    withLatestFrom(game$),
    map(([{ deltaTime }, { pacman, ghosts, map }]) =>
      ghosts.map(ghost => ghost.move(pacman, deltaTime, map, canvas)),
    ),
  )

  // pacman collide with ghost
  const collideWithGhost$ = ticker$.pipe(
    withLatestFrom(nextGhosts$, nextPacmanPos$),
    map(([ticker, ghosts, pacman]) => {
      let collided = false
      ghosts.forEach(g => {
        const dist = Math.pow(g.col - pacman.col, 2) + Math.pow(g.row - pacman.row, 2)
        if (dist < 10) {
          collided = true
        }
      })
      return collided
    }),
    filter(Boolean),
  )

  const nextPacman$ = merge(
    eatPowerBean$.pipe(
      withLatestFrom(nextPacmanPos$),
      map(([eatPowerBean, nextPacmanPos]) => {
        console.log('eat power bean')
        return nextPacmanPos
      }),
    ),
    nextPacmanPos$,
    collideWithGhost$.pipe(
      withLatestFrom(game$),
      map(([x, { pacman }]) => {
        console.log('pacman collide with ghost')
        return pacman
      }),
    ),
  )

  // 发出下一次更新的actions
  const action$: Observable<Action> = merge(
    nextPacman$.pipe(map(pacman => ({ type: 'update-pacman', pacman } as UpdatePacman))),
    nextMap$.pipe(map(map => ({ type: 'update-map', map } as UpdateMap))),
    nextPowerBeans$.pipe(
      map(powerBeans => ({ type: 'update-power-beans', powerBeans } as UpdatePowerBeans)),
    ),
    nextScore$.pipe(map(score => ({ type: 'update-score', score } as UpdateScore))),
    nextGhosts$.pipe(map(ghosts => ({ type: 'update-ghosts', ghosts } as UpdateGhosts))),
  )

  game$.subscribe(game => draw(game, canvas))
  action$.subscribe(actionProxy$)
}
