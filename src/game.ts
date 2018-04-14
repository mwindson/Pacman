import { Observable, Scheduler, Subject } from 'rxjs'
import { Pacman } from 'PacmanSprite.ts'
import {
  isOnValidPath,
  pos2Coordinate,
  coordinate2Pos,
  getOppsiteDirection,
  getNextPos,
  findNearestTile,
  calPathRouting,
  TilePos
} from 'utils'
import { Ghost } from 'sprites/ghost'
import { TICKER_INTERVAL, BEAN_SCORE, POWER_BEAN_SCORE, TILE_SIZE } from 'constant'
import { List, Map, Record } from 'immutable'
import { Direction } from 'utils/types'
export interface LevelData {
  map: List<string>
  wall_color: string
  power_beans: List<List<number>>
}

export interface Pos {
  x: number
  y: number
}
interface Ticker {
  time: number
  deltaTime: number
}
const TILE_WIDTH = 16
const TILE_HEIGHT = 16
function drawMap(map: List<List<string>>, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  ctx.lineWidth = 2
  const get = (i: number, j: number) =>
    i < 0 || j < 0 || i >= map.size || j >= map.get(0).size ? 'X' : map.get(i).get(j)
  for (let i = 0; i < map.size; i += 1) {
    for (let j = 0; j < map.get(0).size; j += 1) {
      const value = get(i, j)
      const pos = coordinate2Pos(i, j)
      const { x, y } = pos
      if (value === 'X') {
        ctx.strokeStyle = 'blue'
        let code = [0, 0, 0, 0]
        if (
          get(i + 1, j) === 'X' &&
          !(get(i + 1, j - 1) === 'X' && get(i + 1, j + 1) === 'X' && get(i, j - 1) === 'X' && get(i, j + 1) === 'X')
        ) {
          code[0] = 1
        }
        if (
          get(i, j + 1) === 'X' &&
          !(get(i - 1, j + 1) === 'X' && get(i + 1, j + 1) === 'X' && get(i - 1, j) === 'X' && get(i + 1, j) === 'X')
        ) {
          code[1] = 1
        }
        if (
          get(i - 1, j) === 'X' &&
          !(get(i - 1, j - 1) === 'X' && get(i - 1, j + 1) === 'X' && get(i, j - 1) === 'X' && get(i, j + 1) === 'X')
        ) {
          code[2] = 1
        }
        if (
          get(i, j - 1) === 'X' &&
          !(get(i - 1, j - 1) === 'X' && get(i + 1, j - 1) === 'X' && get(i - 1, j) === 'X' && get(i + 1, j) === 'X')
        ) {
          code[3] = 1
        }
        switch (code.join('')) {
          /**
           *
           * 0 1 1
           * 0 1 0
           */
          case '1100':
            ctx.beginPath()
            ctx.arc(x + 8, y + 8, 8, Math.PI, 1.5 * Math.PI, false)
            ctx.stroke()
            ctx.closePath()
            break
          /**
           * 0 1 0
           * 1 1 0
           *
           */
          case '0110':
            ctx.beginPath()
            ctx.arc(x + 8, y - 8, 8, 0.5 * Math.PI, 1 * Math.PI, false)
            ctx.stroke()
            ctx.closePath()
            break
          /**
           * 1 1 0
           * 0 1 0
           */
          case '0011':
            ctx.beginPath()
            ctx.arc(x - 8, y - 8, 8, 0, 0.5 * Math.PI, false)
            ctx.stroke()
            ctx.closePath()
            break
          /**
           * 0 0
           * 1 1
           * 0 1
           */
          case '1001':
            ctx.beginPath()
            ctx.arc(x - 8, y + 8, 8, 1.5 * Math.PI, 2 * Math.PI, false)
            ctx.stroke()
            ctx.closePath()
            break
          default:
            const dist = 8
            const _COS = [1, 0, -1, 0]
            const _SIN = [0, 1, 0, -1]
            code.forEach(function(v, index) {
              if (v) {
                ctx.beginPath()
                ctx.moveTo(pos.x, pos.y)
                ctx.lineTo(pos.x - _SIN[index] * dist, pos.y - _COS[index] * dist)
                ctx.stroke()
                ctx.closePath()
              }
            })
        }
      } else if (value === '.') {
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, 2 * Math.PI)
        ctx.fill()
        ctx.closePath()
      } else if (value === 'P') {
        ctx.fillStyle = 'green'
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.closePath()
      } else if (value === 'D') {
        ctx.strokeStyle = 'white'
        ctx.beginPath()
        ctx.moveTo(x - 8, y)
        ctx.lineTo(x + 8, y)
        ctx.stroke()
        ctx.closePath()
      }
    }
  }
}
const GameRecord = Record({
  map: null as List<List<string>>,
  pacman: null as Pacman,
  ghosts: null as List<Ghost>,
  powerBeans: null as List<List<number>>,
  score: 0
})
class Game extends GameRecord {}
function initGameFn(levelData: LevelData) {
  const map = levelData.map.map(s => List(s.split('')))
  const pacman = new Pacman()
  const ghostData = [{ color: 'pink', pos: { x: 0, y: 0 } }]
  const ghosts = List(ghostData.map(d => new Ghost()))
  const powerBeans = levelData.power_beans
  return new Game({ map, pacman, powerBeans, ghosts, score: 0 })
}

type Action = UpdatePacman | UpdateMap | UpdatePowerBeans | UpdateScore | UpdateGhosts
interface UpdatePacman {
  type: 'update-pacman'
  pacman: Pacman
}
interface UpdateMap {
  type: 'update-map'
  map: List<List<string>>
}
interface UpdatePowerBeans {
  type: 'update-power-beans'
  powerBeans: List<List<number>>
}
interface UpdateScore {
  type: 'update-score'
  score: number
}
interface UpdateGhosts {
  type: 'update-ghosts'
  ghosts: List<Ghost>
}
function game(levelData: LevelData, canvas: HTMLCanvasElement) {
  const initGame = initGameFn(levelData)
  const actionProxy$ = new Subject<Action>()
  const game$ = actionProxy$
    .scan((game, action) => {
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
    }, initGame)
    .startWith(initGame)
    .shareReplay(1)

  // const ticker$ = Observable.interval(TICKER_INTERVAL, Scheduler.animationFrame)
  //   .map(() => ({ time: performance.now(), deltaTime: null as number }))
  //   .scan((previous, current) => ({
  //     time: current.time,
  //     deltaTime: (current.time - previous.time) / 1000
  //   }))
  //
  // const input$ = Observable.fromEvent(document, 'keydown', (event: KeyboardEvent) => {
  //   switch (event.keyCode) {
  //     // [x,y]
  //     case 37:
  //       return 'left'
  //     case 38:
  //       return 'up'
  //     case 39:
  //       return 'right'
  //     case 40:
  //       return 'down'
  //     default:
  //       return 'idle'
  //   }
  // })
  //   .distinctUntilChanged()
  //   .startWith('idle')
  //   .shareReplay(1)
  // calculate next pacman

  const nextPacmanPos$ = ticker$.withLatestFrom(input$, game$).map(([{ deltaTime }, input, { pacman, map }]) => {
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
  })
  // pacman eat bean
  const eatBean$: Observable<[number, number]> = ticker$
    .withLatestFrom(game$)
    .map(([ticker, game]) => game)
    .map(({ map, pacman }) => {
      const { col, row } = pacman
      const c = Math.round(col)
      const r = Math.round(row)
      if (Math.abs(Math.round(col) - col) < 0.2 && Math.abs(Math.round(row) - row) < 0.2) {
        if (map.get(r).get(c) === '.') {
          return [r, c] as [number, number]
        }
      }
      return null
    })
    .filter(Boolean)
    .share()

  // pacman eat powerbean
  const eatPowerBean$: Observable<[number, number]> = ticker$
    .withLatestFrom(game$)
    .map(([ticker, game]) => game)
    .map(({ powerBeans, pacman }) => {
      const { col, row } = pacman
      const c = Math.round(col)
      const r = Math.round(row)
      if (Math.abs(Math.round(col) - col) < 0.2 && Math.abs(Math.round(row) - row) < 0.2) {
        let a = powerBeans.find(pos => pos.get(0) === r && pos.get(1) === c)
        if (powerBeans.find(pos => pos.get(0) === r && pos.get(1) === c)) {
          return [r, c]
        }
      }
      return null
    })
    .filter(Boolean)
    .share()
  // calculate new power beans list
  const nextPowerBeans$ = eatPowerBean$
    .withLatestFrom(game$)
    .map(([eatPowerBean, { powerBeans }]) =>
      powerBeans.filterNot(pos => pos.get(0) === eatPowerBean[0] && pos.get(1) === eatPowerBean[1])
    )

  const nextMap$ = Observable.merge(
    eatBean$.withLatestFrom(game$).map(([eatBean, { map }]) => map.setIn(eatBean, ' ')),
    eatPowerBean$.withLatestFrom(game$).map(([eatPowerBean, { map }]) => map.setIn(eatPowerBean, ' '))
  )
  const nextScore$ = Observable.merge(
    eatBean$.withLatestFrom(game$).map(([eatBean, { score }]) => score + BEAN_SCORE),
    eatPowerBean$.withLatestFrom(game$).map(([eatPowerBean, { score }]) => score + POWER_BEAN_SCORE)
  )
  // init ghosts
  // path routing
  const calPathByTime$ = Observable.interval(1000).mapTo(true)
  const calPath$ = Observable.merge(calPathByTime$, calPathIfEnd$)
  calPath$.withLatestFrom(game$).map(([n, { ghosts, pacman, map }]) => ghosts.map(g => calPathRouting(g, pacman, map)))
  const nextGhosts$ = ticker$
    .withLatestFrom(game$)
    .map(([{ deltaTime }, { pacman, ghosts, map }]) => ghosts.map(ghost => ghost.move(pacman, deltaTime, map, canvas)))
  // pacman collide with ghost
  const collideWithGhost$ = ticker$
    .withLatestFrom(nextGhosts$, nextPacmanPos$)
    .map(([ticker, ghosts, pacman]) => {
      let collided = false
      ghosts.forEach(g => {
        const dist = Math.pow(g.col - pacman.col, 2) + Math.pow(g.row - pacman.row, 2)
        if (dist < 10) {
          collided = true
        }
      })
      return collided
    })
    .filter(Boolean)
  const nextPacman$ = Observable.merge(
    eatPowerBean$.withLatestFrom(nextPacmanPos$).map(([eatPowerBean, nextPacmanPos]) => {
      console.log('eat power bean')
      return nextPacmanPos
    }),
    nextPacmanPos$,
    collideWithGhost$.withLatestFrom(game$).map(([x, { pacman }]) => {
      console.log('pacman collide with ghost')
      return pacman
    })
  )

  // 发出下一次更新的actions
  const action$: Observable<Action> = Observable.merge(
    nextPacman$.map(pacman => ({ type: 'update-pacman', pacman } as UpdatePacman)),
    nextMap$.map(map => ({ type: 'update-map', map } as UpdateMap)),
    nextPowerBeans$.map(powerBeans => ({ type: 'update-power-beans', powerBeans } as UpdatePowerBeans)),
    nextScore$.map(score => ({ type: 'update-score', score } as UpdateScore)),
    nextGhosts$.map(ghosts => ({ type: 'update-ghosts', ghosts } as UpdateGhosts))
  )

  game$.subscribe(game => update(game, canvas))
  action$.subscribe(actionProxy$)
}
function update(game: Game, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  const { map, pacman, ghosts, score } = game
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  drawMap(map, canvas)
  pacman.draw(ctx)
  ghosts.forEach(g => g.draw(ctx))
  drawScore(ctx, score)
}
function drawScore(ctx: CanvasRenderingContext2D, score: number) {
  ctx.font = '20px Georgia'
  ctx.fillText(score.toString(), 40, 30)
}
export { drawMap, game }
