import draw from './drawing/draw'
import game from './game'
import level1 from './levels/level1'

const canvas = document.getElementById('screen') as HTMLCanvasElement
const ctx = canvas.getContext('2d')

const sink = game(level1)

sink.subscribe(game => draw(ctx, game, level1))
