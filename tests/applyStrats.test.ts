import { assert } from 'chai'
import {
  applyStrats,
  limitStratsTo,
  applyStratsUntilDone,
  GridUpdate,
} from '../src/solver/applyStrats'
import { Solution } from '../src/utils/solutionObject'
import {
  basicPuzzleGrid,
  basicPuzzleAnswer,
  singleParamRowGrid,
  boxNarrowGrid1,
  XWingGrid3,
  XWingGrid3Answer,
  swordfishGrid1,
  swordfishGrid3,
} from './gridSamplesForTesting'

describe('Apply singleParam-focused solution to multiple params', function () {
  it('valid multiple returns', function () {
    const solutionList = applyStrats(
      limitStratsTo('solveSingleOptionFullGrid')
    )(basicPuzzleGrid) as Solution[]
    assert.equal(solutionList.length, 4)

    const cellsFound = solutionList.map((x) => x.cellInit)
    assert.sameMembers(cellsFound, [[40], [59], [62], [70]])
  })
})
describe('Apply series of strategies to grid', function () {
  it('correctly find first solution in list', function () {
    const stratCycle = applyStrats()
    const singleOptionFound = stratCycle(basicPuzzleGrid) as Solution[]
    assert.equal(singleOptionFound.length, 4)
    assert.equal(singleOptionFound[0].strategy, 'singleOption-MultiParam')
    assert.sameMembers(
      singleOptionFound.map((x) => x.cellInit[0]),
      [40, 59, 62, 70]
    )

    const singleParamFound = stratCycle(singleParamRowGrid) as Solution[]
    assert.equal(singleParamFound.length, 3)
    assert.equal(singleParamFound[0].strategy, 'singleParam-Row')
    assert.equal(singleParamFound[0].cellInit, [11])

    const boxNarrowFound = stratCycle(boxNarrowGrid1) as Solution[]
    // singleOption found first, recommended before boxNarrow
    assert.equal(boxNarrowFound.length, 4)
    assert.equal(boxNarrowFound[0].strategy, 'singleOption-Box')
    assert.sameMembers(
      boxNarrowFound.map((x) => x.cellInit[0]),
      [1, 21, 29, 37]
    )

    const upToSingleParam = applyStrats(
      limitStratsTo('solveSingleParamFullGrid')
    )
    const boxNarrowNotFound = upToSingleParam(swordfishGrid1)
    assert.equal(boxNarrowNotFound, false)
    const answerFound = stratCycle(swordfishGrid1) as Solution[]
    assert.equal(answerFound.length, 2)
    assert.equal(answerFound[0].strategy, 'boxNarrow')
  })

  it('continuously apply found solutions until none left', function () {
    // test basic puzzle
    const stratCycle = applyStratsUntilDone()
    const stratResult = stratCycle(basicPuzzleGrid) as GridUpdate
    assert.sameOrderedMembers(stratResult.updatedGrid, basicPuzzleAnswer)
    assert.equal(stratResult.solutions.length, 51)
    assert.equal((stratResult.solutions as Solution[])[50].round, 14)

    const onlySingleOption = (stratResult.solutions as Solution[]).filter((x) =>
      x.strategy.match('singleOption')
    )
    assert.equal(onlySingleOption.length, 51)

    const stratsFound = [...new Set(onlySingleOption.map((x) => x.strategy))]
    assert.equal(stratsFound.length, 4)

    // test puzzle containing xWing
    const XWingResult = stratCycle(XWingGrid3) as GridUpdate
    assert.sameOrderedMembers(XWingResult.updatedGrid, XWingGrid3Answer)
    assert.isTrue(
      (XWingResult.solutions as Solution[])
        .map((x) => x.strategy)
        .includes('X-Wing')
    )

    // test puzzle with swordfish strategy
    const swordfishResult = stratCycle(swordfishGrid3) as GridUpdate
    assert.isTrue(
      (swordfishResult.solutions as Solution[])
        .map((x) => x.strategy)
        .includes('Swordfish')
    )
  })
})
