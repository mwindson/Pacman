import Pacman from '../sprites/Pacman'

export default function drawPacman(ctx: CanvasRenderingContext2D, pacman: Pacman) {
  const { x, y, dir, movedDistance, isMoving } = pacman
  const frameIndex = isMoving ? (movedDistance % 30 < 15 ? 1 : 0) : 0
  ctx.save()
  ctx.fillStyle = 'yellow'
  ctx.beginPath()
  if (frameIndex === 0) {
    switch (dir) {
      case 'left':
        ctx.arc(x, y, 15, 1.1 * Math.PI, 2.9 * Math.PI)
        break
      case 'right':
        ctx.arc(x, y, 15, 0.1 * Math.PI, 1.9 * Math.PI)
        break
      case 'up':
        ctx.arc(x, y, 15, 1.6 * Math.PI, 3.4 * Math.PI)
        break
      case 'down':
        ctx.arc(x, y, 15, 0.6 * Math.PI, 2.4 * Math.PI)
        break
      default:
        ctx.arc(x, y, 15, 1.1 * Math.PI, 2.9 * Math.PI)
        break
    }
  } else {
    ctx.arc(x, y, 15, 0, 2 * Math.PI)
  }
  ctx.lineTo(x, y)
  ctx.fill()
  ctx.closePath()
  ctx.restore()
}
