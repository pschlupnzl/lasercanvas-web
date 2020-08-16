/**
* Laser Canvas - main application controller.
*/

/** When included without UI, e.g. tests. */
window.LaserCanvas = window.LaserCanvas || {
	Element: {},    // {Namespace} Elements.
};

// @param {HTMLCanvasElement} canvas Canvas element where system is drawn.
// @param {HTMLDivElement} info Panel where to write information.
window.LaserCanvas.Application = function (canvas, info) {
	"use strict";
	/*
	* TODO as of 2018-08-14
	*  - Save and load system
	*    Currently within System.js. Should / could be moved
	*    into LaserCanvas.js (here) or as separate utility.
	*    Will know more when we have the storage set up.
	*  - Graphing
	*    Element properties can now be controlled from the
	*    information panel, so a graphing layer can tap into
	*    that.
	*    One possibility is to have a "Graph" button beside
	*    each element title in the info panel.
	*    Randy suggested a stability plot.
	*  - Help / documentation
	*    Explanation and exposition of equations used.
	*/	
	var msystem, mrender, minfo,
		mprop,                     // {PropertiesPanel} Properties panel handler.
		mlisteners = {
			interactionchange: [],           // {Array<function>} Handlers when render interaction changes.
			insertelement: []                // {Array<function>} Handlers when an element is added.
		},
		
		/**
		* Add an event listener.
		* @param {string} name Event name 'interactionChange'|'insertElement'|etc. The name is not case sensitive.
		* @param {function} fn Event listener.
		* @returns {Application} Callee for chaining.
		*/
		addEventListener = function (name, fn) {
			if (mlisteners.hasOwnProperty(name.toLowerCase())) {
				mlisteners[name.toLowerCase()].push(fn);
			}
			return this;
		},
		
		/**
		* Notify event listeners of a change.
		* @param {string} name Event name 'interactionChange'|'insertElement'|etc. The name is not case sensitive.
		* @param {...} args Additional arguments passed to listeners.
		*/
		fireEventListeners = function (name, args) {
			var k,
				listeners = mlisteners[name.toLowerCase()]; // {Array<function>} Listeners for this event.
			if (listeners && listeners.length > 0) {
				for (k = 0; k < listeners.length; k += 1) {
					listeners[k].apply(this, Array.prototype.slice.call(arguments, 1)); // Fire each listener with additional arguments.callee
				}
			}
		},
		
		/**
		* Window is resized. Update dimensions of elements.
		*/
		onResize = function () {
			var id, el, key,
				info = document.body.getAttribute('data-info-visible') === 'true',
				sliver = 0, // {number} (px) Slice off to prevent scroll bars.
				w = window.innerWidth - sliver,  // {number} (px) Width of window.
				h = window.innerHeight - sliver, // {number} (px) Height of window.
				ht = 80,                         // {number} (px) Height of toolbar.
ht=220,
				
				pos = {
					'#LaserCanvasFrame': {
						left: 0,
						top: 0,
						width: w,
						height: h - ht
					},
					// '#LaserCanvasToolbar': {
					// 	height: ht
					// },
					// '#LaserCanvasGraphsBar': {
					// 	height: ht
					// },
					'#LaserCanvas': {
						width: w,
						height: h - ht
					},
					'#LaserCanvasInfo': {
						height: h - ht - 1
					}
				};
			
			for (id in pos) {
				if (pos.hasOwnProperty(id)
					&& (el = document.querySelector(id))) {
					for (key in pos[id]) {
						if (pos[id].hasOwnProperty(key)) {
							el.style[key] = pos[id][key] + 'px';
						}
					}
					if (el.nodeName === 'CANVAS') {
						el.width  = pos[id].width;
						el.height = pos[id].height;
					}
				}
			}

			// Trigger resize in drawing.
			mrender.onResize();
		},
		
		/**
		* Initialize the application, once all items have finished loading.
		*/
		init = function () {
			var LaserCanvas = window.LaserCanvas,
				controller = {
					highlightElement: function (element) {
						mrender.highlightElement(element);
						minfo.highligtElement(system, element);
					}
				};
			
			// Child members.
			msystem = new LaserCanvas.System();                 // {System} Optical system.
			minfo = new LaserCanvas.InfoPanel(info);   // {InfoPanel} System information.
			mrender = new LaserCanvas.Render(msystem, minfo, canvas);  // {Render} Rendering engine.
			mprop = new LaserCanvas.PropertiesPanel(mrender, msystem);  // {PropertiesPanel} Properties panel.

			minfo.init(msystem, mrender);

			onResize();
			window.addEventListener('resize', onResize, false);
			document.querySelector('#LaserCanvasToggleInfo').onclick = function () {
				var info = document.body;
				info.setAttribute('data-info-visible', info.getAttribute('data-info-visible') === 'true' ? 'false' : 'true');
				onResize();
			};
			
			// Properties have updated.
			msystem.addEventListener('update', function () {
				msystem.calculateAbcd();
				mrender.update();
				minfo.update(msystem, mrender);
			});
			
			// Structure has changed.
			msystem.addEventListener('change', function () {
				msystem.calculateAbcd();
				mrender.update();
				minfo
					.change()
					.update();
			});
			
			/*
			* Toolbar handler.
			*/
			(function () {
				var Utilities = window.LaserCanvas.Utilities,
				
					// Get the next button value.
					// @param {string} curAttr Body attribute for current value.
					// @param {string} attr Button name attribute.
					// @returns {string} Next attribute.
					nextSliderButton = function(curAttr, attr) {
						var k,
							current = document.body.getAttribute(curAttr), // {string} Current interaction.
							items = document.querySelectorAll('button[' + attr + ']'), // {HTMLInputElementCollection} Available buttons
							n = items.length; // {number} Count of items to look through.
						for (k = 0; k < items.length - 1; k += 1) {
							if (current === items[k].getAttribute(attr)) {
								return items[k + 1].getAttribute(attr);
							}
						}
						return items[0].getAttribute(attr);
					},

					// Set the interaction based on a button click.
					// @this {HTMLElement} Triggering button.
					setInteraction = function () {
						var interaction = this.getAttribute('data-render-interaction');
						if (interaction === 'toggle') {
							interaction = nextSliderButton('data-interaction', 'data-render-interaction');
						}
						fireEventListeners('interactionChange', interaction);
					},	
				
					// Set a theme based on a button click.
					// @this {HTMLButtonElement} Triggering button.
					setTheme = function () {
						var theme = this.getAttribute('data-set-theme');
						if (theme === 'toggle') {
							theme = nextSliderButton('data-theme', 'data-set-theme');
						}
						window.LaserCanvas.theme.set(theme, msystem.update);
					},
					
					// Update a render property based on a checkbox click.
					// @this {HTMLInputElement} Triggering checkbox input field.
					toggleRenderProperty = function () {
						var propertyName = this.getAttribute('data-property-name');
						mrender.property(propertyName, !mrender.property(propertyName));
						mrender.update();
					},
					
					// Toggle an info panel attribute.
					// @this {HTMLInputElement} Triggering checkbox input field.
					toggleInfoAttribute = function () {
						var infoPanel = document.querySelector('.laserCanvasInfo'),
							attr = 'data-' + this.getAttribute('data-attribute');
						infoPanel.setAttribute(attr, infoPanel.getAttribute(attr) === 'true' ? 'false' : 'true');
					},
					
					// Set a theme based on a button click.
					// @this {HTMLButtonElement} Triggering button.
					createSystem = function () {
						launch(this.getAttribute('data-create-system'));
					},
					
					// Attach a click handler to the given selector item(s).
					// @param {string} sel Selector of item(s) to attach click handler to.
					// @param {function} onclick Click handler.
					attachClickHandler = function (sel, onclick) {
						Utilities.foreach(document.querySelectorAll(sel), function () {
							this.onclick = onclick;
						});
					};
				attachClickHandler('[data-render-interaction="toggle"], button[data-render-interaction]', setInteraction);
				attachClickHandler('[data-set-theme="toggle"], button[data-set-theme]', setTheme);
				attachClickHandler('button[data-create-system]', createSystem);
				attachClickHandler('.toggleHelp', window.LaserCanvas.showHelp);
				attachClickHandler('[data-action="toggleRender"]', toggleRenderProperty);
				attachClickHandler('[data-action="toggleInfopanel"]', toggleInfoAttribute);

				// Listener for file Open button.
				window.LaserCanvas.SystemUtil.attachLoadListener(
					document.querySelector("[data-action='openFile'] > input"),
					msystem, mrender);
				document.querySelector('button[data-action="download-svg"]').onclick = function () {
					LaserCanvas.getScript('RenderSvg.js', function () {
						window.globalRenderSvg = new window.LaserCanvas.RenderSvg(msystem)
							.update()
							.download();
					}, this);
				};

				// On every change, store to local storage.
				var toLocalStorageDelayed = new LaserCanvas.Utilities.Debounce(2500);
				msystem.addEventListener("update", function () {
					toLocalStorageDelayed.delay(msystem.toJsonDestination, msystem, LaserCanvas.SystemUtil.toLocalStorage)
				});

				// Initialize from local storage, if possible.
				msystem.fromJsonSource(LaserCanvas.SystemUtil.fromLocalStorage);
			}());

			(function () {
				var k,
					elPreview = null,   // {HTMLDivElement} Hover element being inserted.
					interaction = window.LaserCanvas.Render.interaction, // {Render.interaction} Enum for render interactions.
					elementName = null, // {string?} Name of element being inserted.
					els = document.querySelectorAll('[data-insert-element]'),

					// Create the insert element preview.
					// @param {string} name Name of element being inserted.
					// @param {string} html Content to set.
					createPreviewElement = function (name, html) {
						var img,
							/** Set the preview element margins to align the contained image. */
							setOffset = function () {
								elPreview.style.marginLeft = -0.5 * elPreview.offsetWidth + 'px';
								elPreview.style.marginTop = -0.5 * elPreview.offsetHeight + 'px';
							};
						elementName = name;
						if (!elPreview) {
							elPreview = document.createElement('div');
							elPreview.className = 'insertElementPreview';
							document.body.appendChild(elPreview);
						}
						elPreview.innerHTML = html;
						elPreview.classList.add("hidden");
						img = elPreview.querySelector('img');
						if (img) {
							img.style.transform = 'scale(' + mrender.getTransform().s.toFixed(1); + ')';
							img.onload = setOffset;
						}
						setOffset();
						mrender.setInteraction(interaction.insert);                   // Set insert interaction.
					},
					
					// Clear the preview element.
					clearPreviewElement = function () {
						if (elPreview) {
							elPreview.parentNode.removeChild(elPreview);
							elPreview = null;
						}
					},

					// The mouse is released after an up.
					// @param {MouseEvent} e Event where mouse was released.
					onInsertUp = function (e) {
						document.removeEventListener('mouseup', onInsertUp, false);
						mrender.removeEventListener('insertMove', renderInsertMove);
						if (e.target === mrender.getCanvas()) {      // Handle dropping onto canvas.
							mrender.onInsert(e, elementName);         // Insert the element using event coordinates.
						}
						clearPreviewElement();
						mrender.setInteraction(interaction.layout);  // Restore layout interaction.
					},
					
					// Callback from rendering context when the mouse
					// moves during insertion. The seg object contains
					// screen coordinates in the canvas property.
					// @param {object} seg Segment information.
					renderInsertMove = function (seg) {
						elPreview.style.left = seg.canvas.x + 'px';
						elPreview.style.top = seg.canvas.y + 'px';
						elPreview.style.transform = 'rotate(' + -seg.q.toFixed(2) + 'rad)';
						elPreview.classList.remove("hidden");
					},
					
					// Mouse is down on a button.
					// @this {HTMLElement} Triggering button.
					// @param {Event} e Triggering event.
					onInsertDown = function (e) {
						createPreviewElement(this.getAttribute('data-insert-element'), this.innerHTML);
						mrender.addEventListener('insertMove', renderInsertMove);     // Move handler called with closest position.
						document.addEventListener('mouseup', onInsertUp, false);      // Attach release event.
						return (e.returnValue = false);
					},

					// ---
					// Touch events
					// ---

					// Last touches event.
					lastEvent = null, // {Event} Last successful touch event.
					
					// Touches finish.
					// @param {TouchesEvent} ev Triggering event releasing touches.
					onInsertEnd = function (ev) {
						if (ev.touches.length === 0) {
							mrender.removeEventListener('insertMove', renderInsertMove);
							document.removeEventListener('touchend', onInsertEnd, false);
							document.removeEventListener('touchmove', onInsertTouchMove, false);
							if (lastEvent) {
								mrender.onInsert(lastEvent, elementName);  // Insert the element using last successful coordinates.
							}
							mrender.setInteraction(interaction.layout);   // Restore layout interaction.
							clearPreviewElement();
						}
					},
					
					// A touch moves.
					// @param {TouchesEvent} ev Triggering touches event.
					onInsertTouchMove = function (ev) {
						var e, rc;
						if (ev.touches.length === 1) {
							e = ev.touches.item(0), // {TouchEvent} First moving touch item.
							rc = mrender.getCanvas().getBoundingClientRect(); // {ClientRect} Canvas rectangle on page.
							if (e.pageX >= rc.left && e.pageX < rc.left + rc.width
								&& e.pageY >= rc.top && e.pageY < rc.top + rc.height) {
								lastEvent = e;
								mrender.triggerEvent('touchmove', ev);
							} else { 
								lastEvent = null;
							}
						}
					},
					
					// A touch starts on an insert button.
					// @param {TouchesEvent} e Triggering event starting touches.
					onInsertStart = function (ev) {
						if (ev.touches.length === 1) {
							createPreviewElement(this.getAttribute('data-insert-element'), this.innerHTML);
							mrender.addEventListener('insertMove', renderInsertMove);     // Move handler called with closest position.
							document.addEventListener('touchmove', onInsertTouchMove, false);
							document.addEventListener('touchend', onInsertEnd, false);
							ev.preventDefault();
						}
					};
					
				for (k = els.length - 1; k >= 0; k -= 1) {
					els[k].addEventListener('touchstart', onInsertStart, false);
					els[k].addEventListener('mousedown', onInsertDown, false);
				}
			}());
		},
		
		/**
		* Launch the application with a new cavity.
		* @param {string:System.configuration} configuration Configuration of system to create.
		*/
		launch = function (configuration) {
			mrender.resetTransform();
			mrender.setInteraction(window.LaserCanvas.Render.interaction.layout);
			msystem.createNew(configuration);
		};
		
	/**
	* Public methods.
	*/
	this.addEventListener = addEventListener; // Add a listener for the given event 'interactionChange'|'insertElement'|etc.
	this.fireEventListeners = fireEventListeners; // Fire listeners for an event 'interactionChange'|'insertElement'|etc.
	this.init = init;           // Initialize the application.
};

/**
* Enums.
*/
window.LaserCanvas.Enum = {
	// Rendering layers to build each scene.
	renderLayer: {
		axis: 'axis',             // Render the main axis and construction elements.
		sagittal: 'sagittal',     // Render sagittal mode (if astigmatic).
		tangential: 'tangential', // Render tangential mode (if astigmatic).
		optics: 'optics',         // Render optical elements.
		distance: 'distance',     // Render separation distances.
		annotation: 'annotation'  // Render optic annotations.
	},

	// Beam planes.
	modePlane: {
		sagittal: 0,
		tangential: 1
	}
};

/**
* Clone an object.
* @param {object} obj Object to clone.
* @returns {object} Cloned object.
*/
window.LaserCanvas.clone = function (obj) {
	var
		// Recursively clone an object.
		// @param {object|...} o Object to clone.
		cloneRecursive = function (o) {
			var k, ret;
			if (typeof o === 'string'
				|| typeof o === 'number'
				|| o === null) {
				// Primitive types are direct copies.
				return o;
			} else if (o.constructor === Array.prototype.constructor) {
				// Copy array elementwise.
				ret = [];
				for (k = 0; k < o.length; k += 1) {
					ret[k] = cloneRecursive(o[k]);
				}
			} else {
				// Copy object by keys.
				ret = {};
				for (k in o) {
					if (o.hasOwnProperty(k)) {
						ret[k] = cloneRecursive(o[k]);
					}
				}
			}
			return ret;
		};
	return cloneRecursive(obj);
};

/**
* Scientific constants.
*/
window.LaserCanvas.constant = {
	c: 0.299792458 // (um/fs) Speed of light.
};

/**
* Standard units.
*/
window.LaserCanvas.unit = {
	angleOfIncidence: '&deg;',
	curvatureFace1: 'mm',
	curvatureFace2: 'mm',
	distanceToNext: 'mm',
	distanceToWaist: 'mm',
	faceAngle: '&deg;',
	focalLength: 'mm',
	groupDelayDispersion: 'fs&#178;', // Actually fs^2/rad.
	groupVelocityDispersion: '&micro;m&#8315;&#178;',
	indexDispersion: '&micro;m&#8315;&#185;',
	indexSecondDerivative: '&micro;m&#8315;&#178;',
	initialWaist: '&micro;m',
	modeSize: '&micro;m',
	modeSpacing: 'MHz',
	opticalLength: 'mm',
	physicalLength: 'mm',
	prismInsertion: 'mm',
	radiusOfCurvature: 'mm',
	thermalLens: 'mm',
	thickness: 'mm',
	waistSize: '&micro;m',
	wavefrontROC: 'mm',
	wavelength: 'nm'
};