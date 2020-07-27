/**
* Laser Canvas math utility functions.
*/

window.LaserCanvas.Math = {};

(function () {
	"use strict";
	var Vector, Matrix2x2;
	
	// ----------------------------------------------------
	//  Vector class.
	// ----------------------------------------------------
	
	/**
	* Vector class, instantiated with either an array of numbers, or multiple arguments.
	* @param {Array<number>} els Vector coordinates to assign.
	*/
	Vector = function (els) {
		var k;
		if (els.length) {
			// Array of numbers.
			this.length = els.length;
			for (k = 0; k < this.length; k += 1) {
				this[k] = els[k];
			}
		} else {
			// Individual arguments.
			return new Vector(Array.prototype.slice.call(arguments, 0));
		}
	};
	

	Vector.fn = Vector.prototype = {
		constructor: Vector,
		
		// These make the object appear like an Array.
		length: 0,
		push: [].push,
		splice: [].splice,

		/**
		* Iterate over elements in the vector. The function
		* receives as arguments the index loop counter, the
		* kth object coordinate, and the kth bvec coordinate
		* if supplied. The function can return a value to
		* assign to the kth coordinate.
		* @param {function} fn Function to iterate.
		* @param {Vector=} bvec Second vector to pass, if any.
		*/
		foreach: function (fn, bvec) {
			var k, val;
			for (k = 0; k < this.length; k += 1) {
				val = fn(k, this[k], bvec ? bvec[k] : undefined);
				if (val !== undefined) {
					this[k] = val;
				}
			}
		},
		
		/** 
		* Gets the magnitude squared of the vector.
		* @returns {number} Magnitude squared of vector.
		*/
		norm2: function () {
			var norm2 = 0;      // {number} Accumulated norm squared.
			this.foreach(function (k_notused, vk) {
				norm2 += vk * vk;
			});
			return norm2;
		},
		
		/**
		* Gets the magnitude of the vector.
		* @returns {number} Length of vector.
		*/
		norm: function () {
			return Math.sqrt(this.norm2());
		},
		
		/**
		* Gets a normalized representation of the vector.
		* @returns {Vector} A new vector with normalized coordinates.
		*/
		normalize: function () {
			var norm = this.norm(),  // {number} Vector norm.
				u = new Vector(this); // {Array<number>} Normalized coordinates.
			if (norm !== 0) {
				u.foreach(function (k_notused, uk) {
					return uk / norm;
				});
			}
			return u;
		},
		
		/**
		* Gets the four quadrant arc tangent of the vector.
		* @returns {number} Four quadrant arc tangent of the vector.
		*/
		atan2: function () {
			return Math.atan2(this[1], this[0]);
		},
		
		/**
		* Add the given vector to this vector.
		* @param {Vector} bvec Vector to add.
		* @returns {Vector} New vector sum.
		*/
		add: function (bvec) {
			var a = new Vector(this);
			a.foreach(function(k_notused, ak, bk) {
				return ak + bk;
			}, bvec);
			return a;
		},
		
		/**
		* Subtract the given vector from this vector.
		* @param {Vector} bvec Vector to subtract.
		* @returns {Vector} New vector difference.
		*/
		subtract: function (bvec) {
			var a = new Vector(this);
			a.foreach(function (k_notused, ak, bk) {
				return ak - bk;
			}, bvec);
			return a;
		},
		
		/**
		* Scale the vector by the given scalar.
		* @param {number} s Scalar scale factor.
		* @returns {Vector} New vector with scaled coordinates.
		*/
		scale: function (s) {
			var a = new Vector(this);
			a.foreach(function (k_notused, ak) {
				return s * ak;
			});
			return a;
		},
		
		/**
		* Negate the coordinates of the current vector.
		* @returns {Vector} New vector with negated coordinates.
		*/
		negate: function () {
			return this.scale(-1);
		},
		
		/**
		* Calculate the dot product between this and the given vector.
		* @param {Vector} bvec Vector with which to calculate the dot product.
		* @returns {number} Dot product.
		*/
		dot: function (bvec) {
			var dot = 0;      // {number} Accumulated dot product.
			this.foreach(function (k_notused, ak, bk) {
				dot += ak * bk;
			}, bvec);
			return dot;
		},

		/**
		* Calculate a dot product between this and the given vector,
		* normalizing both vectors and ensuring that the resultant
		* value is within the range [-1 .. +1].
		* @param {Vector} bvec Vector with which to calculate the dot product.
		* @returns {number} Normalized dot product.
		*/
		normalizeDot: function (bvec) {
			var ndot = this.dot(bvec)
					/ Math.sqrt(this.norm2() * bvec.norm2());
			return ndot < -1 ? -1 :
				ndot > +1 ? +1 :
				ndot;
		},
		
		/**
		* Calculate the cross product between this and the given vector.
		* @param {Vector} bvec Vector with which to calculate the cross product.
		* @returns {number|Vector} For 2-vectors: Magnitude of cross product; 3-vectors: Cross product vector.
		*/
		cross: function (bvec) {
			if (this.length === 2) {
				return this[0] * bvec[1] - this[1] * bvec[0];
			}
			if (this.length === 3) {
				return new Vector([
					this[1] * bvec[2] - this[2] * bvec[1],
					this[2] * bvec[0] - this[0] * bvec[2],
					this[0] * bvec[1] - this[1] * bvec[0]
				]);
			}

			throw 'Cannot calculate cross product for ' + this.length + '-vectors.';
		},
		
		/**
		* Returns a new vector representing this vector rotated by a given angle.
		* @param {number} q (rad) Rotation angle.
		*/
		rotate: function (q) {
			var cs = Math.cos(q), // {number} Cosine of rotation angle.
				sn = Math.sin(q);  // {number} Sine of rotation angle.
			return new Vector([
				 this[0] * cs + this[1] * sn,
				-this[0] * sn + this[1] * cs]);
		},
		
		/**
		* Multiply by a matrix.
		* @param {Matrix} mx Matrix to multiply by.
		* @returns {Vector} A new vector multiplied by the matrix.
		*/
		matrixMultiply: function (mx) {
			var self = this,             // {Vector} Original vector.
				n = this.length,          // {number} Count of elements in this vector.
				ret = new Vector(this);   // {Vector} Returned vector.
			ret.foreach(function (r, ak_notused) {
				var c, s = 0;
				for (c = 0; c < n; c += 1) {
					s += mx[r][c] * self[c];
				}
				return s;
			});
			return ret;
		}
	};

	// ----------------------------------------------------
	//  Matrix.
	// ----------------------------------------------------
	
	/**
	* Simplified 2x2 matrix. Note constructor parameter order in rows.
	* @param {number} a First element of matrix.
	* @param {number} b Second element of matrix.
	* @param {number} c Third element of matrix.
	* @param {number} d Fourth element of matrix.
	*/
	Matrix2x2 = function (a, b, c, d) {
		// The beam propagation ABCD matrices have the elements
		//    [ A  B ]
		//    [ C  D ]
		this[0] = [a, b];
		this[1] = [c, d];
		this.length = 2;
	};
	
	Matrix2x2.fn = Matrix2x2.prototype = {
		constructor: Matrix2x2,

		// These make the object appear like an Array.
		length: 0,
		push: [].push,
		splice: [].push,
		
		/**
		* Post-multiply this matrix by the given argument.
		* @this {Matrix2x2} Matrix to multiply.
		* @param {Matrix2x2} mx Matrix to post-multiply by.
		* @returns {Matrix2x2} A new matrix with the product.
		*/
		multiply: function (mx) {
			return new Matrix2x2(
				this[0][0] * mx[0][0] + this[0][1] * mx[1][0],  // aa' + bc'
				this[0][0] * mx[0][1] + this[0][1] * mx[1][1],  // ab' + bd'
				this[1][0] * mx[0][0] + this[1][1] * mx[1][0],  // ca' + dc'
				this[1][0] * mx[0][1] + this[1][1] * mx[1][1])  // cb' + dd'
		},
		
		/**
		* Determine the trace of the matrix.
		* @returns {number} Trace of matrix.
		*/
		trace: function () {
			return this[0][0] + this[1][1];
		},
		
		/**
		* Make something ye can read, laddie.
		* @returns {string} String representation of matrix elements.
		*/
		toString: function () {
			var mx = this,
				fmt = function (r, c) {
					var str = mx[r][c].toFixed(3);
					return str;
				};
			return '[[' + fmt(0, 0) + '  ' + fmt(0, 1) + '] [' + fmt(1, 0) + '  ' + fmt(1, 1) + ']]';
		},

		/**
		 * Returns a value indicating whether the two matrices have elements
		 * with the same numerical values.
		 * @param {Matrix2x2} mx Matrix to compare to.
		 * @param {number=} tol Optional tolerance, defaults to 1e-15. If the value is positive, means significant figures instead.
		 */
		isEqual: function (mx, tol) {
			if (tol === undefined) {
				tol = 1e-15;
			}
			for (var r = 0; r < this.length; r += 1) {
				for (var c = 0; c < this[r].length; c += 1) {
					if (
						// Tolerance by decimal places.
						(tol < 1 && Math.abs(this[r][c] - mx[r][c]) > tol)
						// Or, tolerance by significant figures.
						|| (tol >= 1 && this[r][c].toPrecision(tol) !== mx[r][c].toPrecision(tol))) {
						return false;
					}
				}
			}
			return true;
		}
	};
	
	/**
	* Identity matrix.
	* @returns {Matrix2x2} The identity matrix.
	*/
	Matrix2x2.eye = function () {
		return new Matrix2x2(1, 0, 0, 1);
	};
		

	
	window.LaserCanvas.Math = {
		Vector: Vector,
		Matrix2x2: Matrix2x2
	};
}());