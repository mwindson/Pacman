import { Game } from '../types'
import drawMap from './drawMap'
import drawScore from './drawScore'

export default function draw(game: Game, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  const { map, pacman, ghosts, score } = game

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  drawMap(map, canvas)
  pacman.draw(ctx)
  ghosts.forEach(g => g.draw(ctx))
  drawScore(ctx, score)
}
