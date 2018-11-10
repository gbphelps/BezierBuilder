const bezier = arr => t => {
  let count = 0;
  let derivative = null;
  const _bezier = arr => t => {
    if (arr.length === 2) derivative = (arr[1].y - arr[0].y)/(arr[1].x - arr[0].x);
    if (arr.length === 1) return arr[0]
    const result = [];
    for (let i=0; i<arr.length-1; i++){
      const p0 = arr[i];
      const p1 = arr[i+1];
      const x = p0.x + (p1.x - p0.x)*t;
      const y = p0.y + (p1.y - p0.y)*t;
      result.push({x,y});
    }
  count++;
  return _bezier(result)(t);
  }
  return _bezier(arr)(t);
}


const sq = x => x * x;
const findEndpoint = (bez, t0, length) => {
  const p0 = bez(t0);
  const p1 = bez(1);
  const range = 1 - t0;
  const dX = (p1.x - p0.x)/range;
  const dY = (p1.y - p0.y)/range;
  const tNew = t0 + Math.sqrt(sq(length)/(sq(dX) + sq(dY)));
  const pActual = bez(tNew);
}
