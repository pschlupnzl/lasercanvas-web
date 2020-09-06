/**
* Help class showing descriptive panels.
*/
(function (LaserCanvas) {
	"use strict";
	var
		HelpPanel = function () {
			this.pageIndex = 0; // {number} Currently shown page index.
			this.el = this.show();
			this.title = this.el.querySelector(".title"),
			this.scroller = this.el.querySelector(".body .scroller"),
			this.hint = this.el.querySelector(".hint"),
			this.goToPage(0);
		};

	HelpPanel.pages = [
		{
			title: "Drag to rearrange",
			body: [
				'<div class="drag-cavity">',
				'<div class="hoverer"></div>',
				'<div class="mode"></div>',
				'<div class="concave l"></div>',
				'<div class="concave r"></div>',
				'<div class="finger"></div>',
				'</div>'
			].join(""),
			hint: 'Drag by the centerline'
		},
		{
			title: "Add more elements",
			body: [
				'<div class="add-cavity">',
				'<div class="source lens"></div>',
				'<div class="mode full"></div>',
				'<div class="mode half l"></div>',
				'<div class="mode half r"></div>',
				'<div class="concave l"></div>',
				'<div class="concave r"></div>',
				'<div class="lens animated">',
				'<div class="finger"></div>',
				'</div>',
				'</div>'
			].join(""),
			hint: 'Drag elements into the cavity'
		},
		{
			title: "Use the inspector",
			body: [
				'<div class="inspect-cavity">',
				'<div class="mode"></div>',
				'<div class="concave l"></div>',
				'<div class="concave r"></div>',
				'<div class="laserCanvasInspect">',
				'<span data-dimension="sag"><span>100</span><span>200</span></span> ',
				'<span class="ellipse"></span> ',
				'<span data-dimension="tan"><span>200</span><span>100</span></span> ',
				'um</div>',
				'<div class="generalSelector">',
				'<div class="slider"></div>',
				'<div class="buttons">',
				'<div>Layout</div>',
				'<div>Inspect</div>',
				'<div class="finger"></div>',
				'</div>',
				'</div>',
				'</div>'
			].join(''),
			hint: 'View mode size anywhere in the cavity'
		},
		{
			title: "Detailed information",
			body: [
				'<div class="sidebar">',
				'<div class="toggle-info">',
				'<div class="finger"></div>',
				'</div>',
				'</div>'
			].join(''),
			hint: 'Full ABCD calculation in sidebar',
			onload: function (view) {
				var k,
					info = document.getElementById('LaserCanvasInfo'), // Sidebar.
					table = info.querySelector('table'),
					copy = table.cloneNode(true),
					inputs = copy.querySelectorAll('input,button');
				view.querySelector('.sidebar').appendChild(copy);
				for (k = inputs.length - 1; k >= 0; k -= 1) {
					inputs[k].disabled = true;
				}
			}
		},
		{
			title: "About",
			body: [
				'<ul class="about">',
				'<li>Laser modeling using the <em>ABCD</em> matrix calculations.</li>',
				'<li>(c) 2007 - 2020 Philip Schlup, PhD</li>',
				'<li><a href="mailto:lasercanvas@outlook.com">Send feedback</a></li>',
				'<li><a href="LasrCanv5.exe" download>Download</a> LaserCanvas 5 for Windows</li>',
				'</ul>',
			].join(''),
			hint: "LaserCanvas - Web"
		},
	];

	/** Singleton instance. */
	HelpPanel.singleton = null;

	/**
	 * (Static) Show a new help panel.
	 */
	HelpPanel.show = function () {
		if (HelpPanel.singleton) {
			HelpPanel.singleton.destroy();
		} else {
			HelpPanel.singleton = new HelpPanel();
		}
	};

	/**
	 * Creates the new help panel, returning the created element.
	 */
	HelpPanel.prototype.show = function () {
		var self = this,
			el = document.createElement('div');
		el.className = 'helpPanel';
		document.body.appendChild(el);
		el.innerHTML = [
			'<div class="title"></div>',
			'<div class="body"><div class="scroller"></div></div>',
			'<div class="hint"></div>',
			'<div class="footer">',
			'<button data-action="prev">Previous</button>',
			'<button data-action="next">Next</button>',
			'<button data-action="close">Close</button>',
			'</div>'
		].join('');

		this.activate(
			el.querySelector('button[data-action="prev"]'),
			el.querySelector('button[data-action="next"]'),
			el.querySelector('button[data-action="close"]'));

		return el;
	};

	/**
	 * Activate the buttons.
	 * @param {HTMLButtonElement} prev The Previous button.
	 * @param {HTMLButtonElement} next The Next button.
	 * @param {HTMLButtonElement} close The Close button.
	 */
	HelpPanel.prototype.activate = function (prev, next, close) {
		var self = this,
			updateDisabled = function () {
				prev.disabled = self.pageIndex === 0;
				next.disabled = self.pageIndex >= HelpPanel.pages.length - 1;
			};

		// Previous button goes to previous help panel.
		prev.onclick = function () {
			self.goToPage(self.pageIndex - 1);
			updateDisabled();
		};

		// Next button advances to next help panel.
		next.onclick = function () {
			self.goToPage(self.pageIndex + 1);
			updateDisabled();
		};

		// Close button.
		close.onclick = function () {
			self.destroy();
		};

		// Set button states now.
		updateDisabled();
	};

	/**
	 * Destroy this panel.
	 */
	HelpPanel.prototype.destroy = function () {
		this.el.parentElement.removeChild(this.el);
		if (HelpPanel.singleton === this) {
			HelpPanel.singleton = null;
		}
	};

	/**
	 * Go to the specified page.
	 * @param {number} pageIndex Index of page to show.
	 */
	HelpPanel.prototype.goToPage = function (pageIndex) {
		var 
			title = this.title,
			scroller = this.scroller,
			hint = this.hint,
			page = HelpPanel.pages[pageIndex];

		// Fade in the new title.
		var showNext = function () {
			title.innerHTML = page.title;
			hint.innerHTML = page.hint;
			setTimeout(function () { 
				title.setAttribute('data-show', 'true'); 
				hint.setAttribute('data-show', 'true');
			}, 0);
		};

		// Fade out the previous title.
		var hidePrev = function () {
			title.removeAttribute('data-show');
			hint.removeAttribute('data-show');
			setTimeout(showNext, 350);
		};

		// Fade or scroll in the body.
		var showBody = function (method) {
			var view = document.createElement('div');
			view.className = 'view';
			view.innerHTML = page.body;
			if (page.onload) {
				page.onload(view);
			}

			switch (method) {
				case 'fade':
					scroller.setAttribute('data-hide', 'true');
					setTimeout(function () {
						scroller.removeAttribute('data-hide');
					}, 0);
					scroller.appendChild(view);
					break;

				case 'next':
					scroller.setAttribute('data-scroll', 'next');
					setTimeout(function () {
						scroller.removeChild(scroller.firstChild);
						scroller.removeAttribute('data-scroll');
					}, 500);
					scroller.appendChild(view);
					break;

				case 'prev':
					scroller.setAttribute('data-scroll', 'prev-pre');
					setTimeout(function () {
						scroller.removeChild(scroller.lastChild);
						scroller.removeAttribute('data-scroll');
					}, 500);
					setTimeout(function () {
						scroller.setAttribute('data-scroll', 'prev');
					}, 0);
					scroller.insertBefore(view, scroller.firstChild);
					break;
			}
		}

		if (title.innerHTML.length > 0) {
			hidePrev();
			showBody(pageIndex > this.pageIndex ? 'next' : 'prev');
		} else {
			showNext();
			showBody('fade');
		}
		this.pageIndex = pageIndex;
	};

	LaserCanvas.HelpPanel = HelpPanel;
}(window.LaserCanvas));