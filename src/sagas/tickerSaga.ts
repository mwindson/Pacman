import { put, take } from 'redux-saga/effects'
import { eventChannel } from 'redux-saga'
import { TickAction } from '../utils/action'

export interface TickerOption {
  FPS?: number
}

export default function* tickerSaga(options: TickerOption = { FPS: 60 }) {
  let lastTime = performance.now()
  const tickChannel = eventChannel<TickAction>(emit => {
    let lastTime = performance.now()
    let requestId = requestAnimationFrame(emitTick)

    function emitTick() {
      const now = performance.now()
      emit({ type: 'TICK', delta: (now - lastTime) / 1000 })
      lastTime = now
      requestId = requestAnimationFrame(emitTick)
    }

    return () => cancelAnimationFrame(requestId)
  })

  try {
    let accTime = 0
    while (true) {
      const { delta }: TickAction = yield take(tickChannel)
      accTime += delta
      if (accTime > 1 / options.FPS) {
        yield put<TickAction>({ type: 'TICK', delta: accTime })
        accTime = 0
      }
    }
  } catch (e) {
    throw new Error("Tick Emit Error")
  }
}