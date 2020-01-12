/**
* LaserCanvas - Sellmeier library.
* @param {function=} fnReady Function to call once loaded, if any.
* @param {object=} thisArg Object to pass as THIS to callback function.
*/
window.LaserCanvas.Sellmeier = function (fnReady, thisArg) {
	"use strict";
	this.search = '';            // {string} Search string.
	this.eq = null;              // {function?} Currently selected formula.
	this.applyAction = {         // Action on Apply button.
		fn: null,
		thisArg: null
	};
	this.panel = this.init();    // {HTMLDivElement} Panel element.
	this.activate();             // Activate the elements in the panel.
	this.load(fnReady, thisArg); // Load the refractive index database.
};

/**
* Script URL for loading refractive index data.
*/
window.LaserCanvas.Sellmeier.refractiveIndexUrl = 'refractiveIndex.js';

// Create a Sellmeier equation of the given form for the specified parameters.
// @param {number} type Type of formula to use.
// @param {Array<number>} coeff Coefficients for the formula.
window.LaserCanvas.Sellmeier.formula = (function () {
	"use strict";
	var
		createFormula = {
			"1": function (c) {
				// Formula 1: Sellmeier (preferred).
				//                    C2 l^2
				//  n^2 - 1 = C1 + ------------ + ...
				//                  l^2 - C3^2
				return function (l) {
					var k,
						l2 = l * l,
						n2_1 = c[0];
					for (k = 1; k < c.length - 1; k += 2) {
						n2_1 += c[k] * l2 / (l2 - c[k + 1] * c[k + 1]);
					}
					return Math.sqrt(n2_1 + 1);
				};
			},
			"2": function (c) {
				// Formula 1: Sellmeier-2.
				//                   C2 l^2
				//  n^2 - 1 = C1 + ---------- + ...
				//                  l^2 - C3
				return function (l) {
					var k, 
						l2 = l * l,
						n2_1 = c[0];
					for (k = 1; k < c.length - 1; k += 2) {
						n2_1 += c[k] * l2 / (l2 - c[k + 1]);
					}
					return Math.sqrt(n2_1 + 1);
				};
			},
			"4": function (c) {
				// Formula 4: RefractiveIndex.INFO
				//                C2 l^C3         C6 l^C7
				//  n^2 = C1 + ------------- + ------------- + C10 l^C11 + C12 l^C13 + ...
				//              l^2 - C4^C5     l^2 - C8^C9
				return function (l) {
					var k, 
						l2 = l * l,
						n2 = c[0]
							+ c[1] * Math.pow(l, c[2]) / (l2 - Math.pow(c[3], c[4]))
							+ c[5] * Math.pow(l, c[6]) / (l2 - Math.pow(c[7], c[8]));
					for (k = 9; k < c.length - 1; k += 2) {
						n2 += c[k] * Math.pow(l, c[k + 1]);
					}
					return Math.sqrt(n2);
				};
			},
			"notSupported": function (l) {
				return l;
			}
		};
		
	// Create a Sellmeier equation of the given form for the specified parameters.
	// @param {number} type Type of formula to use.
	// @param {Array<number>} coeff Coefficients for the formula.
	return function (type, coeff) {
		if (!createFormula.hasOwnProperty(type)) {
			alert(window.LaserCanvas.Utilities.stringFormat('Sellmeier type `{0}` not supported', type));
			createFormula.notSupported;
		}
		return createFormula[type](coeff);
	};
}());

window.LaserCanvas.Sellmeier.prototype = {
	/**
	* Prepare the panel.
	* @returns {HTMLDivElement} The created panel (in wait state).
	*/
	init: function () {
		"use strict";
		var LaserCanvas = window.LaserCanvas, // {object} Namespace.
			panel = document.createElement('div'); // {HTMLDivElement} Sellmeier panel.
			
		// Prepare panel contents.
		panel.innerHTML = LaserCanvas.Sellmeier.panelHtml;
		panel.className = 'sellmeierPanel';
		LaserCanvas.localize(panel);
		document.body.appendChild(panel);
		LaserCanvas.Utilities.draggable(panel, {
			handle: panel.querySelector('.dragbar')
		});
		
		return panel;
	},
	
	/**
	* Activate the panel.
	*/
	activate: function () {
		var self = this;
		// Close button: Remove panel. Presumably object is garbage collected.
		this.panel.querySelector('[data-action="close"]').onclick = function () {
			self.hide();
		};
		
		// Search materials.
		this.panel.querySelector('.materials input').onkeyup = function () {
			self.search = this.value;
			self.updateBooks();
		};
		
		// Change in wavelength.
		this.panel.querySelector('input[data-field="wavelength"]').onkeyup = function () {
			self.updateCalculation();
		};
		
		// Apply action to callback.
		this.panel.querySelector('button[data-action="apply"]').onclick = function () {
			if (self.applyAction.fn) {
				self.applyAction.fn.call(self.applyAction.thisArg, self.updateCalculation());
			}
		};
	},
	
	/**
	* Load the Sellmeier library and continue to prepare the panel.
	* @param {function=} fnReady Function to call once loaded, if any.
	* @param {object=} thisArg Object to pass as THIS to callback function.
	*/
	load: function (fnReady, thisArg) {
		"use strict";
		var LaserCanvas = window.LaserCanvas, // {object} Namespace.
		
			// Loaded, or already loaded.
			// @this {Sellmeier} Caller from closure.
			ready = function () {
				this.ready();
				if (fnReady) {
					fnReady.call(thisArg);
				}
			};
			
		if (!LaserCanvas.Sellmeier.refractiveIndex) {
			LaserCanvas.getScript(LaserCanvas.Sellmeier.refractiveIndexUrl, ready, this);
		} else {
			ready.call(this);
		}
	},
	
	/**
	* The panel and refractive index data is loaded.
	*/
	ready: function () {
		"use strict";
		this.updateBooks();
	},
	
	/**
	* Show the panel.
	*/
	show: function () {
		"use strict";
		this.panel.setAttribute('data-visible', 'true');
	},
	
	/**
	* Hide the panel.
	*/
	hide: function () {
		"use strict";
		this.panel.setAttribute('data-visible', 'false');
	},
	
	/**
	* Destroy the panel.
	*/
	destroy: function () {
		"use strict";
		this.panel.parentNode.removeChild(this.panel);
	},
	
	/**
	* Set the title of the panel, or default if not specified.
	* @param {string=} title Title to set, or default if not specified.
	*/
	setPanelTitle: function (title) {
		"use strict";
		this.panel.querySelector('h1 label').innerHTML = title || window.LaserCanvas.localize('Refractive index');
	},
	
	/**
	* Set a DOM element value.
	* @param {string} sel Selector for element.
	* @param {string} html Value to set.
	*/
	setPanelElement: function (sel, html) {
		"use strict";
		this.panel.querySelector(sel).innerHTML = html;
	},

	/**
	* Clear a select menu.
	* @param {string} field Field of list to clear 'book'|'source'.
	*/
	clearList: function (field) {
		"use strict";
		var k,
			opts = this.panel.querySelectorAll('ul[data-field="' + field + '"] > li');
		for (k = opts.length - 1; k >= 0; k -= 1) {
			opts[k].parentNode.removeChild(opts[k]);
		}
	},
		
	/**
	* Activate the elements in the book or source list.
	* @param {string} field List to activate 'book'|'source'.
	* @param {function} fn Click function to call. The function is called 
	*  with thisArg as THIS and the element data-value as first argument.
	* @param {object} thisArg Object to pass as THIS to callback function.
	*/
	activateList: function (field, fn, thisArg) {
		"use strict";
		var 
			// An item is clicked. Invoke the callback function with
			// the given THIS and value arguments.
			// @this {HTMLLIElement} The clicked DOM element whose value to use.
			onclick = function () {
				fn.call(thisArg, this.getAttribute('data-value'));
			};
		window.LaserCanvas.Utilities.foreach(this.panel.querySelectorAll('ul[data-field="' + field + '"] > li[data-value]'), function () {
			this.onclick = onclick;
		});
	},
	
	/**
	* Select a list item, de-selecting any other.
	* @param {string} field List whose item to activate 'book'|'source'.
	* @param {string} value Value of item to select.
	*/
	selectListItem: function (field, value) {
		"use strict";
		window.LaserCanvas.Utilities.foreach(this.panel.querySelectorAll('ul[data-field="' + field + '"] > li[data-value]'), function () {
			if (this.getAttribute('data-value') === value.toString()) {
				this.setAttribute('data-selected', 'true');
			} else {
				this.removeAttribute('data-selected');
			}
		});
	},
	
	/**
	* Update the materials list, e.g. when first shown
	* or when the search changes.
	*/
	updateBooks: function () {
		"use strict";
		var re = null,
			LaserCanvas = window.LaserCanvas, // {object} Namespace.
			sel = this.panel.querySelector('ul[data-field="book"]'), // {HTMLULElement} Material list.
			mats = {};         // {object} Prevent duplicates.
		
		// Clear the list.
		this.clearList('book');
		
		// Build the search regular expression.
		if (this.search && this.search.length > 1) {
			try {
				re = new RegExp(this.search, "i");
			} catch (e) {
				re = null;
			}
		}
		
		// Populate new list.
		LaserCanvas.Utilities.foreach(LaserCanvas.Sellmeier.refractiveIndex, function (k, mat) {
			var opt,
				title = mat.book; ////LaserCanvas.Utilities.stringFormat('{0} ({1})', mat.book, mat.comments);
			if (!mats.hasOwnProperty(title)
				&& (!re 
					|| re.test(title)
					|| re.test(mat.comments))) {
				mats[title] = true;
				opt = document.createElement('li');
				opt.innerHTML = title;
				opt.setAttribute('data-value', mat.book);
				sel.appendChild(opt);
			}
		});
		this.activateList('book', this.selectBook, this);

		// Select first item if not searching.
		if (!re) {
			this.selectBook(LaserCanvas.Sellmeier.refractiveIndex[0].book);
		}
	},
	
	/**
	* Select a book and show sources.
	* @param {string} book Selected book to show.
	*/
	selectBook: function (book) {
		"use strict";
		var LaserCanvas = window.LaserCanvas, // {object} Namespace.
			selectedValue = null,              // {number} Source to select.
			sel = this.panel.querySelector('ul[data-field="source"]'); // {HTMLLIElement} Material list.
		
		// Prepare the lists.
		this.selectListItem('book', book);
		this.clearList('source');
		
		// Populate new list.
		LaserCanvas.Utilities.foreach(LaserCanvas.Sellmeier.refractiveIndex, function (k, mat) {
			var opt;
			if (mat.book === book) {
				opt = document.createElement('li');
				opt.innerHTML = mat.source;
				opt.setAttribute('data-value', k);
				sel.appendChild(opt);
				if (selectedValue === null) {
					selectedValue = k;
				}
			}
		});
		this.activateList('source', this.selectSource, this);
		
		// Select unique source.
		if (selectedValue !== null) {
			sel.value = selectedValue;
			this.selectSource(selectedValue);
		}
	},
	
	/**
	* Select a new source.
	* @param {string:number} source Index of source.
	*/
	selectSource: function (source) {
		"use strict";
		var LaserCanvas = window.LaserCanvas,
			mat = LaserCanvas.Sellmeier.refractiveIndex[+source];
		
		// Check validity.
		if (!mat) {
			return;
		}
		
		// Update display.
		this.selectListItem('source', source);
		this.setPanelTitle(LaserCanvas.Utilities.stringFormat('{0} - {1}', mat.book, mat.source));
		this.setPanelElement('[data-field="comments"]', mat.comments || '');
		this.setPanelElement('[data-field="references"]', mat.references || '');
		this.setPanelElement('[data-field="rangeMin"]', mat.range ? mat.range[0] : '');
		this.setPanelElement('[data-field="rangeMax"]', mat.range ? mat.range[1] : '');
		
		// Create formula, if missing.
		if (!mat.hasOwnProperty('eq')) {
			mat.eq = LaserCanvas.Sellmeier.formula(mat.formula, mat.coefficients);
		}
		this.eq = mat.eq;
		
		this.updateCalculation();
	},
	
	// ----------------------------------------------------
	//  Public API calls.
	// ----------------------------------------------------
	
	/**
	* Set the action on Apply, or remove it.
	* @param {function=} fn Callback function, or falsy to remove.
	* @param {object=} thisArg Object to pass as THIS argument, if used.
	*/
	setApplyAction: function (fn, thisArg) {
		this.applyAction.fn = fn;
		this.applyAction.thisArg = thisArg;
		this.panel.setAttribute('data-has-apply-action', fn ? 'true' : 'false');
	},
	
	/**
	* Update the calculation.
	* Finally we can do some numbers!
	* @param {number=} wavelength Wavelength to set, if any.
	* @returns {object} Calculated values.
	*/
	updateCalculation: function (wavelength) {
		"use strict";
		var prop = {},
			Utilities = window.LaserCanvas.Utilities, // {object} Namespace.
			numberFormat = Utilities.numberFormat,    // {function} Format numbers.
			input = this.panel.querySelector('input[data-field="wavelength"]'), // {HTMLInputElement} Input field.
			l = +input.value,    // {number} (um) Current wavelength.
			dl = 1e-3,           // {number} (um) Wavelength step for finite differential.
			n = this.eq;         // {function?} Currently selected formula, if any.
			
		// Set new wavelength, if any.
		if (typeof wavelength === 'number') {
			l = wavelength;
			input.value = numberFormat(l);
		}
		
		// Property values.
		if (n) {
			prop.refractiveIndex = n(l);
			prop.indexDispersion = (n(l + dl / 2) - n(l - dl / 2)) / dl;
			prop.groupVelocityDispersion = (n(l + dl) - 2 * n(l) + n(l - dl)) / (dl * dl);
			
			// Set readouts.
			Utilities.foreach(prop, function (propertyName, value, self) {
				self.setPanelElement('[data-value="' + propertyName + '"]', value.toPrecision(6));
			}, this);
		}
		
		// Return calculation.
		return prop;
	}
};

/**
* Panel contents.
*/
window.LaserCanvas.Sellmeier.panelHtml = [
	'<div class="dragbar"></div>',
	'<h1>',
		'<label data-localize="Sellmeier"></label>',
		'<button data-action="close">X</button>',
	'</h1>',
	'<div class="materials">',
		'<input type="text" class="laserCanvasInput" data-placeholder="Search..." />',
		'<ul data-field="book"><li data-localize="Loading..."></li></ul>',
		'<ul data-field="source"><li>&larr;</li></ul>',
	'</div>',
	'<div data-field="references"></div>',
	'<div class="comments">',
		'<span data-field="comments"></span> ',
		'<label data-localize="Range"></label>: ',
		'<span data-field="rangeMin"></span> - <span data-field="rangeMax"></span> &micro;m',
	'</div>',
	'<div class="parameters">',
		'<table>',
			'<tbody>',
				'<tr>',
					'<td><label data-localize="Wavelength"></label></td>',
					'<td><i>&lambda;</i></td>',
					'<td><input type="text" class="laserCanvasInput" data-field="wavelength" value="1.064" /></td>',
					'<td>&micro;m</td>',
				'</tr>',
				'<tr>',
					'<td><label data-localize="Refractive index"></label></td>',
					'<td><i>n</i></td>',
					'<td><span data-value="refractiveIndex"></span></td>',
					'<td></td>',
				'</tr>',
				'<tr>',
					'<td><label data-localize="Dispersion"></label></td>',
					'<td><span class="infrac"><span><i>dn</i></span><span><i>d&lambda;</i></span></span></td>',
					'<td><span data-value="indexDispersion"></span></td>',
					'<td>&micro;m&#8315;&#185;</td>',
				'</tr>',
				'<tr>',
					'<td><label data-localize="Group velocity dispersion"></label></td>',
					'<td><span class="infrac"><span><i>d</i>&#178;<i>n</i></span><span><i>d&lambda;</i>&#178;</span></span></td>',
					'<td><span data-value="groupVelocityDispersion"></span></td>',
					'<td>&micro;m&#8315;&#178;</td>',
				'</tr>',
			'</tbody>',
		'</table>',
	'</div>',
	'<button class="lcbutton" data-action="apply" data-localize="Apply"></button>',
	'<a class="attribution" href="https://refractiveindex.info" target="_blank">Data from RefractiveIndex.INFO</a>'
].join('');
