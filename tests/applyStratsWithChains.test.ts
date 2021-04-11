import solveWithStandardOptions from '../src/solver/applyStratsWithChains'
import { assert } from 'chai'
import { applyStratsUntilDone, GridUpdate } from '../src/solver/applyStrats'
import { xChainGrid } from './gridSamplesForTesting'
import { Solution } from '../src/utils/solutionObject'

describe('Solve puzzle using standard options, including X-chain', function () {
  it('Found X-chain solution when no others will make progress', function () {
    const attemptWithoutChains = applyStratsUntilDone()(
      xChainGrid
    ) as GridUpdate
    assert.equal(attemptWithoutChains.solved, false)
    const withoutChainsStrategiesFound = (attemptWithoutChains.solutions as Solution[]).map(
      (x) => x.strategy
    )
    assert.isNotTrue(withoutChainsStrategiesFound.includes('X-Chain'))

    const attemptWithChains = solveWithStandardOptions(xChainGrid) as GridUpdate
    assert.equal(attemptWithChains.solved, true)
    const withChainsStrategiesFound = (attemptWithChains.solutions as Solution[]).map(
      (x) => x.strategy
    )
    assert.isTrue(withChainsStrategiesFound.includes('X-Chain'))
  })
})
