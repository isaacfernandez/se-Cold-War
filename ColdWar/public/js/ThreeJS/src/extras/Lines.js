var globeRadius = 5;
var vec3_origin = new THREE.Vector3(0,0,0);
var points = null;

THREE.Curve.Utils.createLineGeometry = function( points ){
        var geometry = new THREE.Geometry();
        for( var i = 0; i < points.length; i ++ ){
            geometry.vertices.push( points[i] );
        }return geometry;
};

function makeConnectionLineGeometry( exporter, importer, value, type ){
	//if( exporter.countryName == undefined || importer.countryName == undefined )
		//return undefined;

	// console.log("making connection between " + exporter.countryName + " and " + importer.countryName + " with code " + type );
	
	var distanceBetweenCountryCenter = exporter.clone().sub(importer).length();		

	//	how high we want to shoot the curve upwards
	var anchorHeight = globeRadius + distanceBetweenCountryCenter * 0.2;

	//	start of the line
	var start = exporter;

	//	end of the line
	var end = importer;
	
	//	midpoint for the curve
	var mid = start.clone().lerp(end,0.5);		
	var midLength = mid.length()
	mid.normalize();
	mid.multiplyScalar( midLength + distanceBetweenCountryCenter * 0.5 );			

	//	the normal from start to end
	var normal = (new THREE.Vector3()).subVectors(start,end);
	normal.normalize();

	var distanceHalf = distanceBetweenCountryCenter * 0.5;

	var startAnchor = start;
	var midStartAnchor = mid.clone().add( normal.clone().multiplyScalar( distanceHalf ) );					
	var midEndAnchor = mid.clone().add( normal.clone().multiplyScalar( -distanceHalf ) );
	var endAnchor = end;

	//	now make a bezier curve out of the above like so in the diagram
	var splineCurveA = new THREE.CubicBezierCurve3( start, startAnchor, midStartAnchor, mid);											
	// splineCurveA.updateArcLengths();

	var splineCurveB = new THREE.CubicBezierCurve3( mid, midEndAnchor, endAnchor, end);
	// splineCurveB.updateArcLengths();

	//	how many vertices do we want on this guy? this is for *each* side
	var vertexCountDesired = Math.floor( /*splineCurveA.getLength()*/ distanceBetweenCountryCenter * 0.02 + 6 ) * 2;	

	//	collect the vertices
	points = splineCurveA.getPoints( vertexCountDesired );

	//	remove the very last point since it will be duplicated on the next half of the curve
	points = points.splice(0,points.length-1);

	points = points.concat( splineCurveB.getPoints( vertexCountDesired ) );

	//	add one final point to the center of the earth
	//	we need this for drawing multiple arcs, but piled into one geometry buffer
	//points.push( vec3_origin );

	var val = value * 0.0003;
	
	var size = (10 + Math.sqrt(val));
	size = constrain(size,0.1, 60);

	//	create a line geometry out of these
	var curveGeometry = THREE.Curve.Utils.createLineGeometry( points );

	curveGeometry.size = size;

	return curveGeometry;
}

function constrain(v, min, max){
	if( v < min )
		v = min;
	else
	if( v > max )
		v = max;
	return v;
}

function getVertexes(){
	return points;
}