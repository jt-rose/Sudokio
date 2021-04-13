import { assert } from 'chai'
import {
  getRelCell,
  formatGrid,
  getSolved,
  getUniqueOpenValues,
} from '../src/utils/cellPath'
import {
  isOnly,
  Update,
  Solution,
  updateRelCell,
  applySolution,
} from '../src/utils/solutionObject'
import { filterBest, sortBest } from '../src/utils/sortAndFilter'
import { solveXChainFullGrid } from '../src/strategies/chains'
import {
  basicPuzzleGrid as sudokuGrid,
  xChainGrid,
} from './gridSamplesForTesting'

describe('Generate Solution Object', function () {
  describe("Return possible answers to remove when answer can 'only' be from a certain set", function () {
    it('valid answers to remove', function () {
      assert.sameOrderedMembers(isOnly([1, 2, 3, 4]), [5, 6, 7, 8, 9])
      assert.sameOrderedMembers(isOnly([3, 4, 5, 6]), [1, 2, 7, 8, 9])
      assert.sameOrderedMembers(isOnly(6), [1, 2, 3, 4, 5, 7, 8, 9])
    })
  })
  describe('Format what updates will occur after applying solution', function () {
    it('valid updates after removing answers', function () {
      const update1 = new Update({ index: 2, sudokuGrid, removal: [1, 2] })
      assert.equal(update1.index, 2)
      assert.sameOrderedMembers(update1.removal, [1, 2])
      assert.sameOrderedMembers(update1.currentAnswer, [1, 2, 4])
      assert.sameOrderedMembers(update1.updatedAnswer, [4])

      const update2 = new Update({ index: 7, sudokuGrid, removal: [2, 4] })
      assert.equal(update2.index, 7)
      assert.sameOrderedMembers(update2.removal, [2, 4])
      assert.sameOrderedMembers(update2.currentAnswer, [1, 2, 4, 9])
      assert.sameOrderedMembers(update2.updatedAnswer, [1, 9])

      const update3 = new Update({ index: 3, sudokuGrid, removal: [2] })
      assert.equal(update3.index, 3)
      assert.sameOrderedMembers(update3.removal, [2])
      assert.sameOrderedMembers(update3.currentAnswer, [2, 6])
      assert.sameOrderedMembers(update3.updatedAnswer, [6])
    })
    it('valid updates after removing answers with isOnly', function () {
      const update4 = new Update({
        index: 2,
        sudokuGrid,
        removal: isOnly([2, 4]),
      })
      assert.equal(update4.index, 2)
      assert.sameOrderedMembers(update4.removal, [1, 3, 5, 6, 7, 8, 9])
      assert.sameOrderedMembers(update4.currentAnswer, [1, 2, 4])
      assert.sameOrderedMembers(update4.updatedAnswer, [2, 4])

      const update5 = new Update({
        index: 7,
        sudokuGrid,
        removal: isOnly([1, 5, 9]),
      })
      assert.equal(update5.index, 7)
      assert.sameOrderedMembers(update5.removal, [2, 3, 4, 6, 7, 8])
      assert.sameOrderedMembers(update5.currentAnswer, [1, 2, 4, 9])
      assert.sameOrderedMembers(update5.updatedAnswer, [1, 9])

      const update6 = new Update({ index: 3, sudokuGrid, removal: isOnly(6) })
      assert.equal(update6.index, 3)
      assert.sameOrderedMembers(update6.removal, [1, 2, 3, 4, 5, 7, 8, 9])
      assert.sameOrderedMembers(update6.currentAnswer, [2, 6])
      assert.sameOrderedMembers(update6.updatedAnswer, [6])
    })
    /*it("valid creation of updates with additional notes", function() {
            const testNotes = "test";
 
            const update4 = new Update({index: 2, sudokuGrid, removal: isOnly([2,4]) });
            assert.equal(Object.keys(update4).length, 4);

            const update4WithNotes = new Update({index: 2, sudokuGrid, removal: isOnly([2,4]), {testNotes} });
            assert.equal(Object.keys(update4WithNotes).length, 5);
            assert.equal(update4WithNotes.testNotes, "test");

        });*/
  })
  describe('Format Solution Object', function () {
    it('valid data formatting - solve without narrow', function () {
      const updateA = new Update({ index: 40, sudokuGrid, removal: isOnly(5) })
      const solutionA = new Solution({
        strategy: 'multiParam',
        cellInit: [40],
        updates: [updateA],
      })

      assert.equal(solutionA.strategy, 'multiParam')
      assert.equal(solutionA.cellInit[0], 40)
      assert.sameOrderedMembers(solutionA.removal, [1, 2, 3, 4, 6, 7, 8, 9])
      assert.sameOrderedMembers(solutionA.updates[0].updatedAnswer, [5])
      assert.equal(solutionA.updates.length, 1)
      assert.equal(solutionA.narrow.length, 0)
      assert.sameOrderedMembers(solutionA.solved[0].updatedAnswer, [5])
      assert.equal(solutionA.solved.length, 1)
    })
    it('valid data formatting - narrow without solve', function () {
      const updateB = [54, 72].map(
        (x) => new Update({ index: x, sudokuGrid, removal: [2, 9] })
      )
      const solutionB = new Solution({
        strategy: 'testing123',
        cellInit: [54, 55, 56, 63, 64, 65, 72, 73, 74],
        updates: updateB,
      })

      assert.equal(solutionB.strategy, 'testing123')
      assert.sameOrderedMembers(solutionB.cellInit, [
        54,
        55,
        56,
        63,
        64,
        65,
        72,
        73,
        74,
      ])
      assert.sameOrderedMembers(solutionB.removal, [2, 9])
      assert.equal(solutionB.updates[1].index, 72)
      assert.sameDeepOrderedMembers(solutionB.updates[1].updatedAnswer, [1, 3])
      assert.equal(solutionB.updates.length, 2)
      assert.equal(solutionB.narrow[1].index, 72)
      assert.sameDeepOrderedMembers(solutionB.narrow[1].updatedAnswer, [1, 3])
      assert.equal(solutionB.narrow.length, 2)
      assert.equal(solutionB.solved.length, 0)
    })
    it('valid data formatting - solve and narrow', function () {
      const updateC = [63, 72].map(
        (index) => new Update({ index, sudokuGrid, removal: [3] })
      ) // orig 3 was number, not array
      const solutionC = new Solution({
        strategy: 'singleParam',
        cellInit: [62],
        updates: updateC,
      })

      assert.equal(solutionC.strategy, 'singleParam')
      assert.equal(solutionC.cellInit[0], 62)
      assert.sameOrderedMembers(solutionC.removal, [3])
      assert.sameOrderedMembers(solutionC.updates[1].updatedAnswer, [1, 2])
      assert.equal((solutionC.updates as Update[]).length, 2)
      assert.sameOrderedMembers(solutionC.narrow[0].updatedAnswer, [1, 2])
      assert.equal(solutionC.narrow.length, 1)
      assert.sameOrderedMembers(solutionC.solved[0].updatedAnswer, [2])
      assert.equal(solutionC.solved.length, 1)
    })
    /*it("valid creation of solution object with additional notes", function() {
            const updateC = [63, 72].map(index => new Update({index, sudokuGrid, removal: [3] }));
            const solutionC = new Solution({ strategy: "singleParam", cellInit: [62], updates: updateC });
            const testNotes = "test";
 
            assert.equal(Object.keys(solutionC).length, 6);

            const solutionCWithNotes = new Solution({ strategy: "singleParam", cellInit: [62], updates: updateC, {testNotes} });
            assert.equal(Object.keys(solutionCWithNotes).length, 7);
            assert.equal(solutionCWithNotes.testNotes, "test");

        });*/
  })
  describe('Filter the best solution from a list', function () {
    it('choose best solution', function () {
      const updateA = new Update({ index: 40, sudokuGrid, removal: isOnly(5) })
      const solutionA = new Solution({
        strategy: 'multiParam',
        cellInit: [40],
        updates: [updateA],
      }) // 1 solve

      const updateB = [54, 72].map(
        (index) => new Update({ index, sudokuGrid, removal: [2, 9] })
      )
      const solutionB = new Solution({
        strategy: 'testing123',
        cellInit: [54, 55, 56, 63, 64, 65, 72, 73, 74],
        updates: updateB,
      }) // 2 narrow

      const updateC = [63, 72].map(
        (index) => new Update({ index, sudokuGrid, removal: [3] })
      )
      const solutionC = new Solution({
        strategy: 'singleParam',
        cellInit: [62],
        updates: updateC,
      }) // solve and narrow

      const solutionD = new Solution({
        strategy: 'test',
        cellInit: [54],
        updates: [updateB[0]],
      }) // only one narrow [1,3]

      const updateE = new Update({ index: 74, sudokuGrid, removal: [4] })
      const solutionE = new Solution({
        strategy: 'test',
        cellInit: [74],
        updates: [updateE],
      }) // one narrow [1,2,3,5]

      const solutionAB = [solutionA, solutionB]
      const solutionAC = [solutionA, solutionC]
      const solutionBC = [solutionB, solutionC]
      const solutionABC = [solutionA, solutionB, solutionC]
      const solutionBD = [solutionB, solutionD]
      const solutionDE = [solutionD, solutionE]

      assert.deepEqual(filterBest(solutionAB), solutionA) // solve over narrow
      assert.deepEqual(filterBest(solutionAC), solutionC) // solve + narrow over just solve
      assert.deepEqual(filterBest(solutionBC), solutionC) // 1 solve, 1 narrow over 2 narrow
      assert.deepEqual(filterBest(solutionABC), solutionC) // solve and narrow over others
      assert.deepEqual(filterBest(solutionBD), solutionB) // 2 narrow over 1 narrow
      assert.deepEqual(filterBest(solutionDE), solutionD) // both have one narrow, but one is closer to being solved

      // test bestFilter on X-Chain
      const xChainFullGridAnswer = solveXChainFullGrid(xChainGrid) as Solution[]
      const bestXChain = filterBest(xChainFullGridAnswer) as Solution

      assert.equal(xChainFullGridAnswer.length, 12)
      const totalRoundsFound = [
        ...new Set(xChainFullGridAnswer.map((x) => x.totalChainRounds)),
      ]
      assert.sameMembers(totalRoundsFound, [1, 2, 3, 4])
      assert.equal(bestXChain.totalChainRounds, 1)
    })
  })
  describe('Sort solutionList according to best options (according to filterBest)', function () {
    it('valid sorting', function () {
      const updateA = new Update({ index: 40, sudokuGrid, removal: isOnly(5) })
      const solutionA = new Solution({
        strategy: 'multiParam',
        cellInit: [40],
        updates: [updateA],
      }) // 1 solve
      const updateC = [63, 72].map(
        (index) => new Update({ index, sudokuGrid, removal: [3] })
      )
      const solutionC = new Solution({
        strategy: 'singleParam',
        cellInit: [62],
        updates: updateC,
      }) // solve and narrow

      const solutionAC = [solutionA, solutionC]
      const sortedAnswers = sortBest(solutionAC)
      assert.sameDeepOrderedMembers(
        sortedAnswers as (Solution | Solution[])[],
        [solutionC, solutionA]
      )

      const xChainGrid = formatGrid(
        '270060540050127080000400270000046752027508410500712908136274895785001024002000107'
      )
      const xChainFullGridAnswer = solveXChainFullGrid(xChainGrid) as Solution[]
      const sortedXChainAnswers = sortBest(xChainFullGridAnswer) as Solution[]

      const unsortedTotalRounds = [
        ...new Set(xChainFullGridAnswer.map((x) => x.totalChainRounds)),
      ]
      const sortedTotalRounds = [
        ...new Set(sortedXChainAnswers.map((x) => x.totalChainRounds)),
      ]

      assert.sameOrderedMembers(unsortedTotalRounds, [3, 2, 1, 4])
      assert.sameOrderedMembers(sortedTotalRounds, [1, 2, 3, 4])
    })
  })
  describe('Update related cell answers options after solving one', function () {
    it('valid updates for connected cells', function () {
      const answeredCellIndex = 2
      const answeredGrid = sudokuGrid.map((item, index) =>
        index === answeredCellIndex ? 4 : item
      )
      const updatedGrid = updateRelCell(answeredCellIndex, answeredGrid)
      assert.equal(updatedGrid[2], 4)
      const currentOpen = getUniqueOpenValues(
        getRelCell(answeredCellIndex),
        updatedGrid
      )
      assert.equal(currentOpen.includes(4), false)
      assert.sameOrderedMembers(updatedGrid[7] as number[], [1, 2, 9])
      assert.sameOrderedMembers(updatedGrid[10] as number[], [2, 7])
      assert.sameOrderedMembers(updatedGrid[74] as number[], [1, 2, 3, 5])
    })
  })
  describe('Apply the solution to a sudokuGrid and return updated grid', function () {
    const updateA = new Update({ index: 40, sudokuGrid, removal: isOnly(5) })
    const solutionA = new Solution({
      strategy: 'multiParam',
      cellInit: [40],
      updates: [updateA],
    })
    const gridA = applySolution(sudokuGrid, solutionA)

    const updateB = [54, 72].map(
      (index) => new Update({ index, sudokuGrid, removal: [2, 9] })
    )
    const solutionB = new Solution({
      strategy: 'testing123',
      cellInit: [54, 55, 56, 63, 64, 65, 72, 73, 74],
      updates: updateB,
    })
    const gridB = applySolution(sudokuGrid, solutionB)

    const updateC = [63, 72].map(
      (index) => new Update({ index, sudokuGrid, removal: [3] })
    )
    const solutionC = new Solution({
      strategy: 'singleParam',
      cellInit: [62],
      updates: updateC,
    })
    const gridC = applySolution(sudokuGrid, solutionC)

    it('apply solutions object to solve cells', function () {
      // check cell answer and type before solution
      assert.sameOrderedMembers(sudokuGrid[40] as number[], [5])
      assert.isArray(sudokuGrid[40])
      // check for successful update
      assert.equal(gridA[40], 5)
      assert.isNotArray(gridA[40])
    })
    it('apply solutions object to narrow options for cells', function () {
      // check cell answer and type before solution
      assert.sameOrderedMembers(sudokuGrid[54] as number[], [1, 3, 9])
      assert.isArray(sudokuGrid[54])
      assert.sameOrderedMembers(sudokuGrid[72] as number[], [1, 2, 3])
      assert.isArray(sudokuGrid[72])
      // check for successful update
      assert.sameOrderedMembers(gridB[54] as number[], [1, 3])
      assert.isArray(gridB[54])
      assert.sameOrderedMembers(gridB[72] as number[], [1, 3])
      assert.isArray(gridB[72])
    })
    it('apply solutions object to both solve and narrow cells', function () {
      // check cell answer and type before solution
      assert.sameOrderedMembers(sudokuGrid[63] as number[], [2, 3])
      assert.isArray(sudokuGrid[63])
      assert.sameOrderedMembers(sudokuGrid[72] as number[], [1, 2, 3])
      assert.isArray(sudokuGrid[72])
      // check for successful update
      assert.equal(gridC[63], 2)
      assert.isNotArray(gridC[63])
      assert.sameOrderedMembers(gridC[72] as number[], [1]) // 3 removed from solution and 2 from updateRelCell, still array
      assert.isArray(gridC[72])
    })
    it('narrow options of related cells after solving a cell', function () {
      assert.sameOrderedMembers(sudokuGrid[37] as number[], [2, 5])
      assert.sameOrderedMembers(sudokuGrid[38] as number[], [2, 5, 6, 9])
      assert.sameOrderedMembers(sudokuGrid[42] as number[], [5, 7, 9])
      assert.sameOrderedMembers(sudokuGrid[43] as number[], [2, 5, 9])
      assert.sameOrderedMembers(sudokuGrid[58] as number[], [3, 5])
      assert.sameOrderedMembers(sudokuGrid[30] as number[], [5, 7, 9])
      assert.sameOrderedMembers(sudokuGrid[48] as number[], [5, 9])

      assert.sameOrderedMembers(gridA[37] as number[], [2])
      assert.sameOrderedMembers(gridA[38] as number[], [2, 6, 9])
      assert.sameOrderedMembers(gridA[42] as number[], [7, 9])
      assert.sameOrderedMembers(gridA[43] as number[], [2, 9])
      assert.sameOrderedMembers(gridA[58] as number[], [3])
      assert.sameOrderedMembers(gridA[30] as number[], [7, 9])
      assert.sameOrderedMembers(gridA[48] as number[], [9])

      // check that solved related Cells for Solution B has not changed
      assert.sameOrderedMembers(
        getSolved(getRelCell(54), sudokuGrid),
        getSolved(getRelCell(54), gridB)
      )
      assert.sameOrderedMembers(
        getSolved(getRelCell(72), sudokuGrid),
        getSolved(getRelCell(72), gridB)
      )

      // check that Solution C has updated related cells only for solved answers (not narrowed)
      assert.isTrue(getUniqueOpenValues(getRelCell(63), sudokuGrid).includes(2))
      assert.isNotTrue(getUniqueOpenValues(getRelCell(63), gridC).includes(2))

      assert.isTrue(getUniqueOpenValues(getRelCell(72), sudokuGrid).includes(3))
      assert.isTrue(getUniqueOpenValues(getRelCell(72), gridC).includes(3))
    })
  })
  describe('Apply multiple solutions to a sudokuGrid', function () {
    const updateA = new Update({ index: 40, sudokuGrid, removal: isOnly(5) })
    const solutionA = new Solution({
      strategy: 'multiParam',
      cellInit: [40],
      updates: [updateA],
    })

    const updateC = [63, 72].map(
      (index) => new Update({ index, sudokuGrid, removal: [3] })
    )
    const solutionC = new Solution({
      strategy: 'singleParam',
      cellInit: [62],
      updates: updateC,
    })

    const updateD = new Update({ index: 11, sudokuGrid, removal: isOnly(2) })
    const solutionD = new Solution({
      strategy: 'testing456',
      cellInit: [11],
      updates: [updateD],
    })
    const solutionList = [solutionA, solutionC, solutionD]
    const updatedGrid = applySolution(sudokuGrid, solutionList)
    it('update all solutions consecutively and return new grid', function () {
      // check cell answer and type before solution
      // Solution A
      assert.sameOrderedMembers(sudokuGrid[40] as number[], [5])
      assert.isArray(sudokuGrid[40])
      // Solution B
      assert.sameOrderedMembers(sudokuGrid[54] as number[], [1, 3, 9])
      assert.isArray(sudokuGrid[54])
      assert.sameOrderedMembers(sudokuGrid[72] as number[], [1, 2, 3])
      assert.isArray(sudokuGrid[72])
      // Solution C
      assert.sameOrderedMembers(sudokuGrid[63] as number[], [2, 3])
      assert.isArray(sudokuGrid[63])
      assert.sameOrderedMembers(sudokuGrid[72] as number[], [1, 2, 3])
      assert.isArray(sudokuGrid[72])
      // Solution D
      assert.sameOrderedMembers(sudokuGrid[11] as number[], [2, 4, 7])
      assert.isArray(sudokuGrid[11])

      // check for succesful update of all solutions
      // Solution A
      assert.equal(updatedGrid[40], 5)
      assert.isNotArray(updatedGrid[40])
      // Solution C
      assert.equal(updatedGrid[63], 2)
      assert.isNotArray(updatedGrid[63])
      assert.sameOrderedMembers(updatedGrid[72] as number[], [1]) // this is technically incorrect for the puzzle, but works for testing
      assert.isArray(updatedGrid[72])
      // Solution D
      assert.equal(updatedGrid[11], 2)
      assert.isNotArray(updatedGrid[11])
    })
    it('check that related cell options have been narrowed for all solved cells', function () {
      assert.isTrue(getUniqueOpenValues(getRelCell(40), sudokuGrid).includes(5))
      assert.isNotTrue(
        getUniqueOpenValues(getRelCell(40), updatedGrid).includes(5)
      )

      assert.isTrue(getUniqueOpenValues(getRelCell(63), sudokuGrid).includes(2))
      assert.isNotTrue(
        getUniqueOpenValues(getRelCell(63), updatedGrid).includes(2)
      )

      assert.isTrue(getUniqueOpenValues(getRelCell(11), sudokuGrid).includes(2))
      assert.isNotTrue(
        getUniqueOpenValues(getRelCell(11), updatedGrid).includes(2)
      )

      // check that narrowing from multiple solutions has been applied
      // for Cell 38, remove 2 based on Solution D and remove 5 based on solution A
      assert.sameOrderedMembers(sudokuGrid[38] as number[], [2, 5, 6, 9])
      assert.sameOrderedMembers(updatedGrid[38] as number[], [6, 9])
    })
  })
})
