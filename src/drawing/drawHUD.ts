import { GameLevelSink } from '../logics/GameLevel'

export default function drawHUD(ctx: CanvasRenderingContext2D, sink: GameLevelSink) {
  ctx.save()
  ctx.font = '40px consolas'
  ctx.fillStyle = 'white'

  const scorePart = String(sink.score).padEnd(5)
  const pausedPart = sink.paused ? 'paused' : '      '
  const countdownPart = String(Math.round(sink.powerBeanCountdown)).padStart(5)

  ctx.fillText(`score: ${scorePart} ${pausedPart} ${countdownPart}`, 20, 40)

  ctx.strokeStyle = 'white'
  ctx.strokeRect(10, 10, 600, 35)

  ctx.restore()
}
