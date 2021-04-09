import {
  fullStrategyList,
  applyStrats,
  applyStratsUntilDone,
} from './applyStrats'
/*
// functions for applyStrats with chains added in
export const strategyListWithChains = {
    ...strategyList,
    solveXChainFullGrid
};
*/
const applyStratsWithChains = applyStrats(Object.values(fullStrategyList))

// attempts to fully solve grid, using variety of human strategies
// while searching for the easiest and most effective solutions
// each round.
const solveWithStandardOptions = applyStratsUntilDone(applyStratsWithChains)

export default solveWithStandardOptions
