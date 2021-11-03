let vm = new Vue({
  el: 'main',
  data: {
    n: 4,
    d: 3,
    rn: 3,
    rd: 4,
    c: false,
    t: 5,
    r: false,
    code: '',
    clr: 18
  },
  computed: {
    reduced_n: function() {
      return this.reduce(this.n, this.d).n
    },
    reduced_d: function() {
      return this.reduce(this.n, this.d).d
    }
  },
  methods: {
    clear: function() {
      this.c = false
      this.r = false
      this.code = ''
      _p.setAttribute('points', '');
      draw()
      style.setProperty('--a', this.t * 1000)
    },
    getNumbers: function(target) {
      let rect = {}
      if (target) {
        rect = target.getBoundingClientRect()
        rect.cx = (rect.left + (rect.width / 2))
        rect.cy = (rect.top + (rect.height / 2))
      }
      return rect
    },
    reduce: function(n, d) {
      // from: http://stackoverflow.com/questions/4652468/is-there-a-javascript-function-that-reduces-a-fraction
      let gcd = function(a, b) {
        return b ? gcd(b, a % b) : a
      }
      gcd = gcd(n, d)
      return {n: n/gcd, d: d/gcd}
    }
  }
})

let style = document.documentElement.style
let _n = document.getElementById('n')
let _d = document.getElementById('d')
let _s = document.querySelector('svg')
let _p = _s.querySelector('polyline')
let _c = _s.querySelector('circle')
let _h = _s.querySelector('line.h')
let _v = _s.querySelector('line.v')

let draw = () => {
  let n = vm.getNumbers(_n.querySelector('span'))
  let d = vm.getNumbers(_d.querySelector('span'))
  let x = Math.round(2000 * (d.cx / _n.clientWidth) - 2000)
  let y = Math.round(2000 * (n.cy / _d.clientWidth))
  let p = _s.createSVGPoint()
  vm.clr = vm.clr > 360 ? 0 : vm.clr
  p.x = x
  p.y = y
  _p.points.appendItem(p)
  _h.setAttribute('y1', y)
  _h.setAttribute('y2', y)
  _v.setAttribute('x1', x)
  _v.setAttribute('x2', x)
  _c.setAttribute('cx', x)
  _c.setAttribute('cy', y)
  if(vm.c) {
    style.setProperty('--clr', vm.clr++)
    setTimeout(draw, 25)
  }
}

Vue.nextTick(function() {
  draw()
})

vm.$watch('c', function (c) {
  _n.style.setProperty('--i', (c?vm.reduced_n:0))
  _d.style.setProperty('--i', (c?vm.reduced_d:0))
  if(c) {
    vm.r = true
    style.setProperty('--a', vm.t * 1000)
    style.setProperty('--r', 0)
    draw()
  }
})

vm.$watch('t', vm.clear)

_n.addEventListener('animationend', (e) => {
  vm.c = false
  vm.code = _p.getAttribute('points')
},false)