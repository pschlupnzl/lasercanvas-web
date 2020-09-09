/**
 * Handler for the toolbar (dragging optics into system, etc.)
 */
(function (LaserCanvas) {
	var
		/**
		* Attach a click handler to the given selector item(s).
		* @param {string} sel Selector of item(s) to attach click handler to.
		* @param {function} onclick Click handler.
		*/
		attachClickHandler = function (sel, onclick) {
			LaserCanvas.Utilities.foreach(document.querySelectorAll(sel), function () {
				this.onclick = onclick;
			});
		};

	var Toolbar = function (msystem, mrender, fireEventListeners) {
		this.msystem = msystem;
		this.mrender = mrender;
		this.fireEventListeners = fireEventListeners;
	};

	/**
	 * Initialize the toolbar controls, such as theme and inspect mode.
	 */
	Toolbar.prototype.init = function (variablesGetter, variablesSetter) {
		var msystem = this.msystem,
			mrender = this.mrender,
			fireEventListeners = this.fireEventListeners,
		
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
			};
			
		attachClickHandler('[data-render-interaction="toggle"], button[data-render-interaction]', setInteraction);
		attachClickHandler('[data-set-theme="toggle"], button[data-set-theme]', setTheme);
		attachClickHandler('.toggleHelp', window.LaserCanvas.showHelp);
		attachClickHandler('[data-action="toggleRender"]', toggleRenderProperty);
		attachClickHandler('[data-action="toggleInfopanel"]', toggleInfoAttribute);

		// Listener for file Open button.
		window.LaserCanvas.SystemUtil.attachLoadListener(
			document.querySelector("[data-action='openFile'] > input"),
			msystem, mrender, variablesSetter);
		document.querySelector('button[data-action="download-svg"]').onclick = function () {
			// LaserCanvas.getScript('js/RenderSvg.js', function () {
				window.globalRenderSvg = new window.LaserCanvas.RenderSvg(msystem)
					.setVariablesGetter(variablesGetter)
					.update()
					.download();
			// }, this);
		};

		// On every change, store to local storage.
		var toLocalStorageDelayed = new LaserCanvas.Utilities.Debounce(2500);
		msystem.addEventListener("update", function () {
			toLocalStorageDelayed.delay(msystem.toJsonDestination, msystem, LaserCanvas.SystemUtil.toLocalStorage)
		});

		// Initialize from local storage, if possible.
		msystem.fromJsonSource(LaserCanvas.SystemUtil.fromLocalStorage);
		// msystem.fromJsonSource();
		return this;
	};

	/**
	 * Initialize the new system buttons.
	 */
	Toolbar.prototype.initSystemNew = function (launch) {
		var
			// Set a theme based on a button click.
			// @this {HTMLButtonElement} Triggering button.
			createSystem = function () {
				launch(this.getAttribute('data-create-system'));
			};

		attachClickHandler('button[data-create-system]', createSystem);
	};

	/**
	 * Initialize the interaction for dragging optical elements from the
	 * toolbar into the system.
	 */
	Toolbar.prototype.initDrag = function () {
		var mrender = this.mrender,
			k,
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
		return this;
	};

	LaserCanvas.Toolbar = Toolbar;
}(window.LaserCanvas));
