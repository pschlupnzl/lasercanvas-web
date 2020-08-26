/**
* Laser canvas rendering.
* @param {System} system Optical system to render.
* @param {InfoPanel} info Info panel, used e.g. with highlightElement.
* @param {HTMLCanvasElement} canvas DOM element where to render.
*/
(function (LaserCanvas) {
LaserCanvas.Render = function (system, info, canvas) {
	var
		mpageOffset = {     // Offset of canvas to page (for mouse events).
			left: 0,         // {number} (px) Horizontal offset to canvas.
			top: 0           // {number} (px) Vertical offset to canvas.
		},
	
		mzoom = {
			xWorld: 0,       // {number} (mm) World horizontal origin.
			yWorld: 0,       // {number} (mm) World vertical origin.
			s: 1,            // {number} Render zoom factor.
			xCanvas: 0,      // {number} (px) Canvas horizontal origin.
			yCanvas: 0       // {number} (px) Canvas vertical origin.
		},

		mdrag = {
			isDrag: false,   // {boolean} Value indicating whether a drag is in progress (even if the mouse has not yet moved).
			hasMoved: false, // {boolean} Value indicating whether the mouse moved in the current or previous operation.
			element: null,   // {Element?} Current element under mouse.
			ptStart: null,   // {Point?} Starting point where drag starts.
			ptsStart: null,  // {Array<Point>?} Starting points for multi-touch.
			isPan: false,    // {Boolean} Value indicating whether system is being panned.
			lastTouch: null  // {Touch} Last moved touch item, for onTouchEnd.
		},
		
		meventListeners = {
			elementClick: [], // An element is clicked.
			insertMove: []    // Mouse move listeners when inserting a new item.
		},
		
		minteraction = LaserCanvas.Render.interaction.layout, // {Render.interaction} Current interaction state.
		
		mprop = {
			showDistance: true,   // {boolean} Value indicating whether to show distances.
			showAnnotation: false // {boolean} Value indicating whether to show element annotations.
		},
		
		mvariablesGetter = null,  // {function|null} Function to retrieve current variable values.

		// -------------------------------------------------
		//  Properties.
		// -------------------------------------------------

		/** Sets the callback function used to retrieve variable values. */
		setVariablesGetter = function (getter) {
			mvariablesGetter = getter;
		},

		/** Retrieves current variables, or returns empty object as callback. */
		getVariables = function () {
			return mvariablesGetter ? mvariablesGetter() : {};
		},

		/**
		* Gets or sets a property value.
		* @param {string} propertyName Name of property to set.
		* @param {boolean|...=} newValue Value to set.
		* @returns {boolean|number...} Current value, if retrieving.
		*/
		property = function (propertyName, newValue) {
			if (newValue !== undefined) {
				switch (propertyName) {
					case 'showDistance':
					case 'showAnnotation':
						mprop[propertyName] = newValue;
						update.call(this);
						break;
				}
			} else {
				return mprop[propertyName];
			}
		},
		
		// -------------------------------------------------
		//  Events.
		// -------------------------------------------------
		
		/**
		* The canvas is resized.
		*/
		onResize = function () {
			mpageOffset = LaserCanvas.Utilities.elementOffset(canvas);
			mzoom.xCanvas = 0.5 * canvas.width;  // (px) Canvas horizontal origin (centered).
			mzoom.yCanvas = 0.5 * canvas.height; // (px) Canvas vertical origin (centered).
			update.call(this);
		},
		
		/**
		* Change the interaction mode in response to a toolbar button.
		* @param {Render.interaction} interaction New interaction to set.
		*/
		setInteraction = function (interaction) {
			minteraction = interaction;
			document.body.setAttribute('data-interaction', minteraction);
			if (minteraction === LaserCanvas.Render.interaction.inspect) {
				inspectLocation.call(this, { x: 0, y: 0 }); // Inspect location, show mode info.
			}
		},
		
		// -------------------------------------------------
		//  Utility methods.
		// -------------------------------------------------
		
		/**
		* Reset the transform.
		*/
		resetTransform = function () {
			mzoom.xWorld = 0;       // {number} (mm) World horizontal origin.
			mzoom.yWorld = 0;       // {number} (mm) World vertical origin.
			mzoom.s = 1;            // {number} Render zoom factor.
		},
		
		/**
		* Gets the world transform.
		* @returns {object} World transform.
		*/
		getTransform = function () {
			return mzoom;
		},
		
		/**
		* Gets the drawing canvas.
		* @returns {HTMLCanvasElement} Drawing canvas.
		*/
		getCanvas = function () {
			return canvas;
		},
		
		/**
		* Get the drawing context.
		* @returns {HTMLCanvasContext2D} Drawing context.
		*/
		getContext = function () {
			return canvas.getContext('2d');
		},
		
		/**
		* Map a point from world to canvas.
		* @param {number} x World horizontal location.
		* @param {number} y World vertical location.
		* @param {number} r World distance to scale, if used.
		* @returns {Point} Point mapped to canvas.
		*/
		worldToCanvas = function (x, y, r) {
			return {
				x: mzoom.xCanvas + (x - mzoom.xWorld) * mzoom.s,
				y: mzoom.yCanvas - (y - mzoom.yWorld) * mzoom.s,
				r: mzoom.s * (r || 0)
			};
		},
		
		/**
		* Map a point from canvas to world.
		* @param {number} x Canvas horizontal location.
		* @param {number} y Canvas vertical location.
		* @returns {Point} Point mapped to world.
		*/
		canvasToWorld = function (x, y) {
			return {
				x: mzoom.xWorld + (x - mzoom.xCanvas) / mzoom.s,
				y: mzoom.yWorld - (y - mzoom.yCanvas) / mzoom.s
			};
		},
		
		/**
		* Map a mouse event to world coordinates.
		* @param {MouseEvent} e Event to map.
		* @returns {Point} Mapped event coordinates.
		*/
		eventToWorld = function (e) {
			return canvasToWorld(
				e.pageX - mpageOffset.left, 
				e.pageY - mpageOffset.top);
		},
		
		// -------------------------------------------------
		//  Hover highlighting.
		// -------------------------------------------------
		
		/**
		* Update the hover element.
		*/
		updateHighlight = function () {
			highlightElement(mdrag.element, mdrag.isDrag ? 'drag' : 'hover');
		},

		/**
		 * Sets or clears the highlighted element.
		 * @param {Element} element Element to be highlighted, or NULL to clear.
		 * @param {string=} state State for highlight 'drag':'hover'.
		 */
		highlightElement = function (element, state) {
			var pt, loc,
				highlight = canvas.parentNode.querySelector('.highlight'); // {HTMLDivElement} Highlight element.
			if (element) {
				highlight.setAttribute('data-state', state || 'hover');
				loc = element.location();
				pt = worldToCanvas(loc.x0 || loc.x, loc.y0 || loc.y);
				highlight.style.left = pt.x.toFixed(2) + 'px';
				highlight.style.top  = pt.y.toFixed(2) + 'px';
			} else {
				highlight.removeAttribute('data-state');
			}
			info.highlightElement(element);
		},
		
		// -------------------------------------------------
		//  Mouse events.
		// -------------------------------------------------
		
		/**
		* The mouse is released on the document somewhere.
		*/
		onUp = function () {
			document.removeEventListener('mouseup', onMouseUp, false);
			system.dragElementEnd();
			mdrag.isDrag = mdrag.isPan = false;
		},
		
		/**
		* Mouse or touch event up.
		* @param {Event} e Triggering event.
		*/
		onMouseUp = function (e) {
			onUp();
		},
		
		/**
		* The mouse moves within the canvas (not dragging).
		* @param {Point} pt Mouse world coordinates.
		*/
		onMove = function (pt) {
			var element, seg,
				interaction = LaserCanvas.Render.interaction;

			switch (minteraction) {
				case interaction.insert:
					seg = inspectLocation.call(this, pt, 'insertElement'); // Inspect location, don't show mode info.
					seg.canvas = worldToCanvas(seg.x, seg.y); // Add canvas (i.e. page) coordinates.
					fireEventListeners('insertMove', seg);    // Invoke listeners.
					break;
					
				case interaction.inspect:
				default:
					if (minteraction === interaction.inspect) {
						inspectLocation.call(this, pt); // Inspect location, show mode info.
					}
					element = system.elementAtLocation(pt, LaserCanvas.Render.tolerance / mzoom.s);
				
					// Switch cursors.
					if (!mdrag.element && element) {
						canvas.classList.add('hoverOverElement');
					} else if (mdrag.element && !element) {
						canvas.classList.remove('hoverOverElement');
					}
					// Update current element.
					mdrag.element = element;
					updateHighlight();
					break;
			}
		},
		
		/**
		* Mouse goes down on canvas or element.
		* @param {Point} pt Mouse world coordinates.
		*/
		onDown = function (pt) {
			// Determine drag start.
			if (mdrag.element) {
				if (system.dragElementStart(pt, mdrag.element)) {
					mdrag.isDrag = true;
					mdrag.ptStart = pt;
				}
			} else {
				mdrag.ptStart = worldToCanvas(pt.x, pt.y);
				mdrag.isPan = true;
			}
			
			// Attach up event.
			if (mdrag.isDrag || mdrag.isPan) {
				document.addEventListener('mouseup', onMouseUp, false);
			}
			mdrag.hasMoved = false;
		},
		
		/**
		* Mouse or touch event moves.
		* @this {Render} Parent render.
		* @param {Event} e Triggering event.
		*/
		onMouseMove = function (e) {
			var pt = eventToWorld(e);
			if (mdrag.isPan) {
				mdrag.ptStart = onPan.call(this, worldToCanvas(pt.x, pt.y));
			} else if (!mdrag.isDrag) {
				onMove.call(this, pt);
			} else if (mdrag.element) {
				onDragElement.call(this, pt);
			}
			if (minteraction === LaserCanvas.Render.interaction.inspect) {
				inspectLocation.call(this, pt);
			}
			updateHighlight();
		},
		
		/**
		* Mouse or touch event down.
		* @this {Render} Calling render.
		* @param {Event} e Triggering event.
		*/
		onMouseDown = function (e) {
			var interaction = LaserCanvas.Render.interaction, // {Render.interaction} Interaction states.
				pt = eventToWorld(e),              // {Point} Current mouse point in world coordinates.
				el = system.elementAtLocation(pt,  // {Element} Current element.
					LaserCanvas.Render.tolerance / mzoom.s);

			switch (minteraction) {
				case interaction.inspect:
				case interaction.layout:           // Layout:
					mdrag.element = el;             // Track current element.
					onDown.call(this, pt);          // Begin layout interaction drag.
					e.preventDefault && e.preventDefault();
					break;
			}
		},
		
		/**
		* A click event. The element should already be set
		* by the preceding onMouseDown event.
		* @this {Render} Calling render.
		* @param {MouseEvent} e Mouse event, used to position the dialog box.
		*/
		onClick = function (e) {
			if (mdrag.element && !mdrag.hasMoved) {
				fireEventListeners('elementClick', e, mdrag.element);
			}
		},
		
		/**
		* The mouse wheel is scrolled.
		* @this {Render} Calling render.
		* @param {WheelEvent} e Triggering event.
		*/
		onWheel = function (e) {
			onZoom.call(this, Math.pow(2, -0.001 * e.deltaY));
			onMouseMove.call(this, e);
		},
		
		/**
		* Mouse is being dragged on an element.
		* @param {Point} pt Mouse world coordinates.
		*/
		onDragElement = function (pt) {
			mdrag.ptLast = pt;
			system.dragElement(pt, mdrag.ptStart, mdrag.element);
			if (!mdrag.hasMoved
				&& Math.abs(pt.x - mdrag.ptStart.x) + Math.abs(pt.y - mdrag.ptStart.y) > 3) {
				mdrag.hasMoved = true;
			};
		},
		
		/**
		* Mouse finished dragging an element.
		*/
		onDragElementEnd = function () {
			system.dragElementEnd(mdrag.ptLast, mdrag.ptStart, mdrag.element);
		},
		
		/**
		* The canvas is being panned.
		* @this {Render} Calling render.
		* @param {Point} pt Current canvas (!) mouse coordinates.
		* @returns {Point} Original point passed as argument.
		*/
		onPan = function (pt) {
			mzoom.xWorld -= (pt.x - mdrag.ptStart.x) / mzoom.s;
			mzoom.yWorld += (pt.y - mdrag.ptStart.y) / mzoom.s;
			update.call(this);
			return pt;
		},
		
		/**
		* Change the zoom factor.
		* @this {Render} Calling render.
		* @param {number} ds Change in zoom factor to apply.
		*/
		onZoom = function (ds) {
			mzoom.s *= ds;
			update.call(this);
		},
		
		// -------------------------------------------------
		//  Touch events.
		// -------------------------------------------------
		
		/**
		* Debugging text area for iPad testing.
		* @param {string} str String to append into debug area.
		*/
		txtLog = function (str) {
			var txt = document.querySelector('#txt');
			if (!txt) {
				txt = document.createElement('textarea');
				txt.id = 'txt';
				txt.setAttribute('rows', '12');
				txt.setAttribute('cols', '40');
				txt.style.position = 'fixed';
				txt.style.left = '0';
				txt.style.top = '0';
				txt.style.fontSize = '10px';
				document.body.appendChild(txt);
			}
			txt.value += str + '\n';
			txt.scrollTop = 1e5;
		},
		
		/**
		* Grab the touch points into the mdrag property.
		* @param {TouchesEvent} ev Triggering event.
		* @param {Point=} pt First point, if already known.
		* @returns {Array<Point>} Array of points.
		*/
		touchesToWorld = function (ev, pt) {
			var pts = 
				[
					pt || eventToWorld(ev.touches.item(0)),
					eventToWorld(ev.touches.item(1))
				];
			pts.w = Math.sqrt(
				(pts[0].x - pts[1].x) * (pts[0].x - pts[1].x) +
				(pts[0].y - pts[1].y) * (pts[0].y - pts[1].y)) || 1;
			return pts;
		},
		
		/**
		* Touches event up.
		* @param {TouchesEvent} ev Triggering touch event.
		*/
		onTouchEnd = function (ev) {
			if (ev.touches.length === 0) {
				document.removeEventListener('touchend', onTouchEnd, false);
				if (!mdrag.hasMoved) {
					onClick(mdrag.lastTouch);
				}
				mdrag.isDrag = mdrag.isPan = false;
				mdrag.element = null;
				updateHighlight();
			}
		},
		
		/**
		* Touches move.
		* @this {Render} Calling render.
		* @param {TouchesEvent} ev Triggering touch event.
		*/
		onTouchMove = function (ev) {
			var pts,
				mpts = mdrag.ptsStart;
			if (ev.touches.length === 1) {
				onMouseMove.call(this, ev.touches.item(0));
			} else if (ev.touches.length === 2) {
				pts = touchesToWorld(ev);
				mdrag.ptStart = onPan.call(this, worldToCanvas(
					0.5 * (pts[0].x + pts[1].x),
					0.5 * (pts[0].y + pts[1].y)))
				onZoom.call(this, pts.w / mpts.w);
				updateHighlight();
			}
			mdrag.hasMoved = true;
		},
		
		/**
		* Touch down event.
		* @this {Render} Calling render.
		* @param {TouchesEvent} ev Touches event.
		*/
		onTouchStart = function (ev) {
			var el,
				e = ev.touches.item(0),
				pt = !e ? null : eventToWorld(e);
			if (ev.touches.length === 1) {
				el = system.elementAtLocation(pt,
					LaserCanvas.Render.tolerance / mzoom.s);
				if (el) {
					mdrag.element = el;
					onDown.call(this, pt);
				}
				mdrag.ptStart = pt;     // Starting point for dragging elements.
				mdrag.hasMoved = false; // Hasn't moved - for click.
				mdrag.lastTouch = e;    // Last event - for click.
				document.addEventListener('touchend', onTouchEnd, false);
			} else if (ev.touches.length === 2) {
				mdrag.ptsStart = touchesToWorld(ev, pt);
				mdrag.ptStart = worldToCanvas(
					0.5 * (mdrag.ptsStart[0].x + mdrag.ptsStart[1].x),
					0.5 * (mdrag.ptsStart[0].y + mdrag.ptsStart[1].y));
				mdrag.hasMoved = true;
			}
			ev.preventDefault();
		},
		
		// Trigger an event. We need this because TouchMove events
		// only seem to fire if the move started within the canvas.
		// The event is explicitly triggered by LaserCanvas.js when
		// inserting a new element.
		// @this {Render} Rendering context.
		// @param {string} name Name of event to trigger.
		// @param {...} args Additional arguments passed to handler.
		triggerEvent = function (name, args) {
			if (name ==='touchmove') {
				return onTouchMove.apply(this, Array.prototype.slice.call(arguments, 1));
			}
		},
		
		// -------------------------------------------------
		//  Other methods.
		// -------------------------------------------------
		
		/**
		* Inspect the mode nearest the given point.
		* @param {Point} pt Point where to inspect.
		* @param {string=} filterBy Property name to filter segments by; or show info if NULL or missing.
		* @returns {object} Segment at the location.
		*/
		inspectLocation = function (pt, filterBy) {
			var s, sagw, tanw, // size = 25,  // {number} (mm) Marker size.
				modePlane = LaserCanvas.Enum.modePlane, // {number:modePlane} Plane to inspect.
				numberFormat = LaserCanvas.Utilities.numberFormat, // {function} Formatter for number.
				seg = system.segmentNearLocation(pt, filterBy),
				ptw = worldToCanvas(seg.x, seg.y),
				insp = document.querySelector('.laserCanvasInspect'),
				elli = insp.querySelector('.ellipse');

			// Position the inspector.
			insp.style.left = Math.round(ptw.x) + 'px';
			insp.style.top = Math.round(ptw.y) + 'px';
			
			// Fill the content.
			if (!filterBy) {
				sagw = system.inspectSegment(seg, modePlane.sagittal).w;
				tanw = system.inspectSegment(seg, modePlane.tangential).w;
				insp.querySelector('[data-dimension="sag"]').innerHTML = numberFormat(sagw);
				insp.querySelector('[data-dimension="tan"]').innerHTML = numberFormat(tanw);
				if (!isNaN(sagw) && !isNaN(tanw)) {
					s = Math.max(sagw, tanw);
					elli.style.width = (tanw / s) + 'em';
					elli.style.height = (sagw / s) + 'em';
					elli.style.display = 'inline-block';
				} else {
					elli.style.display = 'none';
				}
			}
			
			return seg;
		},
		
		/**
		* Insert a new element at the given point.
		* @param {Event} e Triggering element, including where to add element.
		* @param {string} elementName Name of element to insert.
		*/
		onInsert = function (e, elementName) {
			var pt = eventToWorld(e),
				element = system.insertElement(pt, elementName);
			fireEventListeners('elementClick', e, element);
		},
		
		// -------------------------------------------------
		//  Event listeners.
		// -------------------------------------------------
		
		/**
		* Fire registered event listeners.
		* @param {string} name Name of event to fire.
		* @param {...} args Arguments passed to listeners.
		*/
		fireEventListeners = function (name, args) {
			var k,
				listeners = meventListeners[name];
			for (k = 0; k < listeners.length; k += 1) {
				listeners[k].apply(this, Array.prototype.slice.call(arguments, 1));
			}
		},
		
		/**
		* Add a new event listener. The event is only added if it
		* is not already in the list.
		* @param {string} name Name of event to listen for.
		* @param {function} handler Method to call.
		*/
		addEventListener = function (name, handler) {
			var k,
				listeners = meventListeners[name];
			for (k = listeners.length - 1; k >= 0; k -= 1) {
				if (listeners[k] === handler) {
					break;
				}
			}
			if (k < 0) { // Not found: Add new listener.
				listeners.push(handler);
			}
		},
		
		/**
		* Remove an existing event listener.
		* @param {string} name Name of event to listen for.
		* @param {function} handler Method to call.
		*/
		removeEventListener = function (name, handler) {
			var k,
				listeners = meventListeners[name];
			for (k = listeners.length - 1; k >= 0; k -= 1) {
				if (listeners[k] === handler) {
					listeners.splice(k, 1);
				}
			}
		},
		
		// -------------------------------------------------
		//  Drawing methods.
		// -------------------------------------------------
		
		/**
		* Begin a new path.
		* @returns {Render} This object for chaining.
		*/
		beginPath = function () {
			getContext().beginPath();
			return this;
		},
		
		/**
		* Move to the given coordinates.
		* @param {number} x (mm) Horizontal location.
		* @param {number} y (mm) Vertical location.
		* @returns {Render} Self object for chaining.
		*/
		moveTo = function (x, y) {
			var pt = worldToCanvas(x, y);
			getContext().moveTo(pt.x, pt.y);
			return this;
		},
		
		/**
		* Line to the given coordinates.
		* @param {number} x (mm) Horizontal location.
		* @param {number} y (mm) Vertical location.
		* @returns {Render} Self object for chaining.
		*/
		lineTo = function (x, y) {
			var pt = worldToCanvas(x, y);
			getContext().lineTo(pt.x, pt.y);
			return this;
		},
		
		/**
		* Draw an arc at the given coordinates.
		* @param {number} x (mm) World horizontal location of arc origin.
		* @param {number} y (mm) World vertical location of arc origin.
		* @param {number} r (mm) World radius of arc.
		* @param {number} q0 (rad) Starting angle.
		* @param {number} q1 (rad) Ending angle.
		* @param {boolean} dir Direction to stroke.
		* @returns {Render} Self for chaining.
		*/
		arc = function (x, y, r, q0, q1, dir) {
			var pt = worldToCanvas(x, y, r);
			getContext().arc(pt.x, pt.y, pt.r, q0, q1, dir);
			return this;
		},
		
		/**
		* Stroke the current path.
		* @returns {Render} Self for chaining.
		*/
		stroke = function () {
			getContext().stroke();
			return this;
		},
	
		/**
		* Draw some text.
		* @param {string} text Text to draw.
		* @param {number} x Horizontal world coordinate where to draw.
		* @param {number} y Vertical world coordinate where to draw.
		* @param {number=} xem Horizontal offset, in (approximate) em units.
		* @param {number=} yem Vertical offset, in (approximate) em units.
		* @returns {Render} This object for chaining.
		*/
		fillText = function (text, x, y, xem, yem) {
			var em = 15, // {number} (px) Approximate em unit.
				pt = worldToCanvas(x, y);
			getContext().fillText(text, pt.x + (xem || 0) * em, pt.y + (yem || 0) * em);
			return this;
		},
	
		/**
		* Draw some text, centered (horizontally) on the
		* given location.
		* @param {string} text Text to draw.
		* @param {number} x Horizontal world coordinate where to draw.
		* @param {number} y Vertical world coordinate where to draw.
		* @param {number=} xem Horizontal offset, in (approximate) em units.
		* @param {number=} yem Vertical offset, in (approximate) em units.
		* @returns {Render} This object for chaining.
		*/
		centerText = function (text, x, y, xem, yem) {
			var ctx = getContext();
			save();
			ctx.textAlign = 'center';
			fillText(text, x, y, xem, yem);
			restore();
		},
	
		/**
		* Create a pattern fill for the canvas.
		* @param {Image} image Image to use as pattern fill.
		* @returns {Render} This object for chaining.
		*/
		createPattern = function (image) {
			var ctx = getContext(),
				pattern = ctx.createPattern(image, 'repeat');
			ctx.fillStyle = pattern;
			return this;
		},
	
		/**
		* Paint a path using SVG-like notation.
		* Path commands:
		*    M, L Move or Line to absolute location.
		*    m, l Move or Line relative location.
		* Actions:
		*    F    Fill the path.
		*    S    Stroke the path.
		* This method draws directly on the canvas (as opposed to
		* calling the Render object's methods) so that transformations
		* can be applied.
		* @param {string} cmd Path with M/m[ove] and L/l[ine] commands, as well as F[ill] and S[troke] actions.
		* @param {number} x0 Starting horizontal location.
		* @param {number} y0 Starting vertical location.
		* @param {number} q0 (rad) Object rotation.
		* @param {number} scl Scale factor for relative moves.
		* @returns {Render} This object for chaining.
		*/
		drawPath = function (cmd, x0, y0, q0, scl) {
			var k, step, dpt, c, 
				ptZ = null,          // {Point?} Closing point, if used.
				// RegExp: Match command of form  M 10,10.
				reOne = /(m|l)\s*([\d+-.]+)[, ]([\d+-.]+)/i,  // {RegExp} Regular expression to match one command.
				ctx = getContext(),  // {CanvasRenderingContext2d} Context where to render.
				s = mzoom.s,         // {number} Zoom scale factor.
				pt = {               // {Point} Current pen location.
					x: x0 || 0, 
					y: y0 || 0 
				},
				
				// Split into commands, see http://stackoverflow.com/questions/4681800/
				steps = cmd.match(/[a-df-z][^a-df-z]*/ig), // {Array<string>} Commands.
				actions = /[fsz]*$/i.exec(cmd); // Paint commands.
				
			// Defaults.
			q0 = q0 || 0;             // Default rotation: No rotation.
			scl = scl || 1;           // Default scale: Unity.
			actions = actions || 'S'; // Default action: Stroke.

			// Prepare transformation.
			ctx.save();
			ctx.translate(-mzoom.xWorld * s, mzoom.yWorld * s);
			ctx.translate(x0 * s, -y0 * s);
			ctx.translate(mzoom.xCanvas, mzoom.yCanvas);
			ctx.rotate(q0 || 0);
			
			// Assemble the path.
			this.beginPath();
			ctx.moveTo(pt.x * s, pt.y * s);
			for (k = 0; k < steps.length; k += 1) {
				step = reOne.exec(steps[k]);
				if (step) {
					c = step[1];      // {string} Move or line.
					dpt = {           // {Point} New or relative location.
						x: +step[2], 
						y: +step[3]
					};
					if ('M' === c || 'L' === c) {
						// Upper case is absolute.
						pt = dpt;
					} else {
						// Lowercase is relative move.
						pt.x += dpt.x * scl;
						pt.y += dpt.y * scl;
					}
					if ('m' === c.toLowerCase()) {
						ctx.moveTo(pt.x * s, -pt.y * s);
					} else {
						ctx.lineTo(pt.x * s, -pt.y * s);
					}
					if (ptZ === null) {
						ptZ = {
							x: pt.x,
							y: pt.y
						};
					}
				}
			}
			
			// Actions.
			if (/z/i.test(actions) && ptZ) {
				ctx.lineTo(ptZ.x * s, -ptZ.y * s);
			}
			if (/f/i.test(actions)) {
				ctx.fill();
			}
			if (/s/i.test(actions)) {
				this.stroke();
			}
			
			ctx.restore();
			return this;
		},
		
		/**
		* Draw the image at the given location.
		* @param {Image} image Image to draw.
		* @param {number} x (mm) Horizontal location where to draw.
		* @param {number} y (mm) Vertical location where to draw.
		* @param {number} q (rad) Rotation angle.
		* @returns {Render} This object for chaining.
		*/
		drawImage = function (image, x, y, q) {
			var ctx = getContext(),
				pt = worldToCanvas(x, y),
				s = Math.max(0.3, Math.min(2, mzoom.s));
			ctx.save();
			ctx.translate(pt.x, pt.y);
			ctx.rotate(q);
			ctx.scale(s, s);
			ctx.translate(-image.width / 2, -image.height / 2);
			ctx.drawImage(image, 0, 0);
			ctx.restore();
			return this;
		},
	
		/**
		* Save the current context state.
		* @returns {Render} This object for chaining.
		*/
		save = function () {
			getContext().save();
			return this;
		},
		
		/**
		* Translate the context origin.
		* @param {number} x (mm) Horizontal translation.
		* @param {number} y (mm) Vertical translation.
		* @returns {Render} This object for chaining.
		*/
		translate = function (x, y) {
			var pt = worldToCanvas(x, y);
				
			// When offsetting, we don't need to remove
			// the canvas origin again because it gets
			// added by the drawing functions.
			getContext().translate(
				pt.x - mzoom.xCanvas, 
				pt.y - mzoom.yCanvas);
			return this;
		},
		
		/**
		* Restore a previous context.
		* @returns {Render} This object for chaining.
		*/
		restore = function () {
			getContext().restore();
			return this;
		},
		
		/**
		* Set the stroke and line.
		* @param {string:ColorRef} strokeStyle Color of stroke to use.
		* @param {number} lineWidth Thickness of stroke to use.
		* @returns {Render} This object for chaining.
		*/
		setStroke = function (strokeStyle, lineWidth) {
			var ctx = getContext();
			ctx.strokeStyle = strokeStyle;
			ctx.lineWidth = lineWidth;
			return this;
		},
	
		// -------------------------------------------------
		//  Render system.
		// -------------------------------------------------
		
		/**
		* Clear the canvas.
		* @returns {Render} This object for chaining.
		*/
		clear = function () {
			canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
			return this;
		},
		
		/**
		* Draw the system.
		*/
		update = function () {
			save();
			getContext().font = '11pt "Open Sans",Helvetica,Arial,sans-serif';
			LaserCanvas.Render.update(system, this, mprop);
			restore();
			
			
			if (typeof globalRenderSvg !== 'undefined') {
				globalRenderSvg.update();
			}
		};
		
	/**
	* Initialization.
	*/
	(function (self) {
		var name,
			events = {
				'click': onClick,
				'mousemove': onMouseMove,
				'mousedown': onMouseDown,
				'touchstart': onTouchStart,
				'touchmove': onTouchMove,
				'wheel': onWheel
			};
		for (name in events) {
			if (events.hasOwnProperty(name)) {
				canvas.addEventListener(name, (function (handler) {
					return function (e) {
						handler.call(self, e);
					}
				}(events[name])), false);
			}
		}
		window.LaserCanvas.app
			// An interaction selector is clicked.
			// @param {string} name Name of interaction to change to.
			.addEventListener('interactionChange', function (name) {
				self.setInteraction(name);
			});
	}(this));
	
	/**
	* Public methods.
	*/
	this.addEventListener = addEventListener;       // Attach an event listener.
	this.getCanvas = getCanvas;                     // Retrieve this canvas element.
	this.getTransform = getTransform;               // Retrieve the mapping factors.
	this.getVariables = getVariables;               // Retrieve the current variable values.
	this.highlightElement = highlightElement;       // Sets or clears the element highlight.
	this.onInsert = onInsert;                       // Trigger to insert a new element.
	this.onResize = onResize;                       // Call in response to canvas resizing.
	this.property = property;                       // Set or retrieve a property value
	this.removeEventListener = removeEventListener; // Remove an existing event listener.
	this.resetTransform = resetTransform;           // Reset the world transform.
	this.setInteraction = setInteraction;           // Change the interaction mode.
	this.setVariablesGetter = setVariablesGetter;   // Set the callback to retrieve variable values.
	this.triggerEvent = triggerEvent;               // Explicitly trigger a DOM event.
	this.update = update;                           // Draw the given system.
	
	// Used by Elements for drawing.
	this.arc = arc;               // Draw an arc.
	this.beginPath = beginPath;   // Prepare a new path.
	this.centerText = centerText; // Fill text, centered on given location.
	this.clear = clear;           // Clear the canvas.
	this.createPattern = createPattern; // Create a pattern for filling.
	this.drawImage = drawImage;   // Draw an image.
	this.drawPath = drawPath;     // Draw a path using SVG-like commands.
	this.fillText = fillText;     // Draw some text.
	this.lineTo = lineTo;         // Line to drawing point.
	this.moveTo = moveTo;         // Move drawing point.
	this.restore = restore;       // Restore the previous context state.
	this.translate = translate;   // Translate the canvas.
	this.save = save;             // Save the current context state.
	this.setStroke = setStroke;   // Set stroke and line width.
	this.stroke = stroke;         // Stroke the current line.
};
}(window.LaserCanvas));

/**
* Update the system display. This may be used for the standard
* <canvas> renderer, or the <svg> renderer.
* @param {System} system System to render.
* @param {Render|RenderSvg} render Renderer where to draw.
* @param {object} options Rendering options 'showDistance'|'showAnnotation'|'drawMethod'.
*/
(function (LaserCanvas) {
LaserCanvas.Render.update = function (system, render, options) {
	var
		variables = render.getVariables(),
		drawMethod = (options || {}).drawMethod // {string} Drawing method to invoke on element.
			|| LaserCanvas.theme.current.drawMethod 
			|| 'draw',
		
		/**
		* Draw the space interval from one element to next.
		* @this {Render} Calling renderer.
		* @param {Element} element Starting element to draw from.
		* @param {Element} nextElement Next element to draw to.
		* @param {LaserCanvas.renderLayer} layer Layer to render.
		*/
		drawToNext = function (element, nextElement, layer) {
			var abcdQ, plane, n, ctx,
				renderLayer = LaserCanvas.Enum.renderLayer, // {Enum} Rendering layers.
				modePlane = LaserCanvas.Enum.modePlane, // {Enum} Rendering planes.
				loc = element.location(),         // {object} Element location.
				distanceToNext = element.get("distanceToNext", variables), // {number} (mm) Distance to next element.
				nextLoc = nextElement.location(); // {object} Next element location.
			
			switch (layer) {
				case renderLayer.axis:
					render.beginPath();
					render.setStroke('#000', 1);
					render.moveTo(loc.x, loc.y);
					render.lineTo(nextLoc.x, nextLoc.y);
					render.stroke();
					break;
					
				case renderLayer.distance:
					// Distance marker.
					if (distanceToNext > 0 
						&& typeof render.centerText === 'function') {
						render.centerText(Math.round(distanceToNext),
							(loc.x + nextLoc.x) / 2,
							(loc.y + nextLoc.y) / 2,
							0, 1);
					}
					break;
					
				case renderLayer.sagittal:
				case renderLayer.tangential:
					plane = layer === renderLayer.sagittal 
						? modePlane.sagittal : modePlane.tangential;
					abcdQ = element.abcdQ[plane];
					n = element.get("refractiveIndex") || 1;
					if (abcdQ) {
						renderMode(loc, {
							dist: distanceToNext,
							z0: abcdQ.z0,       // {number} (mm) Distance to waist.
							w0: abcdQ.w0 * 0.1, // {number} (um) Waist size.
							zR: abcdQ.zR,       // {number} (mm) Rayleigh length.
							n: n                // {number} Refractive index of material.
						}, plane);
					}
					break;
			}
		},
		

		/**
		* Render the mode for a single segment. The beam object
		* b has properties:
		*    dist Distance to next element. 
		*    z0   Initial distance to waist. 
		*    w0   Waist scaling factor. 
		*    zR   Rayleigh length. 
		*    n    Refractive index where propagating.
		* @param {object} Source element location and rotation.
		* @param {object} b Beam object.
		* @param {number:ModePlane} plane Plane for which to render.
		*/
		renderMode = function (loc, b, plane) {
			var 
				modeScale = 0.25,       // {number} Mode scale factor.
				cos = Math.cos(loc.q),  // {number} Cosine of segment rotation.
				sin = Math.sin(loc.q),  // {number} Sine of segment rotation.
				dist = b.dist,
				z0 = b.z0 * b.n,
				w0 = b.w0,
				zR = b.zR * b.n,
				k = 0,
				w = [],                 // {Array<number>} Spots sizes for way back. 
				z0R = -z0 / zR,         // Starting scaled position. 
				z1R = (dist - z0) / zR, // Ending scales position. 
				modePoints = LaserCanvas.Render.modePoints, // {object<Array<number>>} Tabulated curved mode points.
				wz = modePoints.wz,     // {Array<number>} Normalized propagation distance for tabulated mode points.
				ww = modePoints.ww,     // {Array<number>} Tabulated mode points.

				// Move or line to point.
				// @param {number} x (mm) Horizontal coordinate.
				// @param {number} y (mm) Vertical coordinate.
				// @param {boolean} isMove Value indicating whether action is move (TRUE) or line (FALSE, default).
				moveOrLine = function (x, y, isMove) {
					var 
						xo = loc.x + cos * x - sin * y * modeScale,
						yo = loc.y + sin * x + cos * y * modeScale;
					if (isMove) {
						render.moveTo(xo, yo);
					} else {
						render.lineTo(xo, yo);
					}
				},
				
				// Add a draw point to back array. 
				// @param {number} x (mm) Horizontal coordinate.
				// @param {number} y (mm) Vertical coordinate.
				// @param {boolean} isMove Value indicating whether action is move (TRUE) or line (FALSE, default).
				drawUp = function (x, y, isMove) {
					w.push({ x: x, y: y });
					moveOrLine(x, y, isMove);
				},

				// Draw a point opposite on way back down.
				drawDown = function () {
					var p,
						isMove = true;
					while(w.length > 0) {
						p = w.pop();
						moveOrLine(p.x, -p.y, isMove);
						isMove = false;
					}
				},

				// Calculate the mode using the full Gaussian propagation equation.
				// @param {number} d (mm) Distance along propagation segment. 
				// @returns {number} w (mm) Mode size.
				wd = function (d) {
					return LaserCanvas.systemAbcd.propagateParameters(b, b.n, d).w;
				};
				
			// Draw mode. (0=sagittal, 1=tangential, though not necessarily in that order.)
			render.beginPath();
			render.setStroke(LaserCanvas.theme.current.mode[plane], [1, 2][plane]);
			drawUp(0, wd(0), true); // First point. 
			for (k = 0; k < wz.length && wz[k] < z0R; k += 1) {
				// Skip points before starting position. 
			}
			for (; k < wz.length && wz[k] <= z1R; k += 1) { 
				// Draw points scaled to segment. 
				drawUp(wz[k] * zR + z0, ww[k] * w0); 
			}
			drawUp(dist, wd(dist)); // End point. 
			drawDown();             // Draw back down. 
			render.stroke();               // Draw.
			
			// Draw waist.
			if (z0 > 0 && z0 < dist) {
				render.beginPath();
				moveOrLine(z0, w0, true);
				moveOrLine(z0, -w0);
				render.stroke();
			}
		},

		/**
		* Update a single rendering layer.
		* @this {Render} Rendering object.
		* @param {LaserCanvas.renderLayer} layer Layer to render.
		*/
		updateLayer = function (layer) {
			var k, element, 
				elements = system.elements(),          // {Array<Element>} Elements in system.
				nextElement = elements[0];             // {Element} Starting element.
				
			for (k = 0; k < elements.length; k += 1) {
				element = nextElement;                 // Current element to draw, from previous iteration.
				nextElement = k < elements.length - 1  // Subsequent element:
					? elements[k + 1]                   // Next element in list, ..
					// TODO: Next element cycles to first in ring cavities.
					: null;                             // .. or no further elements.
					
				// Draw this element.
				if (typeof element[drawMethod] === 'function') {
					element[drawMethod](render, layer);
				}
				
				// Draw interval to next.
				if (nextElement !== null) {
					drawToNext(element, nextElement, layer); // Render space to next element.
				} else if (system.get("configuration") === LaserCanvas.System.configuration.ring) {
					drawToNext(element, elements[0], layer);
				}
			}
		},
		
		/**
		* Draw the system.
		*/
		update = function () {
			var renderLayer = LaserCanvas.Enum.renderLayer; // {Enum} Rendering layers.
			render.clear();
			updateLayer(renderLayer.axis);
			updateLayer(renderLayer.tangential); // Tangential is in the plane of the table.
			updateLayer(renderLayer.sagittal);   // Sagittal is vertical, out of plane.
			updateLayer(renderLayer.optics);
			
			if (options.showDistance) {
				updateLayer(renderLayer.distance);
			}
			if (options.showAnnotation) {
				updateLayer(renderLayer.annotation);
			}
		};
		
	// Trigger update.
	update();
};		
		
// Tolerance for finding optic at centerline.
LaserCanvas.Render.tolerance = 15;

// Pre-calculated mode plotting points for the
// curved beam mode around a waist.
LaserCanvas.Render.modePoints = {
	wz: [-6, -4, -2, -1, -0.8, -0.6, -0.4, -0.2, 0, 0.20, 0.40, 0.60, 0.80, 1.00, 2.00, 4.00, 6.00],
	ww: [6.08, 4.12, 2.24, 1.41, 1.28, 1.17, 1.08, 1.02, 1, 1.02, 1.08, 1.17, 1.28, 1.41, 2.24, 4.12, 6.08]
};

// Editing states.
LaserCanvas.Render.interaction = {
	insert: 'insert',   // Insert a new optic (it's being dragged in).
	inspect: 'inspect', // Inspect the mode size at given location.
	layout: 'layout'    // Adjust the layout of the cavity.
};
}(window.LaserCanvas));
