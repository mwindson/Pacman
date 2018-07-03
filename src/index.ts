import draw from './drawing/draw'
import game from './game'
import level1 from './levels/level1'

const canvas = document.getElementById('screen') as HTMLCanvasElement

const gameState$ = game(level1)

gameState$.subscribe(game => draw(game, canvas))
