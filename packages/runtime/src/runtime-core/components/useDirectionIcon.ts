import { Direction } from '../types/navigation'

const ARROWS: Record<Direction, string> = {
  [Direction.Up]: '↑',
  [Direction.Down]: '↓',
  [Direction.Left]: '←',
  [Direction.Right]: '→'
}

export function getDirectionIcon(direction?: Direction): string {
  return ARROWS[direction ?? Direction.Down]
}
