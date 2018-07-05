import drawAll from './drawing/drawAll'
import GameLevel from './logics/GameLevel'
import level1 from './levels/level1'

const canvas = document.getElementById('screen') as HTMLCanvasElement
const ctx = canvas.getContext('2d')

const sink = GameLevel(level1)

sink.subscribe(game => drawAll(ctx, game, level1))
