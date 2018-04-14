import { fork, select, take } from 'redux-saga/effects'
import { TickAction } from '../utils/action'
import { State } from '../reducers'
import { fromJS, List } from 'immutable'
import { Direction } from '../utils/types'
import { getOppsiteDirection } from '../utils'

function* ghostSaga() {
  yield fork(wanderMode)
}

function* wanderMode() {
  while (true) {
    const { delta }: TickAction = yield take('TICK')
    // 根据方向计算出目标贴图位置和方向
    // 进入目标贴图后，更新方向，并且重新计算目标贴图
    const { game: { ghosts, map } }: State = yield select()
    const newGhosts = ghosts.map(ghost => {
        const { dir, col, row } = ghost
        const { vx, vy } = ghost.getSpeed()
        let newTargetTile = ghost.targetTile
        let newGhost = ghost
        if (!newTargetTile) {
          newTargetTile = getNewTargetTile(map, dir, row, col)
          newGhost = ghost.set('targetTile', newTargetTile)
        }
        const nc = col + delta * vx
        const nr = row + delta * vy
        const { targetTile } = newGhost
        // 进入新的贴图
        if (Math.floor(nc) === targetTile.get('tile').get(1) && Math.floor(nr) === targetTile.get('tile').get(0)) {
          newTargetTile = getNewTargetTile(map, targetTile.get('dir'), nr, nc)
          newGhost = ghost.set('dir', targetTile.get('dir')).set('targetTile', newTargetTile)
        }
        // todo 测试
        return newGhost.set('col', nc).set('row', nr)
      }
    )
  }
}

/**
 * @param map 地图信息
 * @param dir 鬼的行进方向
 * @param row 鬼当前纵向位置
 * @param col 鬼当前横向位置
 * */
function getNewTargetTile(map: List<List<string>>, dir: Direction, row: number, col: number) {
  let r = Math.round(row)
  let c = Math.round(col)
  switch (dir) {
    case 'up':
      r = Math.floor(row) - 1
      break;
    case 'down':
      r = Math.ceil(row)
      break
    case 'left':
      c = Math.floor(col) - 1
      break
    case 'right':
      c = Math.ceil(row)
      break
  }
  const ds = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  const dirs = fromJS(['up', 'down', 'left', 'right'])
  const tiles = List([])
  for (let i = 0; i < ds.length; i += 1) {
    if (dirs.get(i) !== getOppsiteDirection(dir)) {
      if (map.get(r + ds[i][0]).get(c + ds[i][1]) !== 'X') {
        tiles.push(fromJS({
          tile: ds[i],
          dir: dirs.get(i)
        }))
      }
    }
  }
  return tiles.get(0)
}

