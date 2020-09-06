(function (LaserCanvas) {
/**
* Properties panel for optical elements.
* @param {Render} render Rendering engine to map locations to elements.
* @param {System} system System to interact with, e.g. to delete an element.
*/
LaserCanvas.PropertiesPanel = function (render, system) {
	var
		currentElement = null,                   // {Element} Current system element being edited.
		panel = document.createElement("div"),   // {HTMLDivElement} Panel DOM element.
		sellmeier = null,                        // {Sellmeier} Sellmeier panel, if used.
		rows = [],                               // {Array<InputPropertyRow>} Controls in the panel.
		
		// -------------------------------------------------
		//  Panel visibility.
		// -------------------------------------------------
		
		/**
		* Position the panel, constrained within the window,
		* and add document keyboard listeners for escape key.
		* @param {number=} x Horizontal position when showing, or FALSE when hiding.
		* @param {number=} y Vertical position when showing.
		*/
		showPanel = function (x, y) {
			var w, h,
				W = window.innerWidth,
				H = window.innerHeight;
			
			// Add listeners - ensure not already added.
			if (panel.getAttribute("data-visible") !== "true") {
				document.addEventListener("mousedown", onDocumentDown, false);
				document.addEventListener("touchstart", onDocumentTouch, false);
			}
			
			// Show the panel.
			panel.setAttribute("data-visible", "true");
			
			// Position (must be visible to get metrics).
			w = panel.offsetWidth;
			h = panel.offsetHeight;
			x = Math.max(0, Math.min(x - 0.5 * w, W - w));
			y = Math.max(0, Math.min(y + 16, H - h));
			panel.style.left = x + "px";
			panel.style.top = y + "px";
		},
		
		/**
		* Remove panel and listeners.
		*/
		hidePanel = function () {
			panel.removeAttribute("data-visible");
			clearRows();
			currentElement = null;
			document.removeEventListener("mousedown", onDocumentDown, false);
			document.removeEventListener("touchstart", onDocumentTouch, false);
			if (sellmeier) {
				sellmeier.hide();
			}
		},
		
		/**
		* Document down - remove panel.
		* @param {MouseEvent} e Triggering event.
		*/
		onDocumentDown = function (e) {
			var el = e.target, // {HTMLElement} Element that has the original event.
				re = /sellmeierPanel/; // {RegExp} Regular expression matching Sellmeier panel class
			
			// Check that event is outside of panel.
			while (el 
				&& el !== panel
				&& !re.test(el.className)) {
				el = el.parentNode;
			}
			
			// Close the panel if event happened outside if the panel.
			if (!el) {
				hidePanel();
			}
		},
		
		/**
		* Document touch start - remove panel.
		* @param {TouchesEvent} ev Triggering touches event.
		*/
		onDocumentTouch = function (ev) {
			if (ev.touches.length === 1) {
				return onDocumentDown.call(this, ev.touches.item(0));
			}
		},
		
		// ---------
		//  Events.
		// ---------
		
		/**
		* A property is changing.
		* @param {string} propertyName Name of property to change.
		* @param {number} newValue New value to set.
		*/
		onPropertyChange = function (propertyName, newValue) {
			var
				// Value indicating whether the system has changed, e.g. Dielectric plate / Brewster / crystal.
				systemChanged = propertyName === "type";
			currentElement.set(propertyName, newValue);
			system.update(true, systemChanged);
			if (systemChanged) {
				prepareProperties(currentElement);
			}
		},

		/**
		* The name of an element has changed.
		* @this {HTMLInputElement} The changed input field.
		*/
		onNameChange = function () {
			currentElement.name = this.value;
			system.update(); // No need for coordinate changes.
		},

		/** Manipulate the name field on key down events. */
		onNameKeydown = function (e) {
			switch (e.which || e.keyCode) {
				case 10:
				case 13:
				case 27:
					this.blur();
					return false;
			}
		},
		
		/**
		* The delete button is clicked on the current element.
		*/
		onDelete = function () {
			system.removeElement(currentElement);
			currentElement = null;
			hidePanel();
		},
		
		/**
		* The Sellmeier button is clicked.
		*/
		onSellmeier = function () {
			var 
				// The Sellmeier object is ready.
				ready = function () {
					var l = 1e-3 * system.get("wavelength"); // {number} (um) Wavelength.
					sellmeier.setApplyAction(onApplySellmeier); // Apply button to capture values.
					sellmeier.updateCalculation(l);
				};
				
			if (sellmeier) {
				sellmeier.show();
				ready();
			} else {
				sellmeier = new LaserCanvas.Sellmeier();
				ready();
			}
		},
		
		/**
		* Callback from Sellmeier panel to apply current values.
		* @param {object} prop Property values to set, "refractiveIndex", "indexDispersion", "groupVelocityDispersion".
		*/
		onApplySellmeier = function (prop) {
			LaserCanvas.Utilities.foreach(prop, function (propertyName, value) {
				if (currentElement.canSetProperty(propertyName)) {
					currentElement.set(propertyName, value);
				}
			});

			// Update system. Coordinates may change, e.g. Brewster-cut
			// crystal with new refractive index.
			system.update(true);
		},
		
		// -------------------------------------------------
		//  Fill properties.
		// -------------------------------------------------
		
		/**
		* Clear the existing control rows from the panel.
		*/
		clearRows = function () {
			var tr;
			panel.querySelector("h1 input").blur();
			while ((tr = panel.querySelector("tbody tr"))) {
				tr.parentNode.removeChild(tr);
			}
		},
		
		/**
		* Create the control panel for the given field.
		* The properties array can have members:
		*    propertyName  (required) Property key as used by the element.
		*    label         (optional) Display name, otherwise key is used.
		*    increment     (optional) Increment value for +/- buttons and up/down keys.
		*    standard      (optional) Array of standard values for &lt; / &gt; buttons.
		*/
		initRows = function () {
			var element = currentElement,
				props = element.userProperties(),
				tbody = panel.querySelector("tbody"),
				hasRefractiveIndex = props.some(function (prop) {  // {boolean} Value indicating whether the element has refractive index.
					return prop.propertyName === "refractiveIndex";
				});

			// Panel properties.
			panel.querySelector("h1 input").value = element.name;
			panel.setAttribute("data-can-delete", props.canDelete === false ? "false" : "true");

			// Refractive index button.
			panel.setAttribute("data-has-refractive-index", hasRefractiveIndex);

			// Table rows.
			return props
				.filter(function (prop) {
					return system.showElementProperty(prop.propertyName)
						&& element.canSetProperty(prop.propertyName);
				})
				.map(function (prop) {
					return new LaserCanvas.InputPropertyRow(prop, element, onPropertyChange)
						.appendTo(tbody);
				});
		},

		/** Update the rows. */
		update = function () {
			for (var row of rows) {
				row.update();
			}
		},

		/**
		* Read properties of the given element and fill
		* the ones that can be set.
		* @param {Element} el Element whose properties to set.
		*/
		prepareProperties = function (el) {
			currentElement = el;
			clearRows();
			rows = initRows();
		},
		
		/**
		* A mouse button is clicked on the canvas.
		* @param {MouseEvent} e Triggering event.
		* @param {Element?} el Clicked element, if any.
		*/
		onElementClick = function (e, el) {
			if (el && el.showProperties !== false) {
				prepareProperties(el);
				showPanel(e.pageX, e.pageY);
			}
		},
		
		/**
		* Activate the listeners on the static panel elements.
		*/
		activatePanel = function () {
			var input,
				onClick = function (sel, handler) {
					panel.querySelector(sel).onclick = handler;
				};
			
			// Draggable.
			LaserCanvas.localize(panel);
			LaserCanvas.Utilities.draggable(panel, {
				handle: panel.querySelector(".dragbar")
			});
			
			// Rename field.
			input = panel.querySelector("h1 input");
			input.onkeyup = input.onchange = onNameChange;
			input.onkeydown = onNameKeydown;
			
			// Buttons.
			onClick('button[data-action="close"]', hidePanel);
			onClick('button[data-action="sellmeier"]', onSellmeier);
			onClick('button[data-action="delete"]', onDelete);
		};
		
	// Construct panel.
	panel.innerHTML = LaserCanvas.PropertiesPanel.template;
	panel.className = "propertiesPanel";
	activatePanel();
	document.body.appendChild(panel);
	
	
	// Attach listener.
	render.addEventListener("elementClick", onElementClick);

	return {
		update: update
	};
};

/**
* Panel contents.
*/
LaserCanvas.PropertiesPanel.template = [
	'<div class="dragbar"></div>',
	'<h1>',
		'<input type="text" data-action="name" />',
		'<button data-action="close">X</button>',
	'</h1>',
	'<table class="banded">',
		'<thead>',
			'<tr>',
				'<th>Property</th>',
				'<th colspan="2">Value</th>',
			'</tr>',
			'<tr data-property-name="">',
				'<td><label></label></td>',
				'<td><input type="text"></td>',
				'<td data-content="unit"></td>',
			'</tr>',
		'</thead>',
		'<tbody>',
		'</tbody>',
	'</table>',
	'<div class="lcbuttons">',
		'<button class="lcbutton padded" data-action="sellmeier">',
			'<label data-localize="Sellmeier..."></label>',
		'</button>',
		'<button class="lcbutton padded" data-action="delete">',
			'<label data-localize="Delete"></label>',
		'</button>',
	'</div>'
].join("");
}(window.LaserCanvas));
