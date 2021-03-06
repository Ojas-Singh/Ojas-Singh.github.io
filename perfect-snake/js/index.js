"use strict";

// Adapted from https://johnflux.com/2015/05/02/nokia-6110-part-3-algorithms/
{
	(function () {

		// init map

		var init = function init() {
			snake.body.length = 0;
			map.init(10, 10);
			map.generate_r(-1, -1, 0, 0);
			map.generateTourNumber();
			snake.addHead(0, 0);
			snake.addHead(1, 0);
			snake.addHead(2, 0);
			food.add();
			if (!running) {
				running = true;
				run();
			}
		};

		// main loop

		var run = function run() {
			if (snake.body.length < map.size) requestAnimationFrame(run);else running = false;
			if (fullcpgrid || frame++ % 4 === 0) {
				snake.move(snake.nextDirection());
				ctx.clearRect(0, 0, canvasWidth, canvasHeight);
				map.draw();
			}
		};

		var map = {
			// init map

			init: function init(width, height) {
				var _this = this;

				this.width = width;
				this.height = height;
				this.size = width * height;
				this.scale = Math.min(canvasWidth, canvasHeight) / Math.max(this.width, this.height);
				// Hamiltonian Cycle

				// flags

				var _array2D = this.array2D(width, height, true);

				this.tour = _array2D[0];
				this.setTour = _array2D[1];

				var _array2D2 = this.array2D(width / 2, height / 2);

				this.isVisited = _array2D2[0];
				this.setVisited = _array2D2[1];

				var _array2D3 = this.array2D(width / 2, height / 2);

				this.canGoRight = _array2D3[0];
				this.setGoRight = _array2D3[1];

				var _array2D4 = this.array2D(width / 2, height / 2);

				this.canGoDown = _array2D4[0];
				this.setGoDown = _array2D4[1];

				var _array2D5 = this.array2D(width, height);

				this.isSnake = _array2D5[0];
				this.setSnake = _array2D5[1];

				this.canGoLeft = function (x, y) {
					if (x === 0) return false;
					return _this.canGoRight(x - 1, y);
				};
				this.canGoUp = function (x, y) {
					if (y === 0) return false;
					return _this.canGoDown(x, y - 1);
				};
			},

			// directions
			Left: 1,
			Up: 2,
			Right: 3,
			Down: 4,
			// flat 2D array
			array2D: function array2D(width, height, protect) {
				var data = new Uint16Array(width * height);
				return [function (x, y) {
					return data[x + width * y];
				}, protect ? function (x, y, value) {
					var i = x + width * y;
					if (!data[i]) data[i] = value;
				} : function (x, y, value) {
					data[x + width * y] = value;
				}];
			},

			// test snake collision
			collision: function collision(x, y) {
				if (x < 0 || x >= this.width) return true;
				if (y < 0 || y >= this.height) return true;
				return this.isSnake(x, y) !== 0;
			},

			// path distance
			distance: function distance(a, b) {
				if (a < b) return b - a - 1;else return b - a - 1 + this.size;
			},

			// Hamiltonian Cycle
			generate_r: function generate_r(fromx, fromy, x, y) {
				if (x < 0 || y < 0 || x >= this.width / 2 || y >= this.height / 2) return;
				if (this.isVisited(x, y)) return;
				this.setVisited(x, y, 1);
				if (fromx !== -1) {
					if (fromx < x) this.setGoRight(fromx, fromy, 1);else if (fromx > x) this.setGoRight(x, y, 1);else if (fromy < y) this.setGoDown(fromx, fromy, 1);else if (fromy > y) this.setGoDown(x, y, 1);
				}
				for (var i = 0; i < 2; i++) {
					var r = Math.floor(Math.random() * 4);
					switch (r) {
						case 0:
							this.generate_r(x, y, x - 1, y);
							break;
						case 1:
							this.generate_r(x, y, x + 1, y);
							break;
						case 2:
							this.generate_r(x, y, x, y - 1);
							break;
						case 3:
							this.generate_r(x, y, x, y + 1);
							break;
					}
				}
				this.generate_r(x, y, x - 1, y);
				this.generate_r(x, y, x + 1, y);
				this.generate_r(x, y, x, y + 1);
				this.generate_r(x, y, x, y - 1);
			},

			// find next direction in cycle
			findNextDir: function findNextDir(x, y, dir) {
				if (dir === this.Right) {
					if (this.canGoUp(x, y)) return this.Up;
					if (this.canGoRight(x, y)) return this.Right;
					if (this.canGoDown(x, y)) return this.Down;
					return this.Left;
				} else if (dir === this.Down) {
					if (this.canGoRight(x, y)) return this.Right;
					if (this.canGoDown(x, y)) return this.Down;
					if (this.canGoLeft(x, y)) return this.Left;
					return this.Up;
				} else if (dir === this.Left) {
					if (this.canGoDown(x, y)) return this.Down;
					if (this.canGoLeft(x, y)) return this.Left;
					if (this.canGoUp(x, y)) return this.Up;
					return this.Right;
				} else if (dir === this.Up) {
					if (this.canGoLeft(x, y)) return this.Left;
					if (this.canGoUp(x, y)) return this.Up;
					if (this.canGoRight(x, y)) return this.Right;
					return this.Down;
				}
				return -1; //Unreachable
			},

			// generate Hamiltonian Cycle
			generateTourNumber: function generateTourNumber() {
				var x = 0;
				var y = 0;
				var dir = this.canGoDown(x, y) ? this.Up : this.Left;
				var number = 0;
				do {
					var nextDir = this.findNextDir(x, y, dir);
					switch (dir) {
						case this.Right:
							this.setTour(x * 2, y * 2, number++);
							if (nextDir === dir || nextDir === this.Down || nextDir === this.Left) this.setTour(x * 2 + 1, y * 2, number++);
							if (nextDir === this.Down || nextDir === this.Left) this.setTour(x * 2 + 1, y * 2 + 1, number++);
							if (nextDir === this.Left) this.setTour(x * 2, y * 2 + 1, number++);
							break;
						case this.Down:
							this.setTour(x * 2 + 1, y * 2, number++);
							if (nextDir === dir || nextDir === this.Left || nextDir === this.Up) this.setTour(x * 2 + 1, y * 2 + 1, number++);
							if (nextDir === this.Left || nextDir === this.Up) this.setTour(x * 2, y * 2 + 1, number++);
							if (nextDir === this.Up) this.setTour(x * 2, y * 2, number++);
							break;
						case this.Left:
							this.setTour(x * 2 + 1, y * 2 + 1, number++);
							if (nextDir === dir || nextDir === this.Up || nextDir === this.Right) this.setTour(x * 2, y * 2 + 1, number++);
							if (nextDir === this.Up || nextDir === this.Right) this.setTour(x * 2, y * 2, number++);
							if (nextDir === this.Right) this.setTour(x * 2 + 1, y * 2, number++);
							break;
						case this.Up:
							this.setTour(x * 2, y * 2 + 1, number++);
							if (nextDir === dir || nextDir === this.Right || nextDir === this.Down) this.setTour(x * 2, y * 2, number++);
							if (nextDir === this.Right || nextDir === this.Down) this.setTour(x * 2 + 1, y * 2, number++);
							if (nextDir === this.Down) this.setTour(x * 2 + 1, y * 2 + 1, number++);
							break;
					}
					dir = nextDir;
					switch (nextDir) {
						case this.Right:
							++x;
							break;
						case this.Left:
							--x;
							break;
						case this.Down:
							++y;
							break;
						case this.Up:
							--y;
							break;
					}
				} while (number !== this.size);
			},

			// get next node
			getNext: function getNext(x, y, dir) {
				switch (dir) {
					case this.Left:
						if (x) return {
							x: x - 1,
							y: y
						};
						break;
					case this.Up:
						if (y) return {
							x: x,
							y: y - 1
						};
						break;
					case this.Right:
						return {
							x: x + 1,
							y: y
						};
						break;
					case this.Down:
						return {
							x: x,
							y: y + 1
						};
						break;
				}
				return {
					x: x,
					y: y
				};
			},

			// draw map
			draw: function draw() {
				ctx.beginPath();
				ctx.strokeStyle = "#fff";
				ctx.lineCap = "round";
				ctx.lineJoin = "round";
				ctx.lineWidth = this.scale * 0.5;
				for (var _iterator = snake.body, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
					var _ref;

					if (_isArray) {
						if (_i >= _iterator.length) break;
						_ref = _iterator[_i++];
					} else {
						_i = _iterator.next();
						if (_i.done) break;
						_ref = _i.value;
					}

					var b = _ref;

					ctx.lineTo(this.scale * 0.5 + b.x * this.scale, this.scale * 0.5 + b.y * this.scale);
				}
				ctx.stroke();
				if (snake.body.length < map.size - 1) {
					ctx.beginPath();
					ctx.fillStyle = "#f80";
					ctx.arc(this.scale * 0.5 + food.x * this.scale, this.scale * 0.5 + food.y * this.scale, 0.4 * this.scale, 0, 2 * Math.PI);
					ctx.fill();
				}
			}
		};

		// food object
		var food = {
			x: 0,
			y: 0,
			// add random food
			add: function add() {
				var emptyNodes = [];
				for (var x = 0; x < map.width; ++x) {
					for (var y = 0; y < map.height; ++y) {
						if (!map.collision(x, y)) emptyNodes.push({
							x: x,
							y: y
						});
					}
				}
				if (emptyNodes.length) {
					var p = emptyNodes[Math.floor(Math.random() * emptyNodes.length)];
					this.x = p.x;
					this.y = p.y;
				}
			}
		};

		// the snake
		var snake = {
			body: [],
			head: {
				x: 0,
				y: 0
			},
			removeTail: function removeTail() {
				var p = this.body.shift();
				map.setSnake(p.x, p.y, 0);
			},
			addHead: function addHead(x, y) {
				this.head.x = x;
				this.head.y = y;
				this.body.push({
					x: x,
					y: y
				});
				map.setSnake(x, y, 1);
			},
			move: function move(dir) {
				var next = map.getNext(this.head.x, this.head.y, dir);
				this.addHead(next.x, next.y);
				if (next.x === food.x && next.y === food.y) {
					food.add();
				} else this.removeTail();
			},

			// snake IA
			nextDirection: function nextDirection() {
				var x = this.head.x;
				var y = this.head.y;
				var pathNumber = map.tour(x, y);
				var distanceToFood = map.distance(pathNumber, map.tour(food.x, food.y));
				var distanceToTail = map.distance(pathNumber, map.tour(snake.body[0].x, snake.body[0].y));
				var cuttingAmountAvailable = distanceToTail - 4;
				var numEmptySquaresOnBoard = map.size - snake.body.length - 1;
				if (distanceToFood < distanceToTail) cuttingAmountAvailable -= 1;
				var cuttingAmountDesired = distanceToFood;
				if (cuttingAmountDesired < cuttingAmountAvailable) cuttingAmountAvailable = cuttingAmountDesired;
				if (cuttingAmountAvailable < 0) cuttingAmountAvailable = 0;
				var canGoRight = !map.collision(x + 1, y);
				var canGoLeft = !map.collision(x - 1, y);
				var canGoDown = !map.collision(x, y + 1);
				var canGoUp = !map.collision(x, y - 1);
				var bestDir = -1;
				var bestDist = -1;
				var dist = 0;
				if (canGoRight) {
					dist = map.distance(pathNumber, map.tour(x + 1, y));
					if (dist <= cuttingAmountAvailable && dist > bestDist) {
						bestDir = map.Right;
						bestDist = dist;
					}
				}
				if (canGoLeft) {
					dist = map.distance(pathNumber, map.tour(x - 1, y));
					if (dist <= cuttingAmountAvailable && dist > bestDist) {
						bestDir = map.Left;
						bestDist = dist;
					}
				}
				if (canGoDown) {
					dist = map.distance(pathNumber, map.tour(x, y + 1));
					if (dist <= cuttingAmountAvailable && dist > bestDist) {
						bestDir = map.Down;
						bestDist = dist;
					}
				}
				if (canGoUp) {
					dist = map.distance(pathNumber, map.tour(x, y - 1));
					if (dist <= cuttingAmountAvailable && dist > bestDist) {
						bestDir = map.Up;
						bestDist = dist;
					}
				}
				if (bestDist >= 0) return bestDir;
				if (canGoUp) return map.Up;
				if (canGoLeft) return map.Left;
				if (canGoDown) return map.Down;
				if (canGoRight) return map.Right;
				return map.Right;
			}
		};

		// init canvas
		var canvas = document.getElementById("c");
		var ctx = canvas.getContext('2d');
		var canvasWidth = canvas.width = 600;
		var canvasHeight = canvas.height = 600;
		canvas.onclick = init;
		var running = false;
		var frame = 0;
		var fullcpgrid = window.location.href.indexOf("fullcpgrid") > -1;

		init();
	})();
}