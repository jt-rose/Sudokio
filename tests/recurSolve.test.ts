import { assert } from 'chai'
import { SudokuGrid } from '../src/utils/cellPath'
import solveTraditional from '../src/strategies/recurSolve'
import {
  incorrectGrid,
  basicPuzzleGrid,
  basicPuzzleAnswer,
} from './gridSamplesForTesting'

describe('Test traditional CS method - recursive backtracking', function () {
  it('correct answer', function () {
    const solved = solveTraditional(basicPuzzleGrid) as SudokuGrid
    assert.sameOrderedMembers(solved, basicPuzzleAnswer)
  })
  it('correct rejection', function () {
    assert.equal(solveTraditional(incorrectGrid), false)
  })
})
