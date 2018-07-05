import Ghost from '../sprites/Ghost'

const width = 30
const height = 30

export default function drawGhost(ctx: CanvasRenderingContext2D, ghost: Ghost) {
  const { x, y, frameIndex, color } = ghost
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, width * 0.5, 0, Math.PI, true)
  switch (frameIndex) {
    case 0:
      ctx.lineTo(x - width * 0.5, y + height * 0.4)
      ctx.quadraticCurveTo(x - width * 0.4, y + height * 0.5, x - width * 0.2, y + height * 0.3)
      ctx.quadraticCurveTo(x, y + height * 0.5, x + width * 0.2, y + height * 0.3)
      ctx.quadraticCurveTo(x + width * 0.4, y + height * 0.5, x + width * 0.5, y + height * 0.4)
      break
    case 1:
      ctx.lineTo(x - width * 0.5, y + height * 0.3)
      ctx.quadraticCurveTo(x - width * 0.25, y + height * 0.5, x, y + height * 0.3)
      ctx.quadraticCurveTo(x + width * 0.25, y + height * 0.5, x + width * 0.5, y + height * 0.3)
      break
  }
  ctx.fill()
  ctx.closePath()
  ctx.restore()
}
