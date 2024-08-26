'use client'

import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'
import { createParser, useQueryState } from 'nuqs'
import { useCallback } from 'react'

type Cell = ' ' | 'x' | 'o'
type Board = Cell[][]
type GameStatus = 'x-turn' | 'o-turn' | 'x-wins' | 'o-wins' | 'draw'
type GameState = {
  board: Board
  status: GameStatus
}

const defaultBoard = [
  [' ', ' ', ' '],
  [' ', ' ', ' '],
  [' ', ' ', ' ']
] satisfies Board

const defaultState = {
  board: defaultBoard,
  status: 'x-turn'
} satisfies GameState

const gameParser = createParser<GameState>({
  parse(query) {
    const board = query.split('|').map(row => row.split(''))
    // Validate the board
    if (board.length !== 3) {
      throw new Error('Invalid board length')
    }
    for (const row of board) {
      if (row.length !== 3) {
        throw new Error('Invalid row length')
      }
      for (const cell of row) {
        if (![' ', 'x', 'o'].includes(cell)) {
          throw new Error('Invalid cell')
        }
      }
    }
    return {
      board: board as Board,
      status: computeGameStatus(board as Board)
    }
  },
  serialize(state) {
    return state.board.map(row => row.join('')).join('|')
  }
})

function useGameEngine() {
  const [{ board, status }, setGameState] = useQueryState(
    'board',
    gameParser
      .withDefault(defaultState)
      .withOptions({ clearOnDefault: true, history: 'push' })
  )
  const play = useCallback(
    (i: number, j: number) => {
      if (status !== 'x-turn' && status !== 'o-turn') {
        return
      }
      if (board[i][j] !== ' ') {
        return
      }
      const newBoard = board.map(row => row.slice())
      newBoard[i][j] = status === 'x-turn' ? 'x' : 'o'
      setGameState({ board: newBoard, status: computeGameStatus(newBoard) })
    },
    [board, status]
  )
  const reset = useCallback(() => {
    setGameState(defaultState)
  }, [])

  return { board, status, play, reset }
}

function computeGameStatus(board: Board): GameStatus {
  const xCount = board.flat().filter(cell => cell === 'x').length
  const oCount = board.flat().filter(cell => cell === 'o').length
  if (xCount < oCount) {
    throw new Error("Too many o's")
  }
  if (xCount > oCount + 1) {
    throw new Error("Too many x's")
  }
  const lines = [
    // Rows
    board[0].join(''),
    board[1].join(''),
    board[2].join(''),
    // Columns
    board.map(row => row[0]).join(''),
    board.map(row => row[1]).join(''),
    board.map(row => row[2]).join(''),
    // Diagonals
    [board[0][0], board[1][1], board[2][2]].join(''),
    [board[0][2], board[1][1], board[2][0]].join('')
  ]
  if (lines.some(line => line === 'xxx')) {
    return 'x-wins'
  }
  if (lines.some(line => line === 'ooo')) {
    return 'o-wins'
  }
  if (board.flat().every(cell => cell !== ' ')) {
    return 'draw'
  }
  return xCount === oCount ? 'x-turn' : 'o-turn'
}

function Board() {
  const { board, play } = useGameEngine()
  return (
    <div
      className="grid grid-cols-3 gap-2"
      role="grid"
      aria-label="Tic-Tac-Toe Board"
    >
      {board.flatMap((row, i) =>
        row.map((cell, j) => {
          return (
            <Button
              variant="outline"
              className={cn(
                'h-20 w-20 text-4xl font-bold uppercase',
                cell === 'x' && 'text-blue-500 dark:text-blue-400',
                cell === 'o' && 'text-red-500, dark:text-red-400',
                cell !== ' ' && 'pointer-events-none'
              )}
              onClick={() => play(i, j)}
              aria-label={`${i + 1},${j + 1}: ${cell || 'Empty'}`}
            >
              {cell}
            </Button>
          )
        })
      )}
    </div>
  )
}

const prettyStatus: Record<GameStatus, string> = {
  'x-turn': 'Next player: X',
  'o-turn': 'Next player: O',
  'x-wins': 'X wins',
  'o-wins': 'O wins',
  draw: 'Draw'
}

function Status() {
  const { status, reset } = useGameEngine()
  return (
    <section className="flex w-full max-w-[256px] items-center justify-between">
      <span className="text-lg font-semibold" aria-live="polite">
        {prettyStatus[status]}
      </span>
      <Button onClick={reset}>Reset</Button>
    </section>
  )
}

export default function Client() {
  return (
    <>
      <Board />
      <Status />
    </>
  )
}
