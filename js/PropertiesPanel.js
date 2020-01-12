/**
* Properties panel for optical elements.
* @param {Render} render Rendering engine to map locations to elements.
* @param {System} system System to interact with, e.g. to delete an element.
*/
window.LaserCanvas.PropertiesPanel = function (render, system) {
	"use strict";
	var
		currentElement = null,                   // {Element} Current system element being edited.
		panel = document.createElement('div'),   // {HTMLDivElement} Panel DOM element.
		sellmeier = null,                        // {Sellmeier} Sellmeier panel, if used.
		
		// -------------------------------------------------
		//  Utility methods.
		// -------------------------------------------------
		
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
			if (panel.getAttribute('data-visible') !== 'true') {
				document.addEventListener('mousedown', onDocumentDown, false);
				document.addEventListener('touchstart', onDocumentTouch, false);
				document.addEventListener('keyup', onDocumentKeyUp, false);
			}
			
			// Show the panel.
			panel.setAttribute('data-visible', 'true');
			
			// Position (must be visible to get metrics).
			w = panel.offsetWidth;
			h = panel.offsetHeight;
			x = Math.max(0, Math.min(x - 0.5 * w, W - w));
			y = Math.max(0, Math.min(y + 16, H - h));
			panel.style.left = x + 'px';
			panel.style.top = y + 'px';
		},
		
		/**
		* Remove panel and listeners.
		*/
		hidePanel = function () {
			panel.removeAttribute('data-visible');
			currentElement = null;
			document.removeEventListener('mousedown', onDocumentDown, false);
			document.removeEventListener('touchstart', onDocumentTouch, false);
			document.removeEventListener('keyup', onDocumentKeyUp, false);
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
		
		/**
		* Document key - remove panel on escape.
		* @param {KeyboardEvent} e Triggering event.
		*/
		onDocumentKeyUp = function (e) {
			if ((e.which || e.keyCode) === 27) {
				if (e.target.tagName === 'INPUT') {
					e.target.blur();
				} else {
					hidePanel();
				}
			}
		},
		
		/////**
		////* Retrieve the closest property table row.
		////* @param {HTMLElement} el Triggering element.
		////* @returns {HTMLTRElement} Table row.
		////*/
		////getPropertyRow = function (el) {
		////	while (el && !el.hasAttribute('data-property-name')) {
		////		el = el.parentNode;
		////	}
		////	return el;
		////},
		
		/**
		* Retrieve the property name from the given row element.
		* The property is stored on the table row, rather than
		* the individual input and button elements.
		* @param {HTMLElement} el Triggering element, which can also be the row itself.
		* @returns {string?} Property corresponding to element.
		*/
		getProperty = function (el) {
			return window.LaserCanvas.Utilities.closest(el, '[data-property-name]').getAttribute('data-property-name');
			////var tr = getPropertyRow(el);
			////return !tr ? null : tr.getAttribute('data-property-name'); // {string} Name of property to set on element.
		},
		
		/////**
		////* A property input value has changed.
		////* @this {HTMLInputElement|HTMLSelectElement} Element that triggered the handler.
		////*/
		////onPropertyInputChange = function () {
		////	var propertyName = getProperty(this),
		////		val = this.value,    // {string} Current value.
		////		newValue = +val;     // {number} Numeric value.
		////	if (!isNaN(newValue)) {
		////		propertyChange(propertyName, newValue);
		////	}
		////},
		
		/**
		* A property dropdown has changed. This causes the
		* window to be re-drawn.
		* @this {HTMLSelectElement} Element that triggered the handler.
		*/
		onPropertySelectChange = function () {
			var propertyName = getProperty(this),
				val = this.value; // {string} Current value.
			propertyChange(propertyName, val, true); // Update system, including 'change' event.
			prepareProperties(currentElement);
		},
		
		/**
		* A property checkbox has changed.
		* @this {HTMLInputElement} Checkbox element that triggered the handler.
		*/
		onPropertyCheckChange = function () {
			var propertyName = getProperty(this),
				val = this.checked; // {boolean} Current value.
			propertyChange(propertyName, val);
		},
		
		/////**
		////* A property step button (increment, decrement) is clicked.
		////* @this {HTMLButtonElement} Clicked button.
		////*/
		////onPropertyStep = function () {
		////	propertyStep(getProperty(this),
		////		this.getAttribute('data-action'),
		////		+this.getAttribute('data-step'));
		////},
		////
		/////**
		////* Attach an event handler that blurs the input
		////* field when the enter key is pressed.
		////* @this {HTMLInptElement} Triggering input field.
		////* @param {KeyboardEvent} e Triggering event.
		////*/
		////onKeydown = function (e) {
		////	var tr, propertyName, step;
		////	switch (e.keyCode) {
		////		case 10: // Enter.
		////		case 13: // Return.
		////			this.blur();
		////			break;
		////		case 38: // Up.
		////		case 40: // Down.
		////			tr = getPropertyRow(this);
		////			if (tr) {
		////				propertyName = getProperty(tr);
		////				step = e.keyCode === 38 ? +1 : -1;
		////				if ((e.ctrlKey || e.metaKey)
		////					&& tr.hasAttribute('data-standard')) {
		////					propertyStep(propertyName, 'standard', step);
		////				} else if (tr.hasAttribute('data-increment')) {
		////					if (e.ctrlKey || e.metaKey || e.shiftKey) {
		////						propertyStep(propertyName, 'increment', 10 * step);
		////					} else {
		////						propertyStep(propertyName, 'increment', step);
		////					}
		////				}
		////				e.preventDefault();
		////			}
		////			break;
		////	}
		////},
		
		// -------------------------------------------------
		//  Manipulate element.
		// -------------------------------------------------
		
		/**
		* A property is changing.
		* @param {string} propertyName Name of property to change.
		* @param {number} newValue New value to set.
		* @param {boolean=} systemChanged Value indicating whether the system has changed, e.g. Dielectric plate / Brewster / crystal.
		*/
		propertyChange = function (propertyName, newValue, systemChanged) {
			currentElement.property(propertyName, newValue);
			system.update(true, systemChanged);
		},

		/////**
		////* Increment a value or standard value.
		////* @param {string} propertyName Name of property to change.
		////* @param {string} action Action 'set'|'standard'|'increment'.
		////* @param {number} step Step size to take.
		////*/
		////propertyStep = function (propertyName, action, step) {
		////	var k, input, std, wrap, min, max, value,
		////		numberFormat = window.LaserCanvas.Utilities.numberFormat, // {function} Formatting a number.
		////		tr = panel.querySelector('[data-property-name="' + propertyName + '"]');
      ////
		////	if (tr) {
		////		std = tr.getAttribute('data-' + action); // {string} Standard values.
		////		wrap = +tr.getAttribute('data-wrap');    // {number=} Wrapping.
		////		min = tr.hasAttribute('data-min') ? +tr.getAttribute('data-min') : null; // {number?} Minimum value.
		////		max = tr.hasAttribute('data-max') ? +tr.getAttribute('data-max') : null; // {number?} Maximum value.
		////		input = tr.querySelector('input');
		////		value = +input.value;
		////		
		////		if (!isNaN(value)) {
		////			if (action === 'set') {
		////				value = step;
		////			} else if (action === 'increment') {
		////				value += +std * step;
		////			} else if (action === 'standard') {
		////				std = std.split(',');
		////				if (step > 0) {
		////					for (k = 0; k < std.length - step - 1; k += 1) {
		////						if (+std[k + 1] > value) {
		////							break;
		////						}
		////					}
		////				} else {
		////					for (k = std.length - 1; k > -step; k -= 1) {
		////						if (+std[k - 1] < value) {
		////							break;
		////						}
		////					}
		////				}
		////				value = +std[k + step];
		////			}
		////			
		////			if (wrap) {
		////				while (value > wrap) {
		////					value += -2 * wrap;
		////				}
		////				while (value < -wrap) {
		////					value += 2 * wrap;
		////				}
		////			}
		////			if (min !== null) {
		////				value = Math.max(value, min);
		////			}
		////			if (max !== null) {
		////				value = Math.min(value, max);
		////			}
		////			input.value = numberFormat(value);
		////			propertyChange(propertyName, value);
		////		}
		////	}
		////},

		/**
		* The name of an element has changed.
		* @this {HTMLInputElement} The changed input field.
		*/
		onNameChange = function () {
			currentElement.name = this.value;
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
					var l = 1e-3 * system.property('wavelength'); // {number} (um) Wavelength.
					sellmeier.setApplyAction(onApplySellmeier); // Apply button to capture values.
					sellmeier.updateCalculation(l);
				};
				
			if (sellmeier) {
				sellmeier.show();
				ready();
			} else {
				sellmeier = new window.LaserCanvas.Sellmeier();
				ready();
			}
		},
		
		/**
		* Callback from Sellmeier panel to apply current values.
		* @param {object} prop Property values to set, 'refractiveIndex', 'indexDispersion', 'groupVelocityDispersion'.
		*/
		onApplySellmeier = function (prop) {
			window.LaserCanvas.Utilities.foreach(prop, function (propertyName, value) {
				var input = panel.querySelector('input[data-property-name="' + propertyName + '"]');
				if (input
					&& currentElement.canSetProperty(propertyName)) {
					window.LaserCanvas.Element.propertyStep(input, 'set', value, currentElement, system);
				}
			});

			////var propertyName;
			////console.log(prop);
			////for (propertyName in prop) {
			////	if (prop.hasOwnProperty(propertyName)
			////		&& currentElement.canSetProperty(propertyName)) {
			////		currentElement.property(propertyName, prop[propertyName]);
			////	}
			////}
		},
		
		// -------------------------------------------------
		//  Fill properties.
		// -------------------------------------------------
		
		/**
		* Clear the existing control rows from the panel.
		*/
		clearControls = function () {
			var tr;
			while ((tr = panel.querySelector('tbody tr'))) {
				tr.parentNode.removeChild(tr);
			}
		},
		
		/**
		* Swap out the input field for a drop-down menu.
		* @param {HTMLInputElement} input Input field to replace.
		* @param {Array<string>} options Options to append to input menu.
		* @returns {HTMLSelectElement} Newly created select menu.
		*/
		inputAsMenu = function (input, options) {
			var k, opt,
				select = document.createElement('select'), // {HTMLSelectMenu} The new menu.
				parent = input.parentNode, // {HTMLElement} Parent of element to substitute.
				sibling = parent.nextElementSibling; // {HTMLTDElement} Next cell for merging.
				
			// Assemble options.
			for (k = 0; k < options.length; k += 1) {
				opt = document.createElement('option');
				opt.value = options[k];
				opt.text = window.LaserCanvas.localize(options[k]);
				select.appendChild(opt);
			}
			
			// Swap out for input box.
			parent.insertBefore(select, input);
			parent.removeChild(input);
			
			// Merge this and units cell.
			if (parent.nodeName === 'TD'
				&& sibling.getAttribute('data-content') === 'unit') {
				parent.colSpan = 2;
				sibling.parentNode.removeChild(sibling);
			}
			
			return select;
		},
		
		/**
		* Create a single row of controls for the given element.
		* The property elements can have these properties:
		*    propertyName {string}        Property name as used by element.
		*    label        {string=}       Optional label to use in place of pretty print propertyName.
		*    unit         {string=}       Optional unit to display.
		*    options      {Array<string>} For drop-down menu, array of option strings.
		*    dataType     {string}        Set to 'boolean' to create a checkbox.
		*    increment    {number}        Step size with buttons or arrow keys (x10 for Shift+arrow).
		*    min          {number}        Minimum permitted value.
		*    max          {number}        Maximum permitted value.
		*    standard     {Array<number>} Values to step through with prev/next buttons or Ctrl+arrow keys.
		* @param {Element} element Optical element whose properties to set.
		* @param {object} prop Property to set.
		*/
		createSingleControl = function (element, prop) {
			var val,
				LaserCanvas = window.LaserCanvas,          // {object} LaserCanvas namespace.
				prettify = LaserCanvas.Utilities.prettify, // {function} Pretty print name.
				localize = LaserCanvas.localize,           // {function} Localize text.
				numberFormat = LaserCanvas.Utilities.numberFormat, // {function} Formatted number.
				unit = LaserCanvas.unit,                   // {object} Units for each property.
				propertyName = prop.propertyName,          // {string} Name of this property.
				tbody = panel.querySelector('tbody'),      // {HTMLTBodyElement} Table body where to append row.
				tmpl = panel.querySelector('thead tr[data-property-name]'), // {HTMLTRElement} Template row.
				tr = tmpl.cloneNode(true),                 // {HTMLTRElement} Table row to fill.
				input = tr.querySelector('input');         // {HTMLInputElement} Main input text field.

			// Set row labels.
			tr.querySelector('label').innerHTML = localize(prop.label || prettify(propertyName));
			tr.querySelector('[data-content="unit"]').innerHTML = unit[propertyName] || '';
			
			// Property field.
			input.setAttribute('data-property-name', propertyName);
			if (element.canSetProperty(propertyName)) {
				// Prepare the row.
				tr.setAttribute('data-property-name', propertyName);
				
				// Other input types.
				if (prop.hasOwnProperty('options')) {
					input = inputAsMenu(input, prop.options);
				} else if (prop.dataType === 'boolean') {
					input.type = 'checkbox';
				}
				
				// Set the value.
				val = element.property(propertyName);
				if (typeof val === 'boolean') {
					input.checked = val;
				} else if (typeof val === 'number') {
					input.value = numberFormat(val);
				} else {
					input.value = val.toString();
				}
				////window.LaserCanvas.Utilities.foreach(
				////	['increment', 'standard', 'wrap', 'min', 'max'], 
				////	function (k, key) {
				////	if (prop.hasOwnProperty(key)) {
				////		tr.setAttribute('data-' + key, 
				////			Array.isArray(prop[key]) 
				////			? prop[key].join(',') 
				////			: prop[key]);
				////	}
				////});
			} else {
				input.disabled = true;
			}
			tbody.appendChild(tr);
		},
		
		/**
		* Create the control panel for the given field.
		* The properties array can have members:
		*    propertyName  (required) Property key as used by the element.
		*    label         (optional) Display name, otherwise key is used.
		*    increment     (optional) Increment value for +/- buttons and up/down keys.
		*    standard      (optional) Array of standard values for &lt; / &gt; buttons.
		*/
		createControls = function () {
			var k,
				el = currentElement, // {Element} el Optical element whose properties to adjust.
				props = el.userProperties(), // {Array<object>} Properties.
				hasRefractiveIndex = false;  // {boolean} Value indicating whether the element has refractive index.
				
			// Panel properties.
			panel.querySelector('h1 input').value = currentElement.name;
			panel.setAttribute('data-can-delete', props.canDelete === false ? 'false' : 'true');
			
			// Table rows.
			for (k = 0; k < props.length; k += 1) {
				if (props[k].propertyPanel !== false
					&& system.showElementProperty(props[k].propertyName)) {
					createSingleControl(el, props[k]);
					hasRefractiveIndex = hasRefractiveIndex || (props[k].propertyName === 'refractiveIndex');
				}
			}
			
			// Refractive index button.
			panel.setAttribute('data-has-refractive-index', hasRefractiveIndex);
		},
		
		/**
		* Activate the input and buttons for the given element.
		*/
		activateControls = function () {
			var Utilities = window.LaserCanvas.Utilities;

			////// Input fields.
			////Utils.foreach(panel.querySelectorAll('tbody input[type="text"]'), function (k, input) {
			////	input.onkeydown = onKeydown;
			////	input.onkeyup = onPropertyInputChange;
			////});
			
			// Fancy input fields.
			window.LaserCanvas.Element.inputProperties(panel, currentElement, system);
			
			// Select menus.
			Utilities.foreach(panel.querySelectorAll('tbody select'), function (k, select) {
				select.onchange = onPropertySelectChange;
			});
			
			// Check boxes.
			Utilities.foreach(panel.querySelectorAll('tbody input[type="checkbox"]'), function (k, chk) {
				chk.onchange = onPropertyCheckChange;
			});
			
			////// Property step buttons.
			////Utils.foreach(panel.querySelectorAll('button[data-action][data-step]'), function (k, but) {
			////	but.onclick = onPropertyStep;
			////});
		},
	
		/**
		* Read properties of the given element and fill
		* the ones that can be set.
		* @param {Element} el Element whose properties to set.
		*/
		prepareProperties = function (el) {
			currentElement = el;
			clearControls();
			createControls();
			activateControls();
			window.LaserCanvas.localize(panel);
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
			var el;
			
			// Draggable.
			window.LaserCanvas.Utilities.draggable(panel, {
				handle: panel.querySelector('.dragbar')
			});
			
			// Close button.
			el = panel.querySelector('button[data-action="close"]');
			el.onclick = function () {
				hidePanel();
			};
			
			// Rename field.
			el = panel.querySelector('h1 input');
			////el.onkeydown = onKeydown;
			el.onchange = onNameChange;
			
			// Sellmeier button.
			el = panel.querySelector('button[data-action="sellmeier"]');
			el.onclick = onSellmeier;
			
			// Delete button.
			el = panel.querySelector('button[data-action="delete"]');
			el.onclick = onDelete;
		};
		
	// Construct panel.
	panel.innerHTML = window.LaserCanvas.PropertiesPanel.html;
	panel.className = 'propertiesPanel';
	activatePanel();
	document.body.appendChild(panel);
	
	
	// Attach listener.
	render.addEventListener('elementClick', onElementClick);
};

/**
* Panel contents.
*/
window.LaserCanvas.PropertiesPanel.html = [
	'<div class="dragbar"></div>',
	'<h1>',
		'<input type="text" data-action="name" disabled="disabled" />',
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
				////'<td>',
				////	'<button class="lcbutton" data-action="standard" data-step="-1">&lt;</button>',
				////	'<button class="lcbutton" data-action="increment" data-step="-1">&minus;</button>',
				////'</td>',
				'<td><input type="text"></td>',
				'<td data-content="unit"></td>',
				////'<td>',
				////	'<button class="lcbutton" data-action="increment" data-step="+1">+</button>',
				////	'<button class="lcbutton" data-action="standard" data-step="+1">&gt;</button>',
				////'</td>',
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
].join('');