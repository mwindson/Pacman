import { List } from 'immutable'
import { coordinate2Pos } from '../utils'

export default function drawMap(map: List<List<string>>, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  ctx.lineWidth = 2
  const get = (i: number, j: number) =>
    i < 0 || j < 0 || i >= map.size || j >= map.get(0).size ? 'X' : map.get(i).get(j)
  for (let i = 0; i < map.size; i += 1) {
    for (let j = 0; j < map.get(0).size; j += 1) {
      const value = get(i, j)
      const pos = coordinate2Pos(i, j)
      const { x, y } = pos
      if (value === 'X') {
        ctx.strokeStyle = 'blue'
        const code = [0, 0, 0, 0]
        if (
          get(i + 1, j) === 'X' &&
          !(
            get(i + 1, j - 1) === 'X' &&
            get(i + 1, j + 1) === 'X' &&
            get(i, j - 1) === 'X' &&
            get(i, j + 1) === 'X'
          )
        ) {
          code[0] = 1
        }
        if (
          get(i, j + 1) === 'X' &&
          !(
            get(i - 1, j + 1) === 'X' &&
            get(i + 1, j + 1) === 'X' &&
            get(i - 1, j) === 'X' &&
            get(i + 1, j) === 'X'
          )
        ) {
          code[1] = 1
        }
        if (
          get(i - 1, j) === 'X' &&
          !(
            get(i - 1, j - 1) === 'X' &&
            get(i - 1, j + 1) === 'X' &&
            get(i, j - 1) === 'X' &&
            get(i, j + 1) === 'X'
          )
        ) {
          code[2] = 1
        }
        if (
          get(i, j - 1) === 'X' &&
          !(
            get(i - 1, j - 1) === 'X' &&
            get(i + 1, j - 1) === 'X' &&
            get(i - 1, j) === 'X' &&
            get(i + 1, j) === 'X'
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
                ctx.moveTo(pos.x, pos.y)
                ctx.lineTo(pos.x - _SIN[index] * dist, pos.y - _COS[index] * dist)
                ctx.stroke()
                ctx.closePath()
              }
            })
        }
      } else if (value === '.') {
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, 2 * Math.PI)
        ctx.fill()
        ctx.closePath()
      } else if (value === 'P') {
        ctx.fillStyle = 'green'
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.closePath()
      } else if (value === 'D') {
        ctx.strokeStyle = 'white'
        ctx.beginPath()
        ctx.moveTo(x - 8, y)
        ctx.lineTo(x + 8, y)
        ctx.stroke()
        ctx.closePath()
      }
    }
  }
}
