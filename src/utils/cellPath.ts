import * as R from 'ramda'

/* ---------------------------------- types --------------------------------- */

// indexed location on sudoku puzzle, ie: 8 corresponds to cell 9
type GridLocation = number

// group of cell indexes that can be checked to see if they fall into
// a specific row, column, or box
type GridParam = number[]

// unique sets of rows, columns, and boxes
type ParamSet = number[]

// possible answers for a given cell or param
type AnswerOptions = number | number[]

// 81 length array to hold solved cells and anser options for unsolved cells
type SudokuGrid = (number | number[])[]

/* ------- util functions to traverse sudoku puzzle and analyze values ------ */

// This is a restructured cellPath using FP to simplify the codebase
const paramLength = [0, 1, 2, 3, 4, 5, 6, 7, 8]

const allIndex = R.range(0, 81)
const rowSets = paramLength.map((x) => getRow(x * 9))
const rowIndex = allIndex.map((x) => getRow(x))
const rowNumber = allIndex.map((x) => getRowNumber(x))
const columnSets = paramLength.map((x) => getColumn(x))
const columnIndex = allIndex.map((x) => getColumn(x))
const columnNumber = allIndex.map((x) => getColumnNumber(x))
const boxSets = [0, 3, 6, 27, 30, 33, 54, 57, 60].map((x) => getBox(x)) // box starting parameters
const allSets = [...rowSets, ...columnSets, ...boxSets]
const boxIndex = allIndex.map((x) => getBox(x))
const boxNumber = allIndex.map((x) => getBoxNumber(x))
const relCell = allIndex.map((x) => getRelCell(x))

export const cellPath = {
  allIndex,
  allSets,
  rowSets,
  rowIndex,
  rowNumber,
  columnSets,
  columnIndex,
  columnNumber,
  boxSets,
  boxIndex,
  boxNumber,
  relCell,
}

// Get rows, columns, and boxes related to each cell
export const getRow = (gridLocation: GridLocation) => {
  const rowStart = gridLocation - (gridLocation % 9)
  return [0, 1, 2, 3, 4, 5, 6, 7, 8].map((x) => rowStart + x)
}

export const getColumn = (gridLocation: GridLocation) => {
  const colStart = gridLocation % 9
  return [0, 1, 2, 3, 4, 5, 6, 7, 8].map((x) => x * 9 + colStart)
}

export function getBox(gridLocation: GridLocation) {
  // topleft corner of each box
  const boxStartingPosition = [0, 3, 6, 27, 30, 33, 54, 57, 60]
  const boxWall = gridLocation - (gridLocation % 3)
  const boxCorner = boxStartingPosition.find(
    (x) => x === boxWall || x === boxWall - 9 || x === boxWall - 18
  ) as number

  const boxParameters = [0, 1, 2, 9, 10, 11, 18, 19, 20]
  return boxParameters.map((x) => x + boxCorner)
}

export function getRowNumber(gridLocation: GridLocation) {
  return Math.floor(gridLocation / 9)
}

export function getColumnNumber(gridLocation: GridLocation) {
  return gridLocation % 9
}

export function getBoxNumber(gridLocation: GridLocation) {
  const boxStartingPosition = [0, 3, 6, 27, 30, 33, 54, 57, 60]
  const boxParameters = [0, 1, 2, 9, 10, 11, 18, 19, 20]
  const boxes = boxStartingPosition.map((x) => boxParameters.map((y) => x + y))
  return boxes.findIndex((x) => x.includes(gridLocation))
}

export function includesEach(gridParam: GridParam, paramSet: ParamSet) {
  return paramSet.every((x) => gridParam.includes(x))
}

// find which row, column, or box the cell index are found in
export function getParam(gridParam: GridParam) {
  if (gridParam.length === 9) {
    if (rowSets.some((set) => includesEach(gridParam, set))) {
      return 'Row'
    }
    if (columnSets.some((set) => includesEach(gridParam, set))) {
      return 'Column'
    }
    if (boxSets.some((set) => includesEach(gridParam, set))) {
      return 'Box'
    }
  }
  return false
}

export function getRelCell(gridLocation: GridLocation) {
  const allRelCell = getRow(gridLocation).concat(
    getColumn(gridLocation),
    getBox(gridLocation)
  )
  return [...new Set(allRelCell)]
}

export function getOpen(gridParam: GridParam, sudokuGrid: SudokuGrid) {
  return gridParam.filter((x) => typeof sudokuGrid[x] === 'object')
}

export function getSolved(gridParam: GridParam, sudokuGrid: SudokuGrid) {
  return gridParam.filter((x) => typeof sudokuGrid[x] === 'number')
}

export function getValues(gridParam: GridParam, sudokuGrid: SudokuGrid) {
  return gridParam.map((x) => sudokuGrid[x])
}

export function getUniqueValues(gridValues: SudokuGrid) {
  const flatValues = gridValues.flat()
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => flatValues.includes(x))
}

export const getOpenValues = (gridParam: GridParam, sudokuGrid: SudokuGrid) =>
  getValues(getOpen(gridParam, sudokuGrid), sudokuGrid)
export const getSolvedValues = (gridParam: GridParam, sudokuGrid: SudokuGrid) =>
  getValues(getSolved(gridParam, sudokuGrid), sudokuGrid)

export const getUniqueOpenValues = (
  gridParam: GridParam,
  sudokuGrid: SudokuGrid
) => getUniqueValues(getOpenValues(gridParam, sudokuGrid))
export const getUniqueSolvedValues = (
  gridParam: GridParam,
  sudokuGrid: SudokuGrid
) => getUniqueValues(getSolvedValues(gridParam, sudokuGrid))

const lengthError =
  'a string or array of sudoku cells must be 81 characters long'

export function toGridArray(gridString: string) {
  //const lengthError = Error("submitted sudoku grid is wrong length");
  if (gridString.length !== 81) {
    throw new Error(lengthError) // formerly return false
  }
  return gridString
    .split('')
    .map((x) => (x === '0' ? ([] as number[]) : (JSON.parse(x) as number)))
}

export function toGridString(sudokuGrid: SudokuGrid) {
  //const lengthError = Error("submitted sudoku grid is wrong length");
  if (sudokuGrid.length !== 81) {
    throw new Error(lengthError)
  }
  return sudokuGrid.map((x) => (typeof x !== 'number' ? 0 : x)).join('')
}

// format starting grid to list possible answers for unanswered cells
// only used in beginning, updateRelCell and processSolution used during analysis
export function formatGridArray(startingGrid: SudokuGrid) {
  return startingGrid.map((item, index) => {
    if (typeof item === 'number') {
      return item
    }
    const solvedValues = getUniqueValues(
      getValues(getSolved(getRelCell(index), startingGrid), startingGrid)
    )
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
      (answer) => !solvedValues.includes(answer)
    )
  })
}

export const formatGrid = (gridString: string) => {
  return formatGridArray(toGridArray(gridString))
}

// cross-reference one param with another while removing any cells that overlap
export function getExternal(baseParam: ParamSet, extParam: ParamSet) {
  return extParam.filter((x) => !baseParam.includes(x))
}

// cross-reference one param with another while removing any cells that overlap
export function getOpenExternal(
  baseParam: ParamSet,
  extParam: ParamSet,
  sudokuGrid: SudokuGrid
) {
  return getOpen(
    extParam.filter((x) => !baseParam.includes(x)),
    sudokuGrid
  )
}

const convertToArray = (answerArray: AnswerOptions) =>
  typeof answerArray === 'number' ? [answerArray] : answerArray

// get external cells in cross-referenced param while filtering out indexes
// that don't contain required answer(s)
export function getOpenExternalWith(
  baseParam: ParamSet,
  extParam: ParamSet,
  sudokuGrid: SudokuGrid,
  answerOptions: AnswerOptions
) {
  const possibleAnswers = convertToArray(answerOptions)
  return getOpenExternal(baseParam, extParam, sudokuGrid).filter((openCell) =>
    possibleAnswers.every((answer) =>
      (sudokuGrid[openCell] as number[]).includes(answer)
    )
  )
}

// find cells in given param that contain required answer(s)
export function getOpenCellsWith(
  gridParam: GridParam,
  sudokuGrid: SudokuGrid,
  answerOptions: AnswerOptions
) {
  const possibleAnswers = convertToArray(answerOptions)
  return getOpen(gridParam, sudokuGrid).filter((x) =>
    possibleAnswers.every((answer) =>
      (sudokuGrid[x] as number[]).includes(answer)
    )
  )
}
