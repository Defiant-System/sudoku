
let level = 1,
	sections = [],
	gameOver = false,
	displayOnlyAvailable = true,
	countSquares = [35, 34, 31, 29];

const sudoku = {
	init() {
		// fast references
		this.content = window.find("content");
		this.gameboard = window.find(".gameboard");
		this.focusEl = window.find(".focus");
		this.hintFaultEl = window.find(".hint_fault");
		this.hintTryEl = window.find(".hint_try");

		// bind event handlers
		this.gameboard.on("mouseover mouseout", ".box", this.dispatch);

		this.dispatch({type: "set-game-level", arg: level});
		//this.showHint();
	},
	dispatch(event) {
		let self = sudoku,
			index,
			col,
			row,
			el;
		switch (event.type) {
			// native events
			case "mouseover":
				el = $(this);
				index = el.index();
				col = parseInt(index / 9);
				row = index % 9;
				
				for (let i=0; i<9; i++) {
					self.boxes.get(col * 9 + i).addClass("hover");
					self.boxes.get(i * 9 + row).addClass("hover");
				}
				el.removeClass("hover");
				break;
			case "mouseout":
				self.boxes.removeClass("hover");
				break;
			// custom events
			case "open-help":
				defiant.shell("fs -u '~/help/index.md'");
				break;
			case "focus-box":
				if (gameOver) return;
				el = $(event.target);
				if (!el.hasClass("box")) el = el.parent();
				self.focusSquare(el);
				break;
			case "select-nr":
				el = $(event.target);
				self.selectNumber(el);
				break;
			case "show-hint":
				this.showHint();
				break;
			case "toggle-available":
				this.toggleOnlyAvailable();
				break;
			case "solve":
				this.solve();
				break;
			case "clear-user-numbers":
				this.clearUserNumbers();
				break;
			case "help":
				this.help();
				break;
			case "set-game-level":
				level = event.arg || 1;
				/* fall through */
			case "new-game":
				self.hideHints(true);
				gameOver = false;
				self.gameboard.html("");
				self.drawBoard();

				self.content.prop({className: "level-"+ level});
				break;
		}
	},
	drawBoard() {
		let secs = [],
			matrix = [],
			number,
			row1,
			row2,
			col1,
			col2,
			tmpMatrix,
			tmpMatrixValue;

		for (let y=0; y<9; y++) {
			secs[y] = [];
			matrix[y] = [];
			for (let x=0; x<9; x++) {
				number = x / 1 + 1 + (y * 3) + Math.floor(y / 3) % 3;
				number = (number > 9) ? number % 9 : number ;
				number = (number == 0) ? 9 : number ;
				matrix[y][x] = number;
			}
		}
		for (let n1=0; n1<9; n1+=3) {
			for (let n2=0; n2<3; n2++) {
				row1 = Math.floor(Math.random() * 3);
				row2 = Math.floor(Math.random() * 3);
				while (row2 === row1) {
					row2 = Math.floor(Math.random() * 3);
				}
				row1 = row1 + n1;
				row2 = row2 + n1;
				tmpMatrix = [];
				tmpMatrix = matrix[row1];
				matrix[row1] = matrix[row2];
				matrix[row2] = tmpMatrix;
			}
		}
		for (let n1=0; n1<9; n1+=3) {
			for (let n2=0; n2<3; n2++) {
				col1 = Math.floor(Math.random() * 3);
				col2 = Math.floor(Math.random() * 3);
				while (col2 === col1) {
					col2 = Math.floor(Math.random() * 3);
				}
				col1 = col1 + n1;
				col2 = col2 + n1;
				tmpMatrix = [];

				for (let n3=0; n3<matrix.length; n3++) {
					tmpMatrixValue = matrix[n3][col1];
					matrix[n3][col1] = matrix[n3][col2];
					matrix[n3][col2] = tmpMatrixValue;
				}
			}	
		}

		matrix.map((x, xI) => {
			x.map((y, yI) => {
				let box = this.gameboard.append(`<div class="box" _nr="${matrix[xI][yI]}"></div>`);
				secs[parseInt(xI / 3) + parseInt(yI / 3)].push(box);
			});
		});

		sections[0] = secs[0];
		sections[1] = secs[1].slice(0, 9);
		sections[2] = secs[2].slice(0, 9);
		sections[3] = secs[1].slice(9);
		sections[4] = secs[2].slice(9, 18);
		sections[5] = secs[3].slice(0, 9);
		sections[6] = secs[2].slice(18);
		sections[7] = secs[3].slice(9);
		sections[8] = secs[4];

		for (let y=0; y<9; y++) {
			for (let x=0; x<9; x++) {
				sections[y][x].attr({"_sId": y});
			}
		}

		this.boxes = this.gameboard.find(".box");

		this.showColumnsInGroup();
	},
	showColumnsInGroup() {
		let cellsRevealed = [],
			numberArray = [],
			groupCountArray = [],
			maxInGroup = 5,
			row,
			col,
			obj;

		if (level <= 0) level = 1;
		if (level == 1) maxInGroup = 4;

		for (let no=0; no<countSquares[level-1]; no++) {			
			do {
				row = Math.floor(Math.random() * 9);
				col = Math.floor(Math.random() * 9);
				obj = this.boxes.get((row * 9) + col);
				if (!numberArray[obj.attr("_nr")]) {
					numberArray[obj.attr("_nr")] = 0;
				}
				if (!groupCountArray[obj.attr("_sId")]) {
					groupCountArray[obj.attr("_sId")] = 0;
				}
			} while (cellsRevealed[row + "_" + col] 
					|| numberArray[obj.attr("_nr")] > (3 + Math.ceil(level/2))
					|| groupCountArray[obj.attr("_sId")] >= maxInGroup);
			
			cellsRevealed[row + "_" + col] = true;

			if (!numberArray[obj.attr("_nr")]) {
				numberArray[obj.attr("_nr")] = 0;
			}
			numberArray[obj.attr("_nr")]++;
			groupCountArray[obj.attr("_sId")]++;
			obj.addClass("pnr").html(obj.attr("_nr"));
		}
	},
	focusSquare(boxEl) {
		this.hideHints();
		if (boxEl.hasClass("pnr")) return;
		
		let state = displayOnlyAvailable ? "none" : "" ;
		
		this.focusEl.find("> span").css({display: "block"});
		this.focusEl.find(".opt_none").css({display: "none"});
		
		let row = parseInt(boxEl.index() / 9),
			group = this.gameboard.find(`div[_sId="${boxEl.attr("_sId")}"]`),
			col = boxEl.index() % 9,
			boxes = this.boxes,
			el,
			value,
			d = 0;

		for (let y=0; y<9; y++) {
			el = boxes.get(row * 9 + y);
			value = el.html();
			if (value) {
				this.focusEl.find(".opt_"+ value).css({display: state});
			}
		}
		for (let y=0; y<9; y++) {
			el = boxes.get(y * 9 + col);
			value = el.html();
			if (value) {
				this.focusEl.find(".opt_"+ value).css({display: state});
			}
		}

		group.map((el, elIndex) => {
			let value = el.innerHTML;
			if (value) {
				this.focusEl.find(".opt_"+ value).css({display: state});
			}
		});

		group = this.focusEl.find("span");
		for (let i=0; i<10; i++) {
			if (group.get(i).css("display") === "block") d++;
		}

		if (d == 0 && displayOnlyAvailable) {
			this.focusEl.find(".opt_none").css({display: "block"});
		}

		if (this.focusEl) {
			this.focusEl.removeClass("appear disappear");
		}
		this.focusEl.css({
			//display: "block",
			top: boxEl.prop("offsetTop") +"px",
			left: boxEl.prop("offsetLeft") +"px",
		});
		this.focusEl.addClass("appear");
		this.focusBox = boxEl.addClass("focused");
	},
	selectNumber(nrEl) {
		if (!this.focusBox) return;

		let value = nrEl.html();
		value = value != +value ? "" : value;

		this.focusBox.removeClass("focused").addClass("unr").html(value);
		this.focusEl.removeClass("appear").addClass("disappear");
		
		this.isGameOver();
	},
	isGameOver() {
		let all_ok = true;

		this.gameboard.find(".box").map(item => {
			if (+item.innerHTML != +item.getAttribute("_nr")) {
				all_ok = false;
			}
		});

		if (all_ok) {
			alert("Congratulations! You solved it");
		}
	},
	hideHints(hide_focus) {
		if (hide_focus) {
			this.focusEl.removeClass("appear").addClass("disappear");
		}
		this.hintFaultEl.addClass("hidden").removeClass("arrow-left arrow-right");
		this.hintTryEl.addClass("hidden").removeClass("arrow-left arrow-right");
	},
	showHint() {
		this.hideHints(true);

		let objectToTry = false,
			maxExistingNo = 0,
			nrs = this.gameboard.find(".box"),
			existingNumbers,
			arrow,
			top,
			left;

		for (let i=0; i<nrs.length; i++) {
			if (nrs.get(i).html() !== "" && +nrs.get(i).attr("_nr") !== +nrs.get(i).html()) {
				top = nrs[i].offsetTop + 15;
				
				if ((window.width / 2) > nrs[i].offsetLeft) {
					arrow = "left";
					left = nrs[i].offsetLeft + nrs[i].offsetWidth;
				} else {
					arrow = "right";
					left = nrs[i].offsetLeft - this.hintFaultEl[0].offsetWidth;
				}

				this.hintFaultEl.removeClass("hidden").addClass("arrow-"+ arrow).css({
					top: top +"px",
					left: left +"px",
				});
				return;
			}
			existingNumbers = this.getPossibleNumbers(nrs[i]);
			if (existingNumbers > maxExistingNo) {
				maxExistingNo = existingNumbers;
				objectToTry = nrs[i];
			}
		}
		if (objectToTry) {
			top = objectToTry.offsetTop + 15;

			if ((window.width / 2) > objectToTry.offsetLeft) {
				arrow = "left";
				left = objectToTry.offsetLeft + objectToTry.offsetWidth;
			} else {
				arrow = "right";
				left = objectToTry.offsetLeft - this.hintTryEl[0].offsetWidth;
			}

			this.hintTryEl.removeClass("hidden").addClass("arrow-"+ arrow).css({
				top: top +"px",
				left: left +"px",
			});
		}
	},
	getPossibleNumbers(box) {
		let noArray = [],
			countNumbers = 0,
			subDivs,
			srcIndex,
			boxes = this.boxes,
			row,
			col,
			obj;
		
		if (+box.getAttribute("_nr") == +box.innerHTML) return 0;
		
		subDivs = this.gameboard.find(`.box[_sId="${box.getAttribute("_sId")}"]`);
		for (let no=0; no<subDivs.length; no++) {
			if (subDivs[no] != box) {
				let item = subDivs[no];
				if (+box.getAttribute("_nr") == +item.innerHTML || item.className) {
					if (!noArray[item.getAttribute("_nr")]) {
						noArray[item.getAttribute("_nr")] = true;
						countNumbers++;
					}
				}
			}
		}
		srcIndex = $(box).index();
		row = parseInt(srcIndex / 9);
		col = srcIndex % 9;
		for (let no=0; no<9; no++) {
			obj = boxes.get(row * 9 + no);
			if (obj[0] != box) {
				if (+obj.attr("_nr") == +obj.html() || !obj.prop("className")) {
					if (!noArray[obj.attr("_nr")]) {
						noArray[obj.attr("_nr")] = true;
						countNumbers++;
					}
				}
			}
			obj = boxes.get(no * 9 + col);
			if (obj[0] != box) {
				if (+obj.attr("_nr") == +obj.html() || !obj.prop("className")) {
					if (!noArray[obj.attr("_nr")]) {
						noArray[obj.attr("_nr")] = true;
						countNumbers++;
					}
				}
			}
		}
		return countNumbers;
	},
	solve() {
		this.hideHints(true);

		this.gameboard.find(".box:not(.pnr)").addClass("unr").map(box => {
			box.innerHTML = box.getAttribute("_nr");
		});

		gameOver = true;
	},
	toggleOnlyAvailable() {
		this.hideHints(true);
		displayOnlyAvailable = !displayOnlyAvailable;
	},
	clearUserNumbers() {
		this.hideHints(true);
		if (gameOver) return;
		this.gameboard.find(".box:not(.pnr)").html("");
	},
	help() {
		this.hideHints(true);
		if (gameOver) return;

		let boxes = this.gameboard.find("> div:not(.pnr):not(.unr)"),
			rnd = Math.floor(Math.random() * boxes.length),
			el = boxes.get(rnd);
		
		el.addClass("unr").html(el.attr("_nr"));

		this.isGameOver();
	}
};

window.exports = sudoku;
