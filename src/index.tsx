import { Observable } from 'rxjs'
import drawAll from './drawing/drawAll'
import level1 from './levels/level1'
import GameLevel, { GameLevelSink } from './logics/GameLevel'

const canvas = document.getElementById('screen') as HTMLCanvasElement
const ctx = canvas.getContext('2d')

const sink = GameLevel(level1)

sink.subscribe(game => drawAll(ctx, game, level1))

declare module 'react' {
  type Updater<T> = (old: T) => T
  type Setter<T> = (val: T) => void
  export const useState: <T>(initState: T) => [T, Setter<T> & ((arg: Updater<T>) => void)]
  export const useEffect: (init: () => void | (() => void), inputs?: any[]) => void
}

import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

ReactDOM.render(<Game />, document.getElementById('container'))

function useObservable<T>(observable: Observable<T>) {
  const [state, setter] = useState<T>(null)
  useEffect(() => {
    const subscription = observable.subscribe(setter)
    return () => subscription.unsubscribe()
  }, [])
  return state
}

function Game() {
  const game = useObservable(sink)
  if (game == null) {
    return null
  }
  return <h1>score: {game.score}</h1>
}
