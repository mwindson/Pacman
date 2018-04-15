import { fork, put, select, take, takeEvery, takeLatest } from 'redux-saga/effects'
import { fromJS } from 'immutable'
import { Action, KeyPressAction, TickAction, UpdatePacman, UpdatePacmanDirection } from 'utils/action'
import tickerSaga from './tickerSaga'
import { State } from '../reducers'
import { getOppsiteDirection, isOnValidPath } from '../utils'
import ghostSaga from './ghostSaga'


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
    const { dir: input }: KeyPressAction = yield take('KEY_PRESS')
    const { game }: State = yield select()
    const { map, pacman } = game
    const { dir, col, row } = pacman
    let nextPacman = pacman.set('dir', input)
    const { vx, vy } = nextPacman.getSpeed()
    const nc = col + delta * vx
    const nr = row + delta * vy
    if (isOnValidPath(map, nc, nr, input)) {
      if (dir === input || dir === getOppsiteDirection(input)) {
        nextPacman = nextPacman.set('col', nc).set('row', nr)
      } else {
        nextPacman = nextPacman.set('col', Math.round(nc)).set('row', Math.round(nr))
      }
      if (pacman.remain - delta < 0) {
        nextPacman = nextPacman.set('frameIndex', 1 - pacman.frameIndex).set('remain', 0.2)
      } else {
        nextPacman = nextPacman.set('remain', pacman.remain - delta)
      }
    } else {
      nextPacman = nextPacman.set('frameIndex', 0).set('remain', 0.2)
    }
    yield put<UpdatePacman>({ type: 'UPDATE_PACMAN', pacman: nextPacman })
  }
}



