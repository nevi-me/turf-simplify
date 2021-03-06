var simplify = require('simplify-js');

/**
 * Takes a {@link LineString} or {@link Polygon} and returns a simplified version. Internally uses [simplify-js](http://mourner.github.io/simplify-js/) to perform simplification.
 *
 * @module turf/simplify
 * @category transformation
 * @param {Feature<(LineString|Polygon)>} feature feature to be simplified
 * @param {Number} tolerance simplification tolerance
 * @param {Boolean} highQuality whether or not to spend more time to create
 * a higher-quality simplification with a different algorithm
 * @return {Feature<(LineString|Polygon)>} a simplified feature
 * @example
  * var feature = {
 *   "type": "Feature",
 *   "properties": {},
 *   "geometry": {
 *     "type": "Polygon",
 *     "coordinates": [[
 *       [-70.603637, -33.399918],
 *       [-70.614624, -33.395332],
 *       [-70.639343, -33.392466],
 *       [-70.659942, -33.394759],
 *       [-70.683975, -33.404504],
 *       [-70.697021, -33.419406],
 *       [-70.701141, -33.434306],
 *       [-70.700454, -33.446339],
 *       [-70.694274, -33.458369],
 *       [-70.682601, -33.465816],
 *       [-70.668869, -33.472117],
 *       [-70.646209, -33.473835],
 *       [-70.624923, -33.472117],
 *       [-70.609817, -33.468107],
 *       [-70.595397, -33.458369],
 *       [-70.587158, -33.442901],
 *       [-70.587158, -33.426283],
 *       [-70.590591, -33.414248],
 *       [-70.594711, -33.406224],
 *       [-70.603637, -33.399918]
 *     ]]
 *   }
 * };

 * var tolerance = 0.01;
 *
 * var simplified = turf.simplify(
 *  feature, tolerance, false);
 *
 * //=feature
 *
 * //=simplified
 */
module.exports = function(feature, tolerance, highQuality) {
  if(feature.geometry.type === 'LineString') {
    var line = {
      type: 'LineString',
      coordinates: []
    };
    var pts = feature.geometry.coordinates.map(function(coord) {
      return {x: coord[0], y: coord[1]};
    });
    line.coordinates = simplify(pts, tolerance, highQuality).map(function(coords) {
      return [coords.x, coords.y];
    });

    return simpleFeature(line, feature.properties);
  } else if(feature.geometry.type === 'Polygon') {
    var poly = {
      type: 'Polygon',
      coordinates: []
    };
    feature.geometry.coordinates.forEach(function(ring) {
      var pts = ring.map(function(coord) {
        return {x: coord[0], y: coord[1]};
      });
      if (pts.length < 4) {
        throw new Error('Invalid polygon');
      }
      var simpleRing = simplify(pts, tolerance, highQuality).map(function(coords) {
        return [coords.x, coords.y];
      });
      //remove 1 percent of tolerance until enough points to make a triangle
      while (!checkTriangle(simpleRing)) {
        tolerance -= tolerance * .01
        simpleRing = simplify(pts, tolerance, highQuality).map(function(coords) {
          return [coords.x, coords.y];
        });
      }
      if (simpleRing.length === 3) {
        simpleRing.push(simpleRing[0])
      }
      poly.coordinates.push(simpleRing);
    });
    return simpleFeature(poly, feature.properties);
  }
};

/*
* returns true if ring is a triangle
*/
function checkTriangle(ring) {
  if (ring.length < 3) {
    return false
    //if the last point is the same as the first, it's not a triangle
  } else if (ring.length === 3 &&
      ((ring[2][0] === ring[0][0]) && (ring[2][1] === ring[0][1]))) {
    return false
  } else {
    return true
  }
}

function simpleFeature (geom, properties) {
  return {
    type: 'Feature',
    geometry: geom,
    properties: properties
  };
}
