/**
* Laser Canvas - Loader for additional scripts and content.
*/
"use strict";

// Create namespace.
window.LaserCanvas = {
	Element: {},    // {Namespace} Elements.
	theme: {        // {object} Themed graphics.
		current: {}
	},
	
	// Load a script with callback function. If the script
	// has already been loaded, invokes the callback
	// without loading it a second time. IE8 doesn't
	// support addEventListener and doesn't fire attach-
	// Event('onload'), so we poll the readyState.
	// @param {string} src Source url to load
	// @param {function=} fn Completion function to call
	// @param {object=} thisArg Argument passed as THIS to callback, if specified.
	getScript: (function () {
		var loadedScripts = {}; // {object} Load scripts only once.
		
		return function (src, fn, thisArg) {
			var s,
				loaded = function () {
					fn.call(thisArg || this);
				},
				cm = function () {
					if (s.readyState === 'loaded'
						|| s.readyState === 'completed'
						|| s.readyState === 'complete') {
						loaded();
					} else {
						setTimeout(cm, 100);
					}
				};
			if (loadedScripts[src]) {
				loaded();
			} else {
				s = document.createElement('script');
				s.src = src;
				document.getElementsByTagName('head')[0].appendChild(s);
				if (fn) {
					if (s.addEventListener) {
						s.addEventListener('load', loaded);
					} else {
						cm();
					}
				}
			}
		};
	}()),

	// Load a stylesheet. If the file has already been loaded,
	// invokes the callback without loading it again.
	// @param {string} src Source url to load
	// @param {function=} fn Completion function to call
	// @param {object=} thisArg Argument passed as THIS to callback, if specified.
	getStyle: (function () {
		var loadedStyles = {}; // {object} Loaded stylesheets.

		return function (href, fn, thisArg) {
			var s,
				loaded = function () {
					fn.call(thisArg || this);
				};
			if (loadedStyles[href]) {
				loaded();
			} else {
				s = document.createElement('link');
				s.rel = 'stylesheet';
				s.href = href;
				s.onload = loaded;
				(document.head || document.getElementsByTagName('head')[0])
					.appendChild(s);
			}
		};
	}())
}; 

// Loader for additional scripts and content.
(function () {
	"use strict";
	var progressFill = null,
	
		// Scripts to load.
		files = [
			'js/LaserCanvas.js',
			'js/LaserCanvasTheme.js',
			'js/Localize.js',
			'js/Math.js',
			'js/Element.js',
			'js/ElementDielectric.js',
			'js/ElementDispersion.js',
			'js/ElementLens.js',
			'js/ElementMirror.js',
			'js/ElementScreen.js',
			////'File.js',
			'js/GraphPanel.js',
			////'Help.js',
			'js/PropertiesPanel.js',
			'js/InfoPanel.js',
			'js/Render.js',
			'js/Sellmeier.js',
			'js/System.js',
			'js/SystemAbcd.js',
			'js/SystemAdjustLite.js',
			'js/Utilities.js',

			'js/HelpPanel.js',
			'css/HelpPanel.css',
			// Also:
			// refractiveIndex.js - Used by Sellmeier.
		],
		
		items = 2          // {number} Total count of items to load (here: DOMContentLoaded and last semaphore).
			+ files.length,
		loaded = 0,        // {number} Count of items already loaded.
		
		// Update the progress bar for number of items remaining.
		updateBar = function () {
			if (progressFill) {
				progressFill.style.width = Math.round(100 * (loaded + 1) / items) + '%';
			}
		},
		
		// Each item is loaded.
		ready = function () {
			var LaserCanvas = window.LaserCanvas;
			
			updateBar();
			if ((loaded += 1, loaded) < items) return;

			// Localize interface elements.
			LaserCanvas.localize.elements();
			
			// Prepare the document.
			// TODO: Move this into constructor code elsewhere.
			document.body.removeChild(progressFill.parentNode);
			
			////var g = new LaserCanvas.GraphPanel();
			LaserCanvas.theme.set('light',
				function () {
					var 
						cnv = document.getElementById('LaserCanvas'),
						info = document.getElementById('LaserCanvasInfo');
					cnv.className = 'render2d';
					LaserCanvas.app = new LaserCanvas.Application(cnv, info);
					LaserCanvas.app.init();
					LaserCanvas.app.launch(LaserCanvas.System.configuration.startup);
				});
		},
		
		// Load script items.
		// The first script (LaserCanvas.js) is loaded blocking, the rest in arbitrary order.
		loadFiles = function () {
			var getScript = window.LaserCanvas.getScript,
				getStyle = window.LaserCanvas.getStyle;
			getScript(files[0], function () {
				var k, fileName;
				for (k = 1; k < files.length; k += 1) {
					fileName = files[k];
					if (fileName.substr(fileName.length - 4) === '.css') {
						getStyle(fileName, ready);
					} else {
						getScript(fileName, ready);
					}
				}
				ready();
			});
		};
	
	// Grab document once ready.
	document.addEventListener('DOMContentLoaded', function () {
		progressFill = document.querySelector('.progressBarLoading > div');
		ready();
	}, false);
	
	// Load all scripts.
	loadFiles();

	// Release last semaphore.
	ready();
}());