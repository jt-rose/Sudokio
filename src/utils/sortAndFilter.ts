import { Solution } from './solutionObject'

/* ------------------------- filterBestSingleOption ------------------------- */

// pick the simplest singleOption solutions available from the current set
// (multiple can be selected if equally good)
function filterBestSingleOption(solutionList: Solution[]) {
  // find solutions that only require checking a single parameter
  // Ex: (row, column, box), and don't require narrowing options
  // by previously using a more advanced strategy
  const onlySingleParam = solutionList.filter((x) =>
    x.strategy.match(/MultiParam|Narrowing/)
  )

  if (onlySingleParam.length > 0) {
    return onlySingleParam
  }
  // if none above, find solutions that solve with multiple parameters
  // but no advanced narrowing
  const onlyMultiParam = solutionList.filter((x) =>
    x.strategy.match(/Narrowing/)
  )

  if (onlyMultiParam.length > 0) {
    return onlyMultiParam
  }
  // else, simply return what was found
  return solutionList
}

/* ----------------------------- filterBestChain ---------------------------- */

function filterBestChain(solutionList: Solution[]) {
  // find the solutions that required the least sweeps of a chain function
  const allTotalRounds = solutionList.map(
    (solution) => solution.totalChainRounds
  ) as number[]
  const leastRounds = Math.min(...allTotalRounds)
  const solutionsWithLeastRounds = solutionList.filter(
    (solution) => solution.totalChainRounds === leastRounds
  )
  if (solutionsWithLeastRounds.length === 1) {
    return solutionsWithLeastRounds[0]
  }
  // if more than one were found with the lowest amount of sweeps,
  // prioritize those with higher amounts of updates
  const allUpdateAmounts = solutionsWithLeastRounds.map(
    (solution) => solution.updates.length
  )
  const mostUpdates = Math.max(...allUpdateAmounts)
  const solutionsWithMostUpdates = solutionsWithLeastRounds.filter(
    (solution) => solution.updates.length === mostUpdates
  )
  return solutionsWithMostUpdates[0]
}

/* ------------------------------- filterBest ------------------------------- */

// pick the best solution from list of those currently possible
export function filterBest(solutionList: Solution[]) {
  if (solutionList.length === 1) {
    return solutionList[0]
  }
  //"singleOption" solution will be attempted first
  // and be at start of solutionList if found
  // this will prioritize some singleOption answers over others
  if (solutionList[0].strategy.match('singleOption')) {
    return filterBestSingleOption(solutionList as Solution[])
  }
  if (solutionList[0].strategy.match('singleParam')) {
    return solutionList[0]
  }
  // from a list of possible chains, prioritize easiest to find,
  // followed by most helpful
  if (solutionList[0].strategy.match('Chain')) {
    return filterBestChain(solutionList as Solution[])
  }
  // check for which, if any, of the solutions found solve more cells than another
  const highestSolved = Math.max(...solutionList.map((x) => x.solved.length))
  const mostSolved = solutionList.filter(
    (x) => x.solved.length === highestSolved
  )
  if (mostSolved.length === 1) {
    return mostSolved[0]
  }

  // check for greater amount of narrowing if none were solved
  const highestNarrowed = Math.max(...mostSolved.map((x) => x.narrow.length))
  const mostNarrowed = mostSolved.filter(
    (x) => x.narrow.length === highestNarrowed
  )
  if (mostNarrowed.length === 1) {
    return mostNarrowed[0]
  }

  // if same amount of narrowing, then prioritize narowing cells that
  // are closer to being solved
  const proximityToSolve = mostNarrowed.map((item) =>
    item.narrow.reduce((sum, current) => sum + current.updatedAnswer.length, 0)
  )

  const leastLeft = proximityToSolve.indexOf(Math.min(...proximityToSolve))
  return mostNarrowed[leastLeft]
}

/* -------------------------------- sortBest -------------------------------- */

type SortBest = (
  solutionList: Solution[],
  sortedList: (Solution | Solution[])[]
) => SortBest | (Solution | Solution[])[]
// returns full solutionList, but sorted in order of filterBest results
const sortBestUC: SortBest = (solutionList, sortedList = []) => {
  // if all solutions have been sorted and removed from original solutionList,
  // return the completed sortedList
  if (solutionList.length === 0) {
    return sortedList
  }
  // find best current solution(s), remove from solutionList, and add to sortedList
  // before recursively calling sortBest to advance to next best solution
  const currentBestOption = filterBest(solutionList)
  const updatedSolutionList = Array.isArray(currentBestOption)
    ? solutionList.filter((x) => !currentBestOption.includes(x))
    : solutionList.filter((x) => currentBestOption !== x)
  const updatedSortedList = [...sortedList, currentBestOption]
  return sortBestUC(updatedSolutionList, updatedSortedList)
}

export const sortBest = (solutionList: Solution[]) =>
  sortBestUC(solutionList, [])
