import { fork, put } from 'redux-saga/effects'
import { fromJS } from 'immutable'
import { Action } from 'utils/action'
import tickerSaga from './tickerSaga'

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
  yield fork(tickerSaga)
  yield loadMap()
}
