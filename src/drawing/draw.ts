import { TILE_SIZE } from '../constant'
import { LevelConfig } from '../levels'
import { Sink } from '../types'
import drawMapItems from './drawMapItems'
import drawScore from './drawScore'

export default function draw(ctx: CanvasRenderingContext2D, sink: Sink, config: LevelConfig) {
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  ctx.save()
  ctx.translate(4 * TILE_SIZE, 4 * TILE_SIZE)

  drawMapItems(ctx, sink.mapItems, config)
  sink.pacman.draw(ctx)

  ctx.restore()

  drawScore(ctx, sink.score, sink.paused)
}
