import { SudokuGrid } from '../utils/cellPath'
import { Solution } from '../utils/solutionObject'
import { checkValid, InvalidPuzzleError } from '../utils/checkValid'
import solveWithStandardOptions from './applyStratsWithChains'
import { GridUpdate } from './applyStrats'

export interface CheckAndSolveResult extends GridUpdate {
  gridString: string
  formattedGrid: SudokuGrid
  recurSolution: false | number[]
  strategiesUsed: string[]
  valid: true
}

export const checkAndSolve = (
  gridString: string
): InvalidPuzzleError | CheckAndSolveResult => {
  const confirmValid = checkValid(gridString)
  if ('errorType' in confirmValid) {
    return confirmValid
  } else {
    const attempt = solveWithStandardOptions(
      confirmValid.formattedGrid
    ) as GridUpdate
    const strategiesUsed = [
      ...new Set(
        (attempt.solutions as (Solution | Solution[])[]).map((x) =>
          Array.isArray(x) ? x[0].strategy : x.strategy
        )
      ),
    ]
    return {
      gridString: confirmValid.gridString,
      formattedGrid: confirmValid.formattedGrid,
      recurSolution: confirmValid.solution,
      ...attempt,
      strategiesUsed,
      valid: true,
    }
  }
}
