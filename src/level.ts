import { Pos } from './types'

export interface LevelConfig {
  map: string[][]
  wallColor: string
  powerBeans: Pos[]
}

const levelConfig: LevelConfig = {
  map: [
    Array.from('XXXXXXXXXXXXXXXXXXXXXXXXXXXX'),
    Array.from('X............XX............X'),
    Array.from('X.XXXX.XXXXX.XX.XXXXX.XXXX.X'),
    Array.from('XPXXXX.XXXXX.XX.XXXXX.XXXXPX'),
    Array.from('X.XXXX.XXXXX.XX.XXXXX.XXXX.X'),
    Array.from('X..........................X'),
    Array.from('X.XXXX.XX.XXXXXXXX.XX.XXXX.X'),
    Array.from('X.XXXX.XX.XXXXXXXX.XX.XXXX.X'),
    Array.from('X......XX....XX....XX......X'),
    Array.from('XXXXXX.XXXXX XX XXXXX.XXXXXX'),
    Array.from('XXXXXX.XXXXX XX XXXXX.XXXXXX'),
    Array.from('XXXXXX.XX          XX.XXXXXX'),
    Array.from('XXXXXX.XX XXXDDXXX XX.XXXXXX'),
    Array.from('XXXXXX.XX X      X XX.XXXXXX'),
    Array.from('      .   X      X   .      '),
    Array.from('XXXXXX.XX X      X XX.XXXXXX'),
    Array.from('XXXXXX.XX XXXXXXXX XX.XXXXXX'),
    Array.from('XXXXXX.XX          XX.XXXXXX'),
    Array.from('XXXXXX.XX XXXXXXXX XX.XXXXXX'),
    Array.from('XXXXXX.XX XXXXXXXX XX.XXXXXX'),
    Array.from('X............XX............X'),
    Array.from('X.XXXX.XXXXX.XX.XXXXX.XXXX.X'),
    Array.from('X.XXXX.XXXXX.XX.XXXXX.XXXX.X'),
    Array.from('XP..XX................XX..PX'),
    Array.from('XXX.XX.XX.XXXXXXXX.XX.XX.XXX'),
    Array.from('XXX.XX.XX.XXXXXXXX.XX.XX.XXX'),
    Array.from('X......XX....XX....XX......X'),
    Array.from('X.XXXXXXXXXX.XX XXXXXXXXXX.X'),
    Array.from('X.XXXXXXXXXX.XX XXXXXXXXXX.X'),
    Array.from('X..........................X'),
    Array.from('XXXXXXXXXXXXXXXXXXXXXXXXXXXX'),
  ],
  wallColor: '#0e2275',
  powerBeans: [{ row: 3, col: 1 }, { row: 3, col: 26 }, { row: 23, col: 1 }, { row: 23, col: 26 }],
}

export default levelConfig
