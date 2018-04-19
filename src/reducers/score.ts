import { Action } from '../utils/action'
import { BEAN_SCORE, POWER_BEAN_SCORE } from '../constant'

const scoreState = 0

export function score(state = scoreState, action: Action) {
  if (action.type === 'EAT_BEAN') {
    return state + BEAN_SCORE
  } else if (action.type === 'EAT_POWERBEAN') {
    return state + POWER_BEAN_SCORE
  }
  return state
}