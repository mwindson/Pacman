import { of } from 'rxjs'
import draw from './drawing/draw'
import game from './game'

const level = require('./level')

const canvas = document.getElementById('screen') as HTMLCanvasElement

// const level$ = of(level)
// const game$ = level$.subscribe(level => game(level as any))

const gameState$ = game(level)

gameState$.subscribe(game => draw(game, canvas))
