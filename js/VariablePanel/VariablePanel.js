(function (LaserCanvas) {
	var VariablePanel = function () {
		this.el = this.init();
		this.min = 0;
		this.max = 1;
		this.value = 0;
	};

	/** Returns the DOM element containing this component. */
	VariablePanel.prototype.element = function () {
		return this.el;
	};

	/** Initializes the component, filling its DOM element. */
	VariablePanel.prototype.init = function () {
		var trough,
			el = document.createElement("div");
		el.className = "LaserCanvasVariablePanel";
		el.innerHTML = [
			'<div class="max"><input type="text" value="1" /></div>',
			'<div class="trough">',
			'<input type="range" />',
			'<div class="thumb">',
			'<span>',
			'<label>0.5</label>',
			'<input type="text" value="0.5" />',
			'</span>',
			'</div>',
			'</div>',
			'<div class="min"><input type="text" value="0" /></div>'
		].join("");
		trough = el.querySelector(".trough");

		el.querySelector(".thumb").addEventListener("click", function () {
			el.classList.add("inputThumb");
			el.querySelector(".thumb input").focus();
		});

		el.querySelector(".thumb input").addEventListener("blur", function () {
			el.classList.remove("inputThumb");
		});

		LaserCanvas.Utilities.draggable(el.querySelector(".thumb"), {
			bounds: trough,
// 			onMove: function (e, pt) {
// 				var v,
// 					h = trough.offsetHeight;
// console.log(h, pt)
// 				if (h > 0) {
// 					pt.y = pt.y < 0 ? 0 : pt.y > h ? h : pt.y;
// 					v = pt.y / h;
// 					this.setValue((1 - v) * this.max + v * this.min);
// 				}
// 			}
		}, this);
		return el;
	};

	/** Set the current value (e.g. by dragging the thumb). */
	VariablePanel.prototype.setValue = function (val) {
		this.value = val;
		this.update();
	};


	/** Update the slider and values. */
	VariablePanel.prototype.update = function () {
		var el = this.el,
			thumbLabel = el.querySelector(".thumb label"),
			thumbInput = el.querySelector(".thumb input"),
			str = LaserCanvas.Utilities.numberFormat(this.value);
		thumbLabel.innerText = thumbInput.value = str;
	};

	LaserCanvas.VariablePanel = VariablePanel;
}(window.LaserCanvas));

// setTimeout(function () {
// 	var v = new LaserCanvas.VariablePanel();
// 	document.querySelector("#LaserCanvasGraphsBar").appendChild(v.element());
// }, 100);
