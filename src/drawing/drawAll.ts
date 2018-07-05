import { TILE_SIZE } from '../constant'
import { LevelConfig } from '../levels'
import { Sink } from '../types'
import drawGhost from './drawGhost'
import drawHUD from './drawHUD'
import drawMapItems from './drawMapItems'
import drawPacman from './drawPacman'

export default function drawAll(ctx: CanvasRenderingContext2D, sink: Sink, config: LevelConfig) {
  ctx.save()

  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  drawHUD(ctx, sink)

  ctx.translate(4 * TILE_SIZE, 4 * TILE_SIZE)

  drawMapItems(ctx, sink.mapItems, config)
  drawPacman(ctx, sink.pacman)
  sink.ghosts.forEach(ghost => drawGhost(ctx, ghost))

  ctx.restore()
}
