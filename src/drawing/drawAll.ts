import { TILE_SIZE } from '../constant'
import { LevelConfig } from '../levels'
import { GameLevelSink } from '../logics/GameLevel'
import { Pos } from '../types'
import drawGhost from './drawGhost'
import drawHUD from './drawHUD'
import drawMapItems from './drawMapItems'
import drawPacman from './drawPacman'

// TODO 测试用
function drawGhostPaths(ctx: CanvasRenderingContext2D, color: string, path: Pos[]) {
  ctx.save()

  for (const pos of path) {
    const x = pos.col * TILE_SIZE
    const y = pos.row * TILE_SIZE
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()
  }

  ctx.restore()
}

export default function drawAll(
  ctx: CanvasRenderingContext2D,
  sink: GameLevelSink,
  config: LevelConfig,
) {
  ctx.save()

  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  drawHUD(ctx, sink)

  ctx.translate(4 * TILE_SIZE, 4 * TILE_SIZE)

  drawMapItems(ctx, sink.mapItems, config)
  drawPacman(ctx, sink.pacman)
  sink.ghostList.forEach(ghost => drawGhost(ctx, ghost))

  sink.pathInfoList.forEach(({ color, path }) => {
    drawGhostPaths(ctx, color, path)
  })

  ctx.restore()
}
