import { fork, put, select, take } from 'redux-saga/effects'
import { TickAction, UpdateGhosts } from '../utils/action'
import { State } from '../reducers'
import { fromJS, List } from 'immutable'
import { Direction } from '../utils/types'
import { getOppsiteDirection } from '../utils'

export default function* ghostSaga() {
  console.log('ghost saga started')
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
        let newTargetTile = ghost.targetTile
        let newGhost = ghost
        if (!newTargetTile) {
          // todo 需要初始化计算目标贴图
          const ds = [[-1, 0], [1, 0], [0, -1], [0, 1]]
          const dirs = fromJS(['up', 'down', 'left', 'right'])
          let targets = List([])
          for (let i = 0; i < ds.length; i += 1) {
            if (dirs.get(i) !== getOppsiteDirection(dir)) {
              if (map.get(row + ds[i][0]).get(col + ds[i][1]) !== 'X') {
                targets = targets.push(dirs.get(i))
              }
            }
          }
          newGhost = newGhost.set('targetTile', fromJS({ row, col, dir: targets.get(0) })).set('dir', targets.get(0))
        }
        let targetTile = newGhost.targetTile
        // 进入新的贴图,进行预测
        if (Math.floor(col) === targetTile.get('col') && Math.floor(row) === targetTile.get('row')) {
          newTargetTile = getNewTargetTile(map, targetTile.get('dir'), row, col)
          newGhost = newGhost.set('targetTile', newTargetTile)
          // 到达目标贴图，改变方向
          newGhost = newGhost.set('dir', targetTile.get('dir'))
        }
        const { vx, vy } = newGhost.getSpeed()
        const nc = col + delta * vx
        const nr = row + delta * vy
        return newGhost.set('col', nc).set('row', nr)
      }
    )
    yield put<UpdateGhosts>({ type: 'UPDATE_GHOSTS', ghosts: newGhosts })
  }
}

/**
 * @param map 地图信息
 * @param dir 鬼的行进方向
 * @param row 鬼当前纵向位置
 * @param col 鬼当前横向位置
 * @param isFirst 是否为初始化targetTile
 * */
function getNewTargetTile(map: List<List<string>>, dir: Direction, row: number, col: number, isFirst = false) {
  let r = Math.floor(row)
  let c = Math.floor(col)
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
      c = Math.ceil(col)
      break
  }
  const ds = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  const dirs = fromJS(['up', 'down', 'left', 'right'])
  let targetDir = List([])
  for (let i = 0; i < ds.length; i += 1) {
    if (dirs.get(i) !== getOppsiteDirection(dir)) {
      if (map.get(r + ds[i][0]).get(c + ds[i][1]) !== 'X') {
        targetDir = targetDir.push(dirs.get(i))
      }
    }
  }
  return fromJS({
    col: c,
    row: r,
    dir: targetDir.get(Math.floor(Math.random() * targetDir.size))
  })
}

