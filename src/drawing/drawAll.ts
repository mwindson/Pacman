import { TILE_SIZE } from '../constant'
import { LevelConfig } from '../levels'
import { Pos, Sink } from '../types'
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
  sink.ghostList.forEach(ghost => drawGhost(ctx, ghost))

  // console.log(sink.route)
  drawRoute(ctx, sink.route)

  ctx.restore()
}

function drawRoute(ctx: CanvasRenderingContext2D, route: Pos[]) {
  ctx.save()

  for (const pos of route) {
    const x = pos.col * TILE_SIZE
    const y = pos.row * TILE_SIZE
    ctx.fillStyle = 'pink'
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()
  }

  ctx.restore()
}
