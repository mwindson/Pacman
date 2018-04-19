import { fork, put, race, select, take } from 'redux-saga/effects'
import { fromJS, is, List } from 'immutable'
import { Action, KeyPressAction, TickAction, UpdatePacman, UpdatePacmanDirection } from 'utils/action'
import tickerSaga from './tickerSaga'
import { State } from '../reducers'
import { findNearestTile, getOppsiteDirection, isOnValidPath } from '../utils'
import ghostSaga from './ghostSaga'
import { delay } from 'redux-saga'
import PacmanSprite from '../sprites/PacmanSprite'
import { Direction } from '../utils/types'

export default function* rootSaga() {
  console.log('root saga started')
  // yield put<Action>({ type: 'START_GAME' })
  yield startGame()
}

function* loadMap() {
  const mapData = require('../assets/level-1.json')
  yield put<Action>({
    type: 'UPDATE_MAP',
    map: fromJS(mapData.map.map((m: string) => m.split(''))),
  })
}

function* startGame() {
  yield loadMap()
  yield fork(tickerSaga)
  yield fork(playerController)
  yield fork(ghostSaga)
}

function* playerController() {
  yield playerMove()
}

function* playerMove() {
  while (true) {
    const { delta }: TickAction = yield take('TICK')
    let { keyPress } = yield race({ keyPress: take('KEY_PRESS'), other: delay(0) })
    const { game }: State = yield select()
    const { map, pacman } = game
    const { dir, col, row } = pacman
    let input = keyPress ? keyPress.dir : pacman.dir
    // 尝试改变方向
    let nextPacman = pacman
    if (canMove(map, pacman, input, delta)) {
      nextPacman = pacman.set('dir', input)
      const { vx, vy } = nextPacman.getSpeed()
      const nc = col + delta * vx
      const nr = row + delta * vy
      if (dir === input || dir === getOppsiteDirection(input)) {
        nextPacman = nextPacman.set('col', nc).set('row', nr)
      } else {
        nextPacman = nextPacman.set('col', Math.round(nc)).set('row', Math.round(nr))
      }
      // if (pacman.remain - delta < 0) {
      //   nextPacman = nextPacman.set('frameIndex', 1 - pacman.frameIndex).set('remain', 0.2)
      // } else {
      //   nextPacman = nextPacman.set('remain', pacman.remain - delta)
      // }
    } else {
      // 不改变方向,判断是否可以移动
      if (canMove(map, pacman, dir, delta)) {
        const { vx, vy } = pacman.getSpeed()
        const nc = col + delta * vx
        const nr = row + delta * vy
        nextPacman = pacman.set('row', nr).set('col', nc)
      }
    }
    if (!is(pacman, nextPacman)) {
      yield put<UpdatePacman>({ type: 'UPDATE_PACMAN', pacman: nextPacman })
    }
  }
}

function canMove(map: List<List<string>>, pacman: PacmanSprite, dir: Direction, delta: number) {
  let newPacman = pacman.set('dir', dir)
  const { vx, vy } = newPacman.getSpeed()
  const { row, col } = newPacman
  const nc = col + delta * vx
  const nr = row + delta * vy
  const { col: c, row: r } = findNearestTile(nc, nr, dir)
  return map.get(r).get(c) !== 'X'
}



