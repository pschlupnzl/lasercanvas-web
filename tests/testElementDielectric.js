/**
 * Element ABCD unit tests.
 */
window.testCollection = window.testCollection || {};
(function (collection) {

	const testCases = [{
		label: "Plate -->| n=2 sag",
		type: "Plate",
		angleOfIncidence: 0,
		n: 2,
		isFace1: true,
		dir: 1,
		plane: "sagittal",
		expectAbcd: [[1, 0], [0, 1]],
	}, {
		label: "Plate -->| n=2 tan",
		type: "Plate",
		angleOfIncidence: 0,
		n: 2,
		isFace1: true,
		dir: 1,
		plane: "tangential",
		expectAbcd: [[1, 0], [0, 1]],
	}, 
	
	{
		label: "Plate -->/ n=2 sag",
		type: "Plate",
		angleOfIncidence: 0.5,
		n: 2,
		isFace1: true,
		dir: 1,
		plane: "sagittal",
		expectAbcd: [[1, 0], [0, 1]],
	}, (function (params) {
		var qext = params.angleOfIncidence,
			qint = Math.asin(Math.sin(qext) / params.n),
			cosq1 = Math.cos( qext ),
			cosq2 = Math.cos( qint );
		params.expectAbcd[0][0] = cosq2 / cosq1;
		params.expectAbcd[1][1] = cosq1 / cosq2;
		return params;
		}({
			label: "Plate -->/ n=2 tan",
			type: "Plate",
			angleOfIncidence: 0.5,
			n: 2,
			isFace1: true,
			dir: 1,
			plane: "tangential",
			expectAbcd: [[1, 0], [0, 1]],
	})),{
		label: "Plate /--> n=2 sag",
		type: "Plate",
		angleOfIncidence: 0.5,
		n: 2,
		isFace1: false,
		dir: 1,
		plane: "sagittal",
		expectAbcd: [[1, 0], [0, 1]],
	}, (function (params) {
		var qext = params.angleOfIncidence,
			qint = Math.asin(Math.sin(qext) / params.n),
			cosq1 = Math.cos( qint ),
			cosq2 = Math.cos( qext );
		params.expectAbcd[0][0] = cosq2 / cosq1;
		params.expectAbcd[1][1] = cosq1 / cosq2;
		return params;
	}({
		label: "Plate /--> n=2 tan",
		type: "Plate",
		angleOfIncidence: 0.5,
		n: 2,
		isFace1: false,
		dir: 1,
		plane: "tangential",
		expectAbcd: [[1, 0], [0, 1]],
	})),

	// Radius of curvature.
	{
		label: "Plate -->( n=2 sag",
		type: "Plate",
		angleOfIncidence: 0,
		n: 2,
		curvatureFace1: -400,
		isFace1: true,
		dir: 1,
		plane: "sagittal",
		expectAbcd: [[1, 0], [-1/400, 1]]
	}, {
		label: "Plate -->( n=2 tan",
		type: "Plate",
		angleOfIncidence: 0,
		n: 2,
		curvatureFace1: -400,
		isFace1: true,
		dir: 1,
		plane: "tangential",
		expectAbcd: [[1, 0], [-1/400, 1]]
	}, {
		label: "Plate )--> n=2 sag",
		type: "Plate",
		angleOfIncidence: 0,
		n: 2,
		curvatureFace2: -400,
		isFace1: false,
		dir: 1,
		plane: "sagittal",
		expectAbcd: [[1, 0], [-1/400, 1]]
	}, {
		label: "Plate )--> n=2 tan",
		type: "Plate",
		angleOfIncidence: 0,
		n: 2,
		curvatureFace2: -400,
		isFace1: false,
		dir: 1,
		plane: "tangential",
		expectAbcd: [[1, 0], [-1/400, 1]]
	}, 
	// Down.
	{
		label: "Plate <--( n=2 sag",
		type: "Plate",
		angleOfIncidence: 0,
		n: 2,
		curvatureFace1: -400,
		isFace1: true,
		dir: -1,
		plane: "sagittal",
		expectAbcd: [[1, 0], [-1/400, 1]]
	}, {
		label: "Plate <--( n=2 tan",
		type: "Plate",
		angleOfIncidence: 0,
		n: 2,
		curvatureFace1: -400,
		isFace1: true,
		dir: -1,
		plane: "tangential",
		expectAbcd: [[1, 0], [-1/400, 1]]
	}, {
		label: "Plate )<-- n=2 sag",
		type: "Plate",
		angleOfIncidence: 0,
		n: 2,
		curvatureFace2: -400,
		isFace1: false,
		dir: -1,
		plane: "sagittal",
		expectAbcd: [[1, 0], [-1/400, 1]]
	}, {
		label: "Plate )<-- n=2 tan",
		type: "Plate",
		angleOfIncidence: 0,
		n: 2,
		curvatureFace2: -400,
		isFace1: false,
		dir: -1,
		plane: "tangential",
		expectAbcd: [[1, 0], [-1/400, 1]]
	}];

	// ------------------
	//  Test collection.
	// ------------------
	collection.element = {
		label: "Dielectric Elements",
		cases: testCases,
		test: function (testCase) {
			const Matrix2x2 = LaserCanvas.Math.Matrix2x2;

			const face1 = {
				prop: {
					type: LaserCanvas.Element.Dielectric.eType[testCase.type],
					refractiveIndex: testCase.n,
					angleOfIncidence: testCase.angleOfIncidence,
					qext: 0,
					curvatureFace1: testCase.curvatureFace1 || 0,
					curvatureFace2: testCase.curvatureFace2 || 0,
				}
			};
			const face2 = {};
			face1.group = face2.group = [face1, face2];
			const element = testCase.isFace1 ? face1 : face2;
			const modePlane = LaserCanvas.Enum.modePlane[testCase.plane];
			const abcd = LaserCanvas.Element.Dielectric.prototype.elementAbcd.call(element, testCase.dir, modePlane);
			const success = abcd.isEqual(testCase.expectAbcd, 1e-5);

			if (!success) {
				console.log(abcd, testCase.expectAbcd);
			}
			return {
				label: testCase.label,
				success: success
			};
		}
	};
}(window.testCollection));
