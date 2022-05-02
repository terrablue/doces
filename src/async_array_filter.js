export default async (array, filter) => 
  (await Promise.all(array.flatMap(async n => await filter(n) ? [n] : [])))
    .flat();

