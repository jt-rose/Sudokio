import { assert } from 'chai'
import { getRow, getColumn, getBox } from '../src/utils/cellPath'
import solveSingleParam from '../src/strategies/singleParam'
import {
  singleParamRowGrid,
  singleParamColumnGrid,
  singleParamBoxGrid,
  basicPuzzleGrid,
} from './gridSamplesForTesting'
import { Solution } from '../src/utils/solutionObject'

describe('2. Solve Single Param', function () {
  it('valid solution for answer option only in single cell of row', function () {
    const solution1 = (solveSingleParam(
      singleParamRowGrid,
      getRow(30)
    ) as Solution[])[0]
    assert.equal(solution1.strategy, 'singleParam-Row')
    assert.equal(solution1.cellInit[0], 30)
    assert.equal(solution1.updates[0].index, 30)
    assert.sameOrderedMembers(solution1.updates[0].updatedAnswer, [7])
    assert.equal(solution1.narrow.length, 0)
    assert.equal(solution1.solved[0].index, 30)
    assert.sameOrderedMembers(solution1.solved[0].updatedAnswer, [7])

    const solution2 = (solveSingleParam(
      singleParamRowGrid,
      getRow(11)
    ) as Solution[])[0]
    assert.equal(solution2.strategy, 'singleParam-Row')
    assert.equal(solution2.cellInit[0], 11)
    assert.equal(solution2.updates[0].index, 11)
    assert.sameOrderedMembers(solution2.updates[0].updatedAnswer, [4])
    assert.equal(solution2.narrow.length, 0)
    assert.equal(solution2.solved[0].index, 11)
    assert.sameOrderedMembers(solution2.solved[0].updatedAnswer, [4])

    const solution3 = (solveSingleParam(
      singleParamRowGrid,
      getRow(66)
    ) as Solution[])[0]
    assert.equal(solution3.strategy, 'singleParam-Row')
    assert.equal(solution3.cellInit[0], 66)
    assert.equal(solution3.updates[0].index, 66)
    assert.sameOrderedMembers(solution3.updates[0].updatedAnswer, [8])
    assert.equal(solution3.narrow.length, 0)
    assert.equal(solution3.solved[0].index, 66)
    assert.sameOrderedMembers(solution3.solved[0].updatedAnswer, [8])
  })
  it('valid solution for answer option only in single cell of column', function () {
    const solution1 = (solveSingleParam(
      singleParamColumnGrid,
      getColumn(28)
    ) as Solution[])[0]
    assert.equal(solution1.strategy, 'singleParam-Column')
    assert.equal(solution1.cellInit[0], 28)
    assert.equal(solution1.updates[0].index, 28)
    assert.sameOrderedMembers(solution1.updates[0].updatedAnswer, [9])
    assert.equal(solution1.narrow.length, 0)
    assert.equal(solution1.solved[0].index, 28)
    assert.sameOrderedMembers(solution1.solved[0].updatedAnswer, [9])

    const solution2 = (solveSingleParam(
      singleParamColumnGrid,
      getColumn(52)
    ) as Solution[])[0]
    assert.equal(solution2.strategy, 'singleParam-Column')
    assert.equal(solution2.cellInit[0], 52)
    assert.equal(solution2.updates[0].index, 52)
    assert.sameOrderedMembers(solution2.updates[0].updatedAnswer, [4])
    assert.equal(solution2.narrow.length, 0)
    assert.equal(solution2.solved[0].index, 52)
    assert.sameOrderedMembers(solution2.solved[0].updatedAnswer, [4])

    const solution3 = (solveSingleParam(
      singleParamColumnGrid,
      getColumn(77)
    ) as Solution[])[0]
    assert.equal(solution3.strategy, 'singleParam-Column')
    assert.equal(solution3.cellInit[0], 77)
    assert.equal(solution3.updates[0].index, 77)
    assert.sameOrderedMembers(solution3.updates[0].updatedAnswer, [3])
    assert.equal(solution3.narrow.length, 0)
    assert.equal(solution3.solved[0].index, 77)
    assert.sameOrderedMembers(solution3.solved[0].updatedAnswer, [3])
  })
  it('valid solution for answer option only in single cell of box', function () {
    const solution1 = (solveSingleParam(
      singleParamBoxGrid,
      getBox(9)
    ) as Solution[])[0]
    assert.equal(solution1.strategy, 'singleParam-Box')
    assert.equal(solution1.cellInit[0], 9)
    assert.equal(solution1.updates[0].index, 9)
    assert.sameOrderedMembers(solution1.updates[0].updatedAnswer, [9])
    assert.equal(solution1.narrow.length, 0)
    assert.equal(solution1.solved[0].index, 9)
    assert.sameOrderedMembers(solution1.solved[0].updatedAnswer, [9])

    const solution2 = (solveSingleParam(
      singleParamBoxGrid,
      getBox(23)
    ) as Solution[])[0]
    assert.equal(solution2.strategy, 'singleParam-Box')
    assert.equal(solution2.cellInit[0], 23)
    assert.equal(solution2.updates[0].index, 23)
    assert.sameOrderedMembers(solution2.updates[0].updatedAnswer, [8])
    assert.equal(solution2.narrow.length, 0)
    assert.equal(solution2.solved[0].index, 23)
    assert.sameOrderedMembers(solution2.solved[0].updatedAnswer, [8])

    const solution3 = (solveSingleParam(
      singleParamBoxGrid,
      getBox(34)
    ) as Solution[])[0]
    assert.equal(solution3.strategy, 'singleParam-Box')
    assert.equal(solution3.cellInit[0], 34)
    assert.equal(solution3.updates[0].index, 34)
    assert.sameOrderedMembers(solution3.updates[0].updatedAnswer, [4])
    assert.equal(solution3.narrow.length, 0)
    assert.equal(solution3.solved[0].index, 34)
    assert.sameOrderedMembers(solution3.solved[0].updatedAnswer, [4])
  })
  it('valid rejection when answer option not limited to one cell in param', function () {
    assert.equal(solveSingleParam(basicPuzzleGrid, getColumn(3)), false)
    assert.equal(solveSingleParam(basicPuzzleGrid, getRow(72)), false)
    assert.equal(solveSingleParam(basicPuzzleGrid, getBox(0)), false)
  })
})
