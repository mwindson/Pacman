import { TILE_SIZE } from '../constant'
import { LevelConfig } from '../levels'
import { GameLevelSink } from '../logics/GameLevel'
import { Pos } from '../types'
import drawGhost from './drawGhost'
import drawHUD from './drawHUD'
import drawMapItems from './drawMapItems'
import drawPacman from './drawPacman'

// TODO 测试用
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

export default function drawAll(ctx: CanvasRenderingContext2D, gameLevelSink: GameLevelSink, config: LevelConfig) {
  ctx.save()

  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  drawHUD(ctx, gameLevelSink)

  ctx.translate(4 * TILE_SIZE, 4 * TILE_SIZE)

  drawMapItems(ctx, gameLevelSink.mapItems, config)
  drawPacman(ctx, gameLevelSink.pacman)
  gameLevelSink.ghostList.forEach(ghost => drawGhost(ctx, ghost))

  drawRoute(ctx, gameLevelSink.route)

  ctx.restore()
}
