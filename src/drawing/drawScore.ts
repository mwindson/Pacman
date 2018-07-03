export default function drawScore(ctx: CanvasRenderingContext2D, score: number) {
  ctx.font = '20px Georgia'
  ctx.fillText(score.toString(), 40, 30)
}
