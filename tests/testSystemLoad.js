/**
* Laser Canvas Web test cases.
* These are exported from LaserCanvas5 desktop application.
*/
window.testCollection = window.testCollection || {};

(function (collection) {
const testCases = [
{ label: "test_linear_simple", expectAbcd: [[-1.5, -125, 0.005, -0.25]], src: 
`[Sys_0224a388]
Resonator
Variable(x) = 0
Range(x) = 0, 1
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = 0
StartX = 0
StartY = 0
Mirror @ M1 {
   Selected
   DistanceToNext = 250
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}
Mirror @ M2 {
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}

Renderer 2d {
   System = Sys_0224a388
   Window = 78, 78, 500, 200
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
` },

{ label: "test_linear_lens", expectAbcd: [[0.125, 328, -0.003, 0.125]], src: 
`[Sys_022495bc]
Resonator
Variable(x) = 0
Range(x) = 0, 1
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = 0
StartX = 0
StartY = 0
Mirror @ M1 {
   DistanceToNext = 125
   FaceAngle = 0
   ROC = 0
   ROC_tan = 0
}
ThinLens @ L3 {
   Selected
   DistanceToNext = 125
   FL = 500
   FL_tan = 500
}
Mirror @ M2 {
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 0
   ROC_tan = 0
}

Renderer 2d {
   System = Sys_022495bc
   Window = 52, 52, 500, 200
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
` },

{ label: "test_linear_lens_mirror_lens", expectAbcd: [[0.978, -8.02, 0.00151, 1.01]], src: 
`[Sys_02247ea4]
Resonator
Variable(x) = 0
Range(x) = 0, 1
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = 1.5163
StartX = -101
StartY = -6
Mirror @ M1 {
   DistanceToNext = 197.091
   FaceAngle = 0
   ROC = 500
   ROC_tan = 500
}
ThinLens @ L3 {
   DistanceToNext = 143.028
   FL = 200
   FL_tan = 200
}
Mirror @ M4 {
   DistanceToNext = 73.6817
   FaceAngle = 5.22596
   ROC = 0
   ROC_tan = 0
}
ThinLens @ L5 {
   DistanceToNext = 248.225
   FL = 250
   FL_tan = 250
}
Mirror @ M2 {
   Selected
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 500
   ROC_tan = 500
}

Renderer 2d {
   System = Sys_02247ea4
   Window = 104, 104, 500, 200
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
` },

{ label: "test_linear_angled_curved", expectAbcd: [[-0.883, -196, 0.00112, -0.883], [-0.55, -179, 0.0039, -0.55]], src: 
`[Sys_022493ec]
Resonator
Variable(x) = 0
Range(x) = 0, 1
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = 0.545658
StartX = -85
StartY = -2
Mirror @ M1 {
   Selected
   DistanceToNext = 210.01
   FaceAngle = 0
   ROC = 0
   ROC_tan = 0
}
Mirror @ M3 {
   DistanceToNext = 112.004
   FaceAngle = 18.9636
   ROC = 200
   ROC_tan = 200
}
Mirror @ M2 {
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 0
   ROC_tan = 0
}

Renderer 2d {
   System = Sys_022493ec
   Window = 19, 56, 500, 200
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
` },

{ label: "test_linear_curved_mirror_brewster", expectAbcd: [[-0.441, -33.7, 0.0239, -0.441], [-0.336, -35.6, 0.0249, -0.336]], src: 
`[Sys_022fa2b0]
Resonator
Variable(x) = 0
Range(x) = 0, 1
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = 0
StartX = 0
StartY = 0
Mirror @ M1 {
   DistanceToNext = 125
   FaceAngle = 0
   ROC = 0
   ROC_tan = 0
}
Mirror @ M3 {
   DistanceToNext = 50.9129
   FaceAngle = 10.3504
   ROC = 200
   ROC_tan = 200
}
BrewsterInput @ BI4 {
   LinkedTo = BO5
   RefractiveIndex = 2
   ROC = 0
   ROC_tan = 0
   Thickness = 15
}
BrewsterOutput @ BO5 {
   LinkedTo = BI4
   DistanceToNext = 165.983
   ROC = 0
   ROC_tan = 0
}
Mirror @ M2 {
   Selected
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 0
   ROC_tan = 0
}

Renderer 2d {
   System = Sys_022fa2b0
   Window = 15, 102, 500, 200
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}`
},

{ label: "test_linear_crystal", expectAbcd: [[-1.5, -124, 0.00498, -0.253], [-1.44, -107, 0.00438, -0.37]], src: 
`[Sys_022fdf68]
Resonator
Variable(x) = 0
Range(x) = 0, 1
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = 0
StartX = 0
StartY = 0
Mirror @ M1 {
   DistanceToNext = 120
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}
CrystalInput @ CI3 {
   Selected
   LinkedTo = CO4
   RefractiveIndex = 2.1
   FaceAngle = 23
   ROC = 0
   ROC_tan = 0
   Thickness = 19
}
CrystalOutput @ CO4 {
   LinkedTo = CI3
   DistanceToNext = 120
   ROC = 0
   ROC_tan = 0
}
Mirror @ M2 {
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}

Renderer 2d {
   System = Sys_022fdf68
   Window = 156, 156, 500, 200
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
`},

{ label: "test_linear_plate", expectAbcd: [[-1.53, -133, 0.00527, -0.195], [-1.51, -129, 0.00514, -0.223]], src: 
`[Sys_022fa6fc]
Resonator
Variable(x) = 0
Range(x) = 0, 1
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = 0
StartX = 0
StartY = 0
Mirror @ M1 {
   DistanceToNext = 120
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}
PlateInput @ PI3 {
   Selected
   LinkedTo = PO4
   RefractiveIndex = 1.7
   FaceAngle = 23
   ROC = 0
   ROC_tan = 0
   Thickness = 21
}
PlateOutput @ PO4 {
   LinkedTo = PI3
   DistanceToNext = 120
   ROC = 0
   ROC_tan = 0
}
Mirror @ M2 {
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}

Renderer 2d {
   System = Sys_022fa6fc
   Window = 104, 104, 500, 200
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
`},

{ label: "test_linear_lens_astigmatic", expectAbcd: [[0.125, 328, -0.003, 0.125], [-0.875, -46.9, 0.005, -0.875]], src: 
`[Sys_02247ec8]
Resonator
Variable(x) = 0
Range(x) = 0, 1
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = 0
StartX = 0
StartY = 0
Mirror @ M1 {
   DistanceToNext = 125
   FaceAngle = 0
   ROC = 0
   ROC_tan = 0
}
ThinLens @ L3 {
   Selected
   Astigmatic
   DistanceToNext = 125
   FL = 500
   FL_tan = 100
}
Mirror @ M2 {
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 0
   ROC_tan = 0
}

Renderer 2d {
   System = Sys_02247ec8
   Window = 11, 50, 500, 200
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
` },

// { label: "test_linear_block", expectAbcd: [[-1.6, -156, 0.006, -0.04]], src: 
// `
// ` },
{ label: "test_linear_block_angled", expectAbcd: [[-1.48, -120, 0.00483, -0.283], [-1.45, -109, 0.00445, -0.356]], src: 
`[Sys_02248264]
Resonator
Variable(x) = 0
Range(x) = 0, 1
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = 0
StartX = 0
StartY = 0
Mirror @ M1 {
   DistanceToNext = 120
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}
PlateInput @ PI3 {
   Selected
   LinkedTo = PO4
   RefractiveIndex = 2.5
   FaceAngle = 45
   ROC = 0
   ROC_tan = 0
   Thickness = 20
}
PlateOutput @ PO4 {
   LinkedTo = PI3
   DistanceToNext = 120
   ROC = 0
   ROC_tan = 0
}
Mirror @ M2 {
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}

Renderer 2d {
   System = Sys_02248264
   Window = 0, 0, 500, 200
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
` },

{ label: "test_linear_block_curved", expectAbcd: [[0.21, 217, -0.0065, -1.96]], src: 
`[Sys_02247e94]
Resonator
Variable(x) = 0
Range(x) = 0, 1
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = 0
StartX = 0
StartY = 0
Mirror @ M1 {
   DistanceToNext = 120
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}
PlateInput @ PI3 {
   Selected
   LinkedTo = PO4
   RefractiveIndex = 2.
   FaceAngle = 0
   ROC = 0
   ROC_tan = 0
   Thickness = 10
}
PlateOutput @ PO4 {
   LinkedTo = PI3
   DistanceToNext = 120
   ROC = 100
   ROC_tan = 100
}
Mirror @ M2 {
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}

Renderer 2d {
   System = Sys_02247e94
   Window = 26, 26, 500, 200
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
` },

{ label: "test_linear_brewster", expectAbcd: [[-1.48, -119, 0.0048, -0.289], [-1.44, -106, 0.00436, -0.375]], src: 
`[Sys_0224ad68]
Resonator
Variable(x) = 0
Range(x) = 0, 1
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = 0
StartX = 0
StartY = 0
Mirror @ M1 {
   DistanceToNext = 120
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}
BrewsterInput @ BI3 {
   LinkedTo = BO4
   RefractiveIndex = 1.5
   ROC = 0
   ROC_tan = 0
   Thickness = 10
}
BrewsterOutput @ BO4 {
   Selected
   LinkedTo = BI3
   DistanceToNext = 120
   ROC = 0
   ROC_tan = 0
}
Mirror @ M2 {
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}

Renderer 2d {
   System = Sys_0224ad68
   Window = 52, 52, 500, 200
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
` },

{ label: "test_linear_block_dual_curved", expectAbcd: [[-1.39, -154, 0.00785, 0.153]], src: 
`[Sys_0224c270]
Resonator
Variable(x) = 0
Range(x) = 0, 1
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = 0
StartX = 0
StartY = 0
Mirror @ M1 {
   DistanceToNext = 120
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}
PlateInput @ PI3 {
   Selected
   LinkedTo = PO4
   RefractiveIndex = 1.5
   FaceAngle = 0
   ROC = -100
   ROC_tan = -100
   Thickness = 35
}
PlateOutput @ PO4 {
   LinkedTo = PI3
   DistanceToNext = 120
   ROC = 200
   ROC_tan = 200
}
Mirror @ M2 {
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}

Renderer 2d {
   System = Sys_0224c270
   Window = 78, 78, 500, 200
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
` },

{ label: "test_linear_block_angled_curved", expectAbcd: [[-.984, -150, 0.01, 0.517], [-0.503, -121, 0.0112, 0.704]], src: 
`[Sys_02247580]
Resonator
Variable(x) = 0
Range(x) = 0, 1
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = 0
StartX = 0
StartY = 0
Mirror @ M1 {
   DistanceToNext = 120
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}
PlateInput @ PI3 {
   Selected
   LinkedTo = PO4
   RefractiveIndex = 1.5
   FaceAngle = 30
   ROC = -100
   ROC_tan = -100
   Thickness = 10
}
PlateOutput @ PO4 {
   LinkedTo = PI3
   DistanceToNext = 120
   ROC = -200
   ROC_tan = -200
}
Mirror @ M2 {
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}

Renderer 2d {
   System = Sys_02247580
   Window = 130, 130, 500, 200
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
` },

{ label: "test_linear_prisms", expectAbcd: [[-1.57, -148, 0.00575, -0.0948]], src: 
`[Sys_0224d198]
Resonator
Variable(x) = 0
Range(x) = 0, 1
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = -14.6329
StartX = 0
StartY = 0
Mirror @ M1 {
   DistanceToNext = 120
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}
PrismA @ Pa3 {
   LinkedTo = Pb4
   DistanceToNext = 85.3875
   RefractiveIndex = 1.5
}
PrismB @ Pb4 {
   Selected
   LinkedTo = Pa3
   DistanceToNext = 52.0905
}
Mirror @ M2 {
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}

Renderer 2d {
   System = Sys_0224d198
   Window = -7, 24, 500, 247
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
` },

{ label: "test_linear_prisms_mirror", expectAbcd: [[-1.83, -237, 0.00835, 0.532]], src: 
`[Sys_02247f74]
Resonator
Variable(x) = 0
Range(x) = 0, 1
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = -22.127
StartX = 0
StartY = 0
Mirror @ M1 {
   DistanceToNext = 85.703
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}
PrismA @ Pa3 {
   LinkedTo = Pb4
   DistanceToNext = 70.4172
   RefractiveIndex = 1.5
}
Flat @ FM5 {
   DistanceToNext = 65.0514
   FaceAngle = 40.1706
}
PrismB @ Pb4 {
   Selected
   LinkedTo = Pa3
   DistanceToNext = 62.3035
}
Mirror @ M2 {
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 200
   ROC_tan = 200
}

Renderer 2d {
   System = Sys_02247f74
   Window = 0, 0, 500, 254
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
` },

{ label: "test_ultrafast", expectAbcd: [[-0.308, 514, -0.00176, -0.308], [-0.658, 337, -0.00168, -0.658]], src: 
`[Sys_023075d0]
Resonator
Variable(x) = 105.99
Range(x) = 80, 150
Variable(y) = 0
Range(y) = 0, 1
Variable(z) = 0
Range(z) = 0, 1
Wavelength = 1064
MSquared = 1
MSquareTan = 1
InputwSag = 200
InputwTan = 300
InputRzSag = 0
InputRzTan = 0
Rotation = -21.8858
StartX = -88
StartY = 64
Mirror @ M3 {
   DistanceToNext = 146.932
   FaceAngle = 0
   ROC = 0
   ROC_tan = 0
}
Screen @ I9 {
   DistanceToNext = 231.33
}
Mirror @ M2 {
   DistanceToNext = x
   FaceAngle = -11.0658
   ROC = 200
   ROC_tan = 200
}
BrewsterInput @ BI5 {
   LinkedTo = BO6
   RefractiveIndex = 1.5
   ROC = 0
   ROC_tan = 0
   Thickness = 10
}
BrewsterOutput @ BO6 {
   Selected
   LinkedTo = BI5
   DistanceToNext = x
   ROC = 0
   ROC_tan = 0
}
Mirror @ M1 {
   DistanceToNext = 203.38
   FaceAngle = -12.8854
   ROC = 200
   ROC_tan = 200
}
PrismA @ Pa7 {
   LinkedTo = Pb8
   DistanceToNext = 64.1979
   RefractiveIndex = 1.5
}
PrismB @ Pb8 {
   LinkedTo = Pa7
   DistanceToNext = 113.342
}
Mirror @ M4 {
   DistanceToNext = 0
   FaceAngle = 0
   ROC = 0
   ROC_tan = 0
}

Renderer 2d {
   System = Sys_023075d0
   Window = 0, 0, 717, 446
   XMiddle = 125
   YMiddle = 0
   Zoom = 1
   OpticScale = 50
   ModeScale = 20
   GridSize = 10
   Flags = 10
}
Renderer SystemGraph {
   System = Sys_023075d0
   Window = 26, 26, 500, 369
   XMin = 80
   XMax = 150
   YMin = -1
   YMax = 1
   Variable = x
   Function = Stability
}
`}
];

collection.systemload = {
	label: "System load",
	cases: testCases,
	cases: [testCases[6]],

	/**
	 * Run a single test, returning a value indicating whether the
	 * test passes.
	 * @param {object} testCase Test case parameters from collection.
	 */
	test: function (testCase) {
		const s = new LaserCanvas.System();
		try {
			s.fromTextFile(testCase.src);
		} catch (e) {
			return {
				label: testCase.label,
				success: false,
				message: e
			};
		}
		s.calculateAbcd();

		// Expect can be one matrix or two.
		const toMatrix = function (els) {
			return new LaserCanvas.Math.Matrix2x2(els[0], els[1], els[2], els[3]);
		};
		const expectAbcd = {
			sag: toMatrix(testCase.expectAbcd[0]),
			tan: toMatrix(testCase.expectAbcd[testCase.expectAbcd.length - 1]),
		};

		// Tolerance: +3 significant figures.
		const tol = 3;

		const abcd = s.abcd();
		const success = abcd.sag.mx.isEqual(expectAbcd.sag, tol)
			&& abcd.tan.mx.isEqual(expectAbcd.tan, tol);
		if (!success) {
			console.log("Actual", abcd.sag, abcd.tan);
			console.log("Expect", expectAbcd);
		}
		return {
			label: testCase.label,
			success: success
		};
	}
};
}(window.testCollection));