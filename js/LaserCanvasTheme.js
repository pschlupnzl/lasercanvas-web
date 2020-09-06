/**
* Laser Canvas - Theme graphics.
*/
window.LaserCanvas.theme.baseUrl = 'res/';

window.LaserCanvas.theme.dark = {
	block: 'Block.png',
	blockFill: 'Block-Fill.png',
	grid: 'Grid.png',
	lensConcave: 'Lens-Concave.png',
	lensConvex: 'Lens-Convex.png',
	mirrorConcave: 'Mirror-Concave.png',
	mirrorConcaveMore: 'Mirror-Concave-More.png',
	mirrorConvex: 'Mirror-Convex.png',
	mirrorConvexMore: 'Mirror-Convex-More.png',
	mirrorPlane: 'Mirror-Plane.png',
	screen: 'Screen.png',
	mode: ['#cc3333', '#6666ff'],
};

window.LaserCanvas.theme.light = {
	block: 'Block-Light.png',
	blockFill: 'Block-Fill-Light.png',
	grid: 'Grid-Light.png',
	lensConcave: 'Lens-Concave-Light.png',
	lensConvex: 'Lens-Convex-Light.png',
	mirrorConcave: 'Mirror-Concave-Light.png',
	mirrorConcaveMore: 'Mirror-Concave-More-Light.png',
	mirrorConvex: 'Mirror-Convex-Light.png',
	mirrorConvexMore: 'Mirror-Convex-More-Light.png',
	mirrorPlane: 'Mirror-Plane-Light.png',
	screen: 'Screen-Light.png',
	mode: ['#c73838', '#3333cc']
};

window.LaserCanvas.theme.line = {
	block: 'Block-Line.png',
	blockFill: 'Block-Fill-Line.png',
	grid: null,
	lensConcave: 'Lens-Concave-Line.png',
	lensConvex: 'Lens-Convex-Line.png',
	mirrorConcave: 'Mirror-Concave-Line.png',
	mirrorConcaveMore: 'Mirror-Concave-More-Line.png',
	mirrorConvex: 'Mirror-Convex-Line.png',
	mirrorConvexMore: 'Mirror-Convex-More-Line.png',
	mirrorPlane: 'Mirror-Plane-Line.png',
	screen: 'Screen-Line.png',
	mode: ['#c73838', '#3333cc'],
	drawMethod: 'wireframe'
};

/**
* Set a new theme.
* @param {string} name Name of theme to set.
* @param {function=} fnComplete Function to execute once images preloaded.
*/
window.LaserCanvas.theme.set = (function () {
	"use strict";

	// See e.g. https://davidwalsh.name/essential-javascript-functions
	// and http://www.hunlock.com/blogs/Totally_Pwn_CSS_with_Javascript.
	var style = document.createElement('style');    // Create new style sheet.
	style.appendChild(document.createTextNode('')); // Webkit hack.
	document.head.appendChild(style);               // Append to page.
	
	return function (name, fnComplete) {
		var current = window.LaserCanvas.theme[name], // Image URLs to use.
			
			// Write images into DOM elements, e.g. buttons,
			// that are expecting theme graphics.
			// @param {string} image Key of image to use.
			themeDomElements = function (image) {
				var k, el,
					html = '<img src="image_url" />', // {string} Template content to use.
					url = current[image],             // {string} Address to image.
					els = document.querySelectorAll('[data-theme-image="' + image + '"]');
				for (k = els.length - 1; k >= 0; k -= 1) {
					el = els[k];
					el.innerHTML = html.replace('image_url', window.LaserCanvas.theme.baseUrl + url);
				}
			},
			
			// Load image items.
			loadImages = function () {
				var k, img,
					images = current, // {object<string>:<string> URLs of images to use.
					semaphore = 1,    // {number} Count of remaining loads.
					ready = function () {
						if ((semaphore -= 1, semaphore) > 0) return;
						fnComplete && fnComplete();
					};

				delete window.LaserCanvas.theme.current.drawMethod;
				
				for (k in images) {
					if (images.hasOwnProperty(k) 
						&& k !== 'grid'
						&& k !== 'drawMethod'
						&& typeof images[k] === 'string') {
						semaphore += 1;
						img = new Image();
						img.onload = ready;
						img.src = window.LaserCanvas.theme.baseUrl + images[k];
						themeDomElements(k);
						window.LaserCanvas.theme.current[k] = img;
					} else {
						window.LaserCanvas.theme.current[k] = images[k];
					}
				}
				
				ready();
			};

		if (current.grid) {
			style.sheet.insertRule(`[data-theme="${name}"] .laserCanvasFrame { background-image: url(${window.LaserCanvas.theme.baseUrl + current.grid}); }`, 0);
		}
		document.body.setAttribute('data-theme', name);
		loadImages();
	};
}());

