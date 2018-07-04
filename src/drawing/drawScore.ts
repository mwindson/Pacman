export default function drawScore(ctx: CanvasRenderingContext2D, score: number, paused: boolean) {
  ctx.save()
  ctx.font = '40px consolas'
  ctx.fillStyle = 'white'
  ctx.fillText(`score: ${score} ${paused ? 'paused' : ''}`, 20, 40)
  ctx.restore()
}
