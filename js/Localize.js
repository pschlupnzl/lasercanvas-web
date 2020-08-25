/**
* Language localizations.
*/
window.LaserCanvas.localize = (function () {
	"use strict";
	var
		dict = {
			// Toolbar.
			"buttondark": "Dark",
			"buttoninspect": "Inspect",
			"buttonlayout": "Layout",
			"buttonlight": "Light",
			"buttonline": "Line",
	
			// Element symbols.
			"symboldielectric": "D",
			"symboldispersion": "DC",
			"symbollens": "L",
			"symbolmirror": "M",
			"symbolprism": "Pr",
			"symbolscreen": "I",

			// Property names.
			"abcdsag": "Sagittal ABCD",
			"abcdtan": "Tangential ABCD",
		},
		
		// Localize HTML or attribute on all child elements.
		// @param {HTMLElement} parent Element to localize.
		localizeAttribute = function (parent, attr) {
			window.LaserCanvas.Utilities.foreach(parent.querySelectorAll('[data-' + attr + ']'), function () {
				if (attr === 'localize') {
					this.innerHTML = localizeString(this.getAttribute('data-' + attr));
				} else {
					this.setAttribute(attr, localizeString(this.getAttribute('data-' + attr)));
				}
			});
		},
		
		// Localize children within an element.
		// @param {HTMLElement} parent Element to localize.
		// @returns {HTMLElement} Original element.
		localizeElement = function (parent) {
			localizeAttribute(parent, 'localize');
			localizeAttribute(parent, 'placeholder');
			return parent;
		},
		
		// Localize a single string.
		// @param {string} phrase Phrase to localize.
		// @returns {string} Localized phrase, or origin if not in dictionary.
		localizeString = function (phrase) {
			var str;
			if (dict && phrase) {
				str = dict[phrase.toLowerCase()];
			}
			return str || phrase;
		},
		
		// Translate a phrase or element.
		// @param {string|HTMLElement} arg Phrase or child element to localize.
		// @returns {string|HTMLElement} Translated phrase, or original if not in dictionary.
		loc = function (arg) {
			if (typeof arg === 'string') {
				return localizeString(arg);
			} else {
				return localizeElement(arg);
			}
		};
		
	// Set the dictionary.
	// @param {string} lang Language to set to.
	loc.set = function (lang) {
		dict = loc[lang];
	};
	
	// Localize elements with data-localize attribute.
	loc.elements = function () {
		var k, el, text,
			els = document.querySelectorAll('[data-localize]');
		for (k = els.length - 1; k >= 0; k -= 1) {
			el = els[k];
			text = loc(el.getAttribute('data-localize'));
			el.innerHTML = text;
		}
	};
	
	return loc;
}());

window.LaserCanvas.localize.de = {
	// New systems.

	// Toolbar.
	"buttondark": "Dunkel",
	"buttonlayout": "Arrangieren",
	"buttoninspect": "Untersuchen",
	"buttonlight": "Hell",
	"buttonline": "Liniert",
	
	// Element symbols.
	"symboldielectric": "D",
	"symboldispersion": "DK",
	"symbollens": "Li",
	"symbolmirror": "Sp",
	"symbolscreen": "i",
	
	// System labels.
	'linear resonator': 'Standwellenresonator',
	'end coated resonator': 'Resonator mit Endkristall',
	'ring resonator': 'Ringresonator',
	'propagation system': 'Lichtausbreitung',
	'system': 'Optisches System',
	
	// Properties panel.
	"angle of incidence": "Einfallswinkel",
	"brewster": "Brewsterwinkel",
	"crystal": "Kristall",
	"curvature": "Kr&uuml;mmungsradius",
	"curvature face 1": "Kr&uuml;mmungsradius 1",
	"curvature face 2": "Kr&uuml;mmungsradius 2",
	"delete": "L&ouml;schen",
	"distance to next": "Abstand",
	"face angle": "Schnittwinkel",
	"flip": "Wenden",
	"focal length": "Brennweite",
	"plate": "Blockelement",
	"radius of curvature": "Kr&uuml;mmungsradius",
	"refractive index": "Brechungsindex",
	"thermal lens": "Thermische Linse",
	"thickness": "L&auml;nge",
	"type": "Schnittart",
	
	// Info panel.
	"abcd sagittal": "ABCD Senkrecht",
	"abcd tangential": "ABCD Waagrecht",
	"annotations": "Anmerkungen anzeigen",
	"calculated values": "Berechnete Werte anzeigen",
	"distance": "Distanz",
	"element properties": "Elementeigenschaften anzeigen",
	"extended data": "Erweiterte Daten",
	"mode": "Modenradius",
	"mode size": "Modenradius",
	"mode spacing": "Modenabstand",
	"optical length": "Optische L&auml;nge",
	"physical length": "Physikalische L&auml;nge",
	"property": "Eigenschaft",
	"rayleigh": "Rayleigh",
	"sagittal": "Senkrecht",
	"separations": "Entfernungen anzeigen",
	"stability": "Stabilit&auml;t",
	"symbol": "Symbol",
	"tangential": "Waagrecht",
	"unit": "Einheit",
	"waist": "Taille",
	"wavelength": "Wellenl&auml;nge"
};

(function (lang) {
	var la = /^(de)/.exec(lang);
	if (la) {
		window.LaserCanvas.localize.set(la[1]);
	}
}(navigator.language));
