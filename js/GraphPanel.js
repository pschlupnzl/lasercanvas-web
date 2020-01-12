/**
* LaserCanvas - plotting panel.
*/
window.LaserCanvas.GraphPanel = function () {
	"use strict";
	
	// Data to be plotted.
	this.data = {
		x: [0, 0.5, 1],
		y: [
			[0, 1, 0.5],
			[0, 0.3, 1]
		]
	};
	
	// Graphing parameters.
	this.range = {
		x: [0, 1],
		y: [0, 1]
	};
	
	this.panel = this.init();
	this.resize(true); //// **DEBUG** Rescale for now!
};

window.LaserCanvas.GraphPanel.prototype = {
	/**
	* Initialize the panel.
	* @returns {HTMLDivElement} The created panel.
	*/
	init: function () {
		"use strict";
		var panel = document.createElement('div'),
			cnv = document.createElement('canvas'),
			layer = document.querySelector('#LaserCanvasInfo'); // {HTMLElement} Insertion layer.
		
		// Prepare panel.
		panel.className = 'graphPanel';
		panel.appendChild(cnv);
		window.LaserCanvas.Utilities.draggable(panel);
		layer.parentNode.insertBefore(panel, layer);
		return panel;
	},
	
	/**
	* The panel is resized.
	* @param {boolean} withUpdate Value indicating whether to calculate scales and update (default) or only resize (FALSE).
	*/
	resize: function (withUpdate) {
		var panel = this.panel, // {HTMLDivElement} Containing element.
			rc = panel.getBoundingClientRect(), // {object:Rect} Panel bounding box.
			cnv = panel.querySelector('canvas'); // {HTMLCanvasElement} Drawing canvas.

		// Update canvas dimensions.
		cnv.width = rc.width;   // {number} (px) Width of panel.
		cnv.height = rc.height; // {number} (px) Height of panel.
		
		// Redraw, if required.
		if (withUpdate !== false) {
			this.rescale();
		}
	},
	
	/**
	* Calculate the scaling factors.
	*/
	rescale: function () {
		// TODO: Calculate scales.
		this.update();
	},
	
	/**
	* Update the plot.
	*/
	update: function () {
		var cnv = this.panel.querySelector('canvas'), // {HTMLCanvasElement} Drawing canvas.
			ctx = cnv.getContext('2d'); // {RenderingContext2D} Drawing context.
			
		// Clear the context.
		ctx.clearRect(0, 0, cnv.width, cnv.height);
		
		// Draw something.
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(cnv.width, cnv.height);
		ctx.stroke();
	}
};


