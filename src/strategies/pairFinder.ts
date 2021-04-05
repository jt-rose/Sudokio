// Find all groupings of unique combinations by group length, ignoring order
// Ex: unique pairs of [1,2,3,4] => [1,2], [1,3], [1,4], [2,3], [2,4], [3,4]
// this works on either any[] or nested any[][]
// Ex: pairs of [[1,2], [3,4], [5,6]] => [[[1,2], [3,4]], [[1,2], [5,6]], [[3,4], [5,6]]]

type FindGroups = (update: any[][], counter: number) => FindGroups | any[][]

export const findGroups = (groupLength: number) => (base: any[]) => {
  // convert array of any[] to any[][]
  const initialPairings = base.flatMap((x, i) =>
    base.slice(i + 1).map((y) => [x, y])
  )
  const fn: FindGroups = (update, counter) => {
    if (counter === groupLength) {
      return update
    }
    const updateArray = update.flatMap((x) =>
      base.slice(base.indexOf(x[x.length - 1]) + 1).map((y) => [...x, y])
    )
    return fn(updateArray, counter + 1)
  }
  return fn(initialPairings, 2)
}

export const pairs = findGroups(2)
export const triples = findGroups(3)
export const quads = findGroups(4)
