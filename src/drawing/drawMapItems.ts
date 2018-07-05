import { List } from 'immutable'
import { TILE_SIZE } from '../constant'
import { LevelConfig } from '../levels'
import { MapItem } from '../types'

export default function drawMapItems(ctx: CanvasRenderingContext2D, mapItems: List<MapItem>, { M, N }: LevelConfig) {
  ctx.save()

  ctx.lineWidth = 2
  const get = (row: number, col: number) => mapItems.get(row * N + col, MapItem.obstacle)

  for (let row = 0; row < M; row += 1) {
    for (let col = 0; col < N; col += 1) {
      const item = get(row, col)
      const x = col * TILE_SIZE
      const y = row * TILE_SIZE
      if (item === MapItem.obstacle) {
        ctx.strokeStyle = 'blue'
        const code = [0, 0, 0, 0]
        if (
          get(row + 1, col) === MapItem.obstacle &&
          !(
            get(row + 1, col - 1) === MapItem.obstacle &&
            get(row + 1, col + 1) === MapItem.obstacle &&
            get(row, col - 1) === MapItem.obstacle &&
            get(row, col + 1) === MapItem.obstacle
          )
        ) {
          code[0] = 1
        }
        if (
          get(row, col + 1) === MapItem.obstacle &&
          !(
            get(row - 1, col + 1) === MapItem.obstacle &&
            get(row + 1, col + 1) === MapItem.obstacle &&
            get(row - 1, col) === MapItem.obstacle &&
            get(row + 1, col) === MapItem.obstacle
          )
        ) {
          code[1] = 1
        }
        if (
          get(row - 1, col) === MapItem.obstacle &&
          !(
            get(row - 1, col - 1) === MapItem.obstacle &&
            get(row - 1, col + 1) === MapItem.obstacle &&
            get(row, col - 1) === MapItem.obstacle &&
            get(row, col + 1) === MapItem.obstacle
          )
        ) {
          code[2] = 1
        }
        if (
          get(row, col - 1) === MapItem.obstacle &&
          !(
            get(row - 1, col - 1) === MapItem.obstacle &&
            get(row + 1, col - 1) === MapItem.obstacle &&
            get(row - 1, col) === MapItem.obstacle &&
            get(row + 1, col) === MapItem.obstacle
          )
        ) {
          code[3] = 1
        }
        switch (code.join('')) {
          /**
           *
           * 0 1 1
           * 0 1 0
           */
          case '1100':
            ctx.beginPath()
            ctx.arc(x + 8, y + 8, 8, Math.PI, 1.5 * Math.PI, false)
            ctx.stroke()
            ctx.closePath()
            break
          /**
           * 0 1 0
           * 1 1 0
           *
           */
          case '0110':
            ctx.beginPath()
            ctx.arc(x + 8, y - 8, 8, 0.5 * Math.PI, 1 * Math.PI, false)
            ctx.stroke()
            ctx.closePath()
            break
          /**
           * 1 1 0
           * 0 1 0
           */
          case '0011':
            ctx.beginPath()
            ctx.arc(x - 8, y - 8, 8, 0, 0.5 * Math.PI, false)
            ctx.stroke()
            ctx.closePath()
            break
          /**
           * 0 0
           * 1 1
           * 0 1
           */
          case '1001':
            ctx.beginPath()
            ctx.arc(x - 8, y + 8, 8, 1.5 * Math.PI, 2 * Math.PI, false)
            ctx.stroke()
            ctx.closePath()
            break
          default:
            const dist = 8
            const _COS = [1, 0, -1, 0]
            const _SIN = [0, 1, 0, -1]
            code.forEach(function(v, index) {
              if (v) {
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.lineTo(x - _SIN[index] * dist, y - _COS[index] * dist)
                ctx.stroke()
                ctx.closePath()
              }
            })
        }
      } else if (item === MapItem.bean) {
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, 2 * Math.PI)
        ctx.fill()
        ctx.closePath()
      } else if (item === MapItem.powerBean) {
        ctx.fillStyle = 'green'
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.closePath()
      } else if (item === MapItem.door) {
        ctx.strokeStyle = 'white'
        ctx.beginPath()
        ctx.moveTo(x - 8, y)
        ctx.lineTo(x + 8, y)
        ctx.stroke()
        ctx.closePath()
      }
    }
  }

  ctx.restore()
}
