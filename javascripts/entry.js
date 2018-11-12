
let C, svg, bezierSVG, ctx, h, w;
let head = null;
let prevPoint = null;

document.addEventListener('DOMContentLoaded',()=>{
  C = document.getElementById('c');
  svg = document.getElementById('overlay');
  bezierSVG = document.getElementById('bezier');
  ctx = C.getContext('2d');
  window.addEventListener('resize',resize);
  resize();

  svg.addEventListener('mousedown',e=>{
    if (active && active === head && head.data.next.point){
       unshiftPoint(e)
    } else {
      pushPoint(e)
    }
    refreshBez();
  })

  document.getElementById('getBez').addEventListener('click',buttonListener);
})


const buttonListener = e => {
  window.cancelAnimationFrame(frame);
  const curve = bezier(getPoints(),true);
  C.style['z-index'] = 3;
  deactivate();

  let p = [null];
  let segments = 100;
  let lines = [];
  let i = 0;

    const step = () => {
      ctx.clearRect(0,0,w,h);
      const nxt = curve(i/segments);
      if (i === 0){
        bezierSVG.setAttribute('d', `M ${nxt.x} ${nxt.y}`)
      } else{
        const path = bezierSVG.getAttribute('d');
        bezierSVG.setAttribute('d', `${path} L ${nxt.x} ${nxt.y}`)
      }
      i++;
      if (i <= segments){
        frame = window.requestAnimationFrame(step);
      } else {
        p = [null];
        lines = [];
        i = 0;
        ctx.clearRect(0,0,w,h);
        refreshBez();
        C.style['z-index'] = 1;
     }
  }
 frame = window.requestAnimationFrame(step);
}

const resize = () => {
  h = window.innerHeight;
  w = window.innerWidth;
  C.height = h
  C.width = w
  svg.setAttribute('height', h);
  svg.setAttribute('width', w);
  svg.setAttribute('viewbox', `0 0 ${w} ${h}`);
}

const L = (p0, p1, options) => {
  const style = {strokeStyle: 'white', lineWidth: .5};
  if (options) Object.assign(style, options);
  ctx.beginPath();
  ctx.moveTo(p0.x,p0.y);
  ctx.lineTo(p1.x,p1.y);
  Object.assign(ctx, style);
  ctx.stroke();
}

const P = (p, options) => {
  const style = {
    strokeStyle: 'white',
    lineWidth: .5,
    fillStyle: 'white'
  };
  if (options) Object.assign(style, options);
  ctx.beginPath();
  ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
  Object.assign(ctx, style);
  ctx.stroke();
  ctx.fill();
}

const bezier = (arr, track=false) => t => {
  let count = 0;

  const _bezier = arr => t => {
    if (arr.length === 1){
      if (track) P(arr[0]);
      return arr[0]
    }
    const result = [];
    if (track) P(arr[0])
    for (let i=0; i<arr.length-1; i++){
      const p0 = arr[i];
      const p1 = arr[i+1];
      const x = p0.x + (p1.x - p0.x)*t;
      const y = p0.y + (p1.y - p0.y)*t;

      if (track){
        L(p0,p1);
        P(p1);
      }
      result.push({x,y});
    }
  count++;
  return _bezier(result,track)(t);
  }

  return _bezier(arr)(t);
}

const get = el => document.createElementNS('http://www.w3.org/2000/svg',el);

const set = (el,obj) => {
  const keys = Object.keys(obj);
  keys.forEach(key=>el.setAttribute(key, obj[key]))
}

const setLine = (lineGroup,obj) => {
  const lines =
        Array.from(lineGroup.getElementsByTagName('line'));
  lines.forEach(line => set(line,obj));
}

const initLine = (xL,x,yL,y) => {

  const line1 = get('line');
  const line2 = get('line');
  line1.classList.add('vizLine');
  line2.classList.add('hidLine');

  const g = get('g');
  g.classList.add('lineGroup');

  g.data = {};
  g.appendChild(line2);
  g.appendChild(line1);

  setLine(g,{ x1: xL, x2: x, y1: yL, y2: y });
  return g;
}

const setLineClick = line => {
  line.addEventListener('mousedown',e=>{
      e.preventDefault();
      e.stopPropagation();
      const p1 = line.data.start
      const p2 = line.data.end
      const m = (p2.y - p1.y)/(p2.x - p1.x);
      const x = (m * (e.clientY - p1.y) + m * m * p1.x + e.clientX)/(m * m + 1);
      const y = m * (x - p1.x) + p1.y;
      const pNew = initPoint(Math.round(x),Math.round(y));
      setDrag(pNew);
      dragEvent(pNew)(e);
      pNew.data.prev.point = line.data.start;
      pNew.data.prev.line = line;
      pNew.data.next.point = line.data.end;
      line.data.start.data.next.point = pNew;
      line.data.end.data.prev.point = pNew;


      const last = getCoords(line.data.end);
      const lNew = initLine(x, last.x, y, last.y);

      setLineClick(lNew);
      lNew.data.start = pNew;
      lNew.data.end = line.data.end;
      ghost(lNew);
      line.data.end.data.prev.line = lNew;
      document.getElementById('lines').appendChild(lNew);

      pNew.data.next.line = lNew;
      line.data.end = pNew;
      setLine(line,{ x2: x, y2: y })

      document.getElementById('points').appendChild(pNew);
      refreshBez();
    })
}

const pushPoint = e => {
  const { top, left } = C.getBoundingClientRect();
  const yNxt = e.clientY - top;
  const xNxt = e.clientX - left;

  const p = initPoint(xNxt,yNxt);
  setDrag(p);

  if (prevPoint){
    const { x, y } = getCoords(prevPoint);
    const line = initLine(x,xNxt,y,yNxt);
    line.data.start = prevPoint;
    line.data.end = p;
    setLineClick(line);
    ghost(line);

    p.data.prev.line = line;
    p.data.prev.point = prevPoint;
    prevPoint.data.next.line = line;
    prevPoint.data.next.point = p;

    document.getElementById('lines').appendChild(line);

  }else{
    head = p;
  }
  prevPoint = p;

  document.getElementById('points').appendChild(p);
}



const initPoint = (x,y) => {
  const p = get('circle');
  p.classList.add('point');
  const outline = get('circle');
  outline.classList.add('pointSelector');
  const pointGroup = get('g');
  pointGroup.classList.add('pointGroup');
  const t = get('text');

  set(t,{
    fill: 'white',
    class: 'svg-txt',
    x: 15,
    y: 5})
  t.textContent = 'hello';

  set(p,{
    r: 4,
    fill: 'white'
  });

  set(outline,{
    r: 10,
    stroke: 'white',
    'stroke-width': .5,
    fill: 'transparent'
  });

  set(pointGroup,{
    transform: `translate(${x},${y})`
  })

  pointGroup.data = {};
  pointGroup.data.prev = {};
  pointGroup.data.next = {};
  activate(pointGroup);
  pointGroup.appendChild(p);
  pointGroup.appendChild(outline);
  pointGroup.appendChild(t);
  setCoords(pointGroup,{x,y});
  return pointGroup;
}

getCoords = pointGroup => {
  const x = pointGroup.x
  const y = pointGroup.y
  return {x, y};
}

setCoords = (pointGroup, coords) => {
  Object.assign(pointGroup, coords);
  pointGroup.setAttribute('transform', `translate(${coords.x},${coords.y})`);
  pointGroup.getElementsByTagName('text')[0].textContent = `(${coords.x}, ${coords.y})`;
}





const dragEvent = p => e => {
  ctx.clearRect(0,0,w,h);
  activate(p);
  refreshBez();

  e.preventDefault();
  e.stopPropagation();
  let [x, y] = [e.clientX, e.clientY];

  const drag = e => {
    e.preventDefault();
    e.stopPropagation();
    const dX = e.clientX - x;
    const dY = e.clientY - y;

    const coords = getCoords(p);
    let xP = +coords.x;
    let yP = +coords.y;

    const {top, bottom, left, right} = C.getBoundingClientRect();

    if (x < right && x > left){
      xP += dX;
      if (xP > w){ xP = w }else if (xP < 0){ xP = 0}
    }

    if (y < bottom && y > top){
      yP += dY;
      if (yP > h){ yP = h }else if (yP < 0){ yP = 0}
    }

    setCoords(p,{x: xP, y: yP});

    if (p.data.next.line){
      setLine(p.data.next.line,{x1: xP, y1: yP})
    }

    if (p.data.prev.line){
      setLine(p.data.prev.line,{x2: xP, y2: yP})
    }

    refreshBez();
    [x, y] = [e.clientX, e.clientY];
  }


  document.addEventListener('mousemove',drag);
  document.addEventListener('mouseup',()=>{
    e.preventDefault();
    e.stopPropagation();
    document.removeEventListener('mousemove',drag)
  },{once:true});
}

const setDrag = p => {
  p.addEventListener('mousedown', dragEvent(p));
}


const unshiftPoint = e => {
  const { top, left } = C.getBoundingClientRect();
  const yNxt = e.clientY - top;
  const xNxt = e.clientX - left;
  const p = initPoint(xNxt,yNxt);
  setDrag(p);
  const {x, y} = getCoords(head);
  const l = initLine(xNxt, x, yNxt, y);
  setLineClick(l);

  head.data.prev.point = p;
  head.data.prev.line = l;
  l.data.start = p;
  l.data.end = head;
  p.data.next.point = head;
  p.data.next.line = l;
  head = p;
  document.getElementById('lines').appendChild(l);
  document.getElementById('points').appendChild(p);
  ghost(l);
}

const refreshBez = () => {
  ctx.clearRect(0,0,w,h);
  const points = getPoints();
  if (points.length > 1){
    const bez = bezier(points,false);
    bezierSVG.setAttribute('d',`M ${points[0].x} ${points[0].y}`)
    for (let i=1; i<=100; i++){
      const p = bez(i/100);
      const path = bezierSVG.getAttribute('d');
      bezierSVG.setAttribute('d',`${path} ${p.x} ${p.y}`)
    }
  }
}


const getPoints = () => {
  let node = head;
  const points = [];
  while (node) {
    points.push(getCoords(node));
    node = node.data.next.point;
  }
  return(points);
}


let frame;


let active = null;
const activate = point => {
  deactivate();
  active = point;
  point.classList.add('active');
}

const deactivate = () => {
  if (active){
    active.classList.remove('active');
    active = null;
  }
}

document.addEventListener('keydown',e=>{
  //todo un-nest the points and lines?
  //todo remove the 'data' nesting?
  if (e.key !== 'Backspace') return;
  const nxt = active.data.next;
  const prv = active.data.prev;
  if (prv.point && nxt.point){
     nxt.point.data.prev = prv;
     prv.point.data.next = nxt;
     document.getElementById('lines').removeChild(nxt.line);
     const {x,y} = getCoords(nxt.point);
     setLine(prv.line,{x2: x, y2: y})
     prv.line.data.end = nxt.point;
     prv.point.data.next.line = prv.line;
  }else if (nxt.point && !prv.point){
    head = nxt.point;
    nxt.point.data.prev = {};
    document.getElementById('lines').removeChild(nxt.line);
  }else if (prv.point && !nxt.point){
    prevPoint = prv.point;
    prv.point.data.next = {};
    document.getElementById('lines').removeChild(prv.line);
  }else if (!prv.point && !nxt.point){
    prevPoint = null
  }
  document.getElementById('points').removeChild(active);
  refreshBez();
  active = null;
})



const ghost = line => {
  const p = get('circle');
  line.addEventListener('mouseleave',()=>{
    line.removeChild(p);
  })
  line.addEventListener('mouseenter',e=>{
    const p1 = line.data.start
    const p2 = line.data.end
    const m = (p2.y - p1.y)/(p2.x - p1.x);
    const x = (m * (e.clientY - p1.y) + m * m * p1.x + e.clientX)/(m * m + 1);
    const y = m * (x - p1.x) + p1.y;
    set(p,{
      r: 4,
      fill: 'red',
      transform: `translate(${x}, ${y})`
    })

    line.addEventListener('mousemove',e=>{
      const p1 = line.data.start
      const p2 = line.data.end
      const m = (p2.y - p1.y)/(p2.x - p1.x);
      const x = (m * (e.clientY - p1.y) + m * m * p1.x + e.clientX)/(m * m + 1);
      const y = m * (x - p1.x) + p1.y;
      set(p,{transform: `translate(${x},${y})`})
    })
    line.insertBefore(p, line.firstChild);
  })
}
