import { put } from 'redux-saga/effects'

export default function* tickerSaga() {
  let lastTime = performance.now()

  function* timeEmit() {
    const now = performance.now()
    yield put({ type: 'TICK', delta: now - lastTime })
    lastTime = now
    requestAnimationFrame(timeEmit)
  }

  yield timeEmit()
}