import { ControlConfig } from './types'

export const TILE_SIZE = 16

export const PACMAN_SPEED = 0.096
export const GHOST_SPEED = 0.096

export const BEAN_SCORE = 10
export const POWER_BEAN_SCORE = 50

export const POWER_BEAN_EFFECT_TIMEOUT = 5000
export const GHOST_AUTO_ROUTE_INTERVAL = 500

export const CONTROL_CONFIG: ControlConfig = {
  left: 'a',
  right: 'd',
  up: 'w',
  down: 's',
  pause: 'Escape',
}
