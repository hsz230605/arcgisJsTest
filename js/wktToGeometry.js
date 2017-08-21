var WKTUtil = function(options){  
    this.initialize(options);  
};
  
WKTUtil.prototype = {
    /**
     * Constructor: OpenLayers.Format.WKT
     * Create a new parser for WKT
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *           this instance
     *
     * Returns:
     * {<OpenLayers.Format.WKT>} A new WKT parser.
     */
    initialize: function (options) {
        this.regExes = {
            'typeStr': /^\s*(\w+)\s*\s∗(.∗)\s∗\s*$/,
            'spaces': /\s+/,
            'parenComma': /\)\s*,\s*\(/,
            'doubleParenComma': /\)\s*\)\s*,\s*\(\s*\(/,  // can't use {2} here  
            'trimParens': /^\s*?(.∗?)?\s*$/
        };
        for (var i in options) {
            this[i] = options[i];
        }
    },

    /**
     * APIMethod: read
     * Deserialize a WKT string and return a vector feature or an
     * array of vector features.  Supports WKT for POINT, MULTIPOINT,
     * LINESTRING, MULTILINESTRING, POLYGON, MULTIPOLYGON, and
     * GEOMETRYCOLLECTION.
     *
     * Parameters:
     * wkt - {String} A WKT string
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>|Array} A feature or array of features for
     * GEOMETRYCOLLECTION WKT.
     */
    read: function (wkt) {
        var features, type, str, wkts = [];
        wkt = wkt.replace(/[\n\r]/g, " ");
        // var matches = this.regExes.typeStr.exec(wkt);
        var matches = wkt.split("(");
        if (matches) {
            // type = matches[1].toLowerCase();
            // str = matches[2];  
            type = matches[0].toLowerCase().replace(" ", "");
            if (type.indexOf("polygon")>-1) {
                if (matches.length === 3) {
                    str = matches[2].replace("))", "");
                    wkts.push(str);
                }
                else {
                    //多个孔洞的情况,多面情况下
                    for (var a = 2; a < matches.length; a++) {
                        str = matches[a].replace(/\),/g, "");
                        if (str != "")
                            wkts.push(str.replace(/\)/g, ""));
                    }
                }
                //逗号分隔                
            }
            else {
                switch (type) {
                    case "multilinestring":
                        for (var a = 2; a < matches.length - 1; a++) {
                            str = matches[a].replace("),", "");
                            wkts.push(str);
                        }
                        wkts.push(matches[matches.length - 1].replace("))", ""));
                        break;
                    default:
                        str = matches[1].replace(")", "");
                        wkts.push(str);
                        break;
                }
            }
            if (this.parse[type]) {
                features = this.parse[type].apply(this, [wkts.join('@')]);
                //console.log(features);  
            }
        }
        return features;
    },

    /**
     * Method: extractGeometry
     * Entry point to construct the WKT for a single Geometry object.
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry.Geometry>}
     *
     * Returns:
     * {String} A WKT string of representing the geometry
     */
    extractGeometry: function (geometry) {
        var type = geometry.CLASS_NAME.split('.')[2].toLowerCase();
        if (!this.extract[type]) {
            return null;
        }
        if (this.internalProjection && this.externalProjection) {
            geometry = geometry.clone();
            geometry.transform(this.internalProjection, this.externalProjection);
        }
        var wktType = type == 'collection' ? 'GEOMETRYCOLLECTION' : type.toUpperCase();
        var data = wktType + '(' + this.extract[type].apply(this, [geometry]) + ')';
        return data;
    },

    trim: function (str) {
        return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    },
    /**
     * Object with properties corresponding to the geometry types.
     * Property values are functions that do the actual parsing.
     */
    parse: {
        /**
         * Return point feature given a point WKT fragment.
         * @param {String} str A WKT fragment representing the point
         * @returns {OpenLayers.Feature.Vector} A point feature
         * @private
         */
        'point': function (str) {
            var coords = this.trim(str).split(this.regExes.spaces);
            // var newPoint = [parseFloat(coords[0]), parseFloat(coords[1])];
            return coords;//new esri.geometry.Point(coords[0], coords[1]);
        },

        /**
         * Return a multipoint feature given a multipoint WKT fragment.
         * @param {String} str A WKT fragment representing the multipoint
         * @returns {OpenLayers.Feature.Vector} A multipoint feature
         * @private
         */
        'multipoint': function (str) {
            var point;
            var points = this.trim(str).split(',');
            var components = [];
            for (var i = 0, len = points.length; i < len; ++i) {
                point = points[i].replace(this.regExes.trimParens, '$1');
                components.push(this.parse.point.apply(this, [point]).geometry);
            }
            return components;
        },

        /**
         * Return a linestring feature given a linestring WKT fragment.
         * @param {String} str A WKT fragment representing the linestring
         * @returns {OpenLayers.Feature.Vector} A linestring feature
         * @private
         */
        'linestring': function (str) {
            var points = this.trim(str).split(',');
            var components = [];
            for (var i = 0, len = points.length; i < len; ++i) {
                components.push(this.parse.point.apply(this, [points[i]]));
            }
            return components//new esri.geometry.Polyline(components);  
        },

        /**
         * Return a multilinestring feature given a multilinestring WKT fragment.
         * @param {String} str A WKT fragment representing the multilinestring
         * @returns {OpenLayers.Feature.Vector} A multilinestring feature
         * @private
         */
        'multilinestring': function (str) {
            var lines = this.trim(str).split('@');
            var components = [];
            for (var i = 0, len = lines.length; i < len; ++i) {
                components.push(this.parse.linestring.apply(this, [lines[i]]));
            }
            return components;
        },
        /**
         * Return a polygon feature given a polygon WKT fragment.
         * @param {String} str A WKT fragment representing the polygon
         * @returns {OpenLayers.Feature.Vector} A polygon feature
         * @private
         */
        'polygon': function (wkt) {
            var ring, linestring, linearring;
            var strs = wkt.split('@');
            var components = [];
            for (var index in strs) {
                var str = strs[index];
                var rings = this.trim(str).split(this.regExes.parenComma);
                for (var i = 0, len = rings.length; i < len; ++i) {
                    ring = rings[i].replace(this.regExes.trimParens, '$1');
                    linestring = this.parse.linestring.apply(this, [ring]);
                    components.push(linestring);
                }
            }
            return components;
        },
        'multipolygon': function (wkt) {
            var strs = wkt.split('@');
            var components = [];
            for (var i = 0, len = strs.length; i < len; ++i) {
                components.push(this.parse.linestring.apply(this, [strs[i]]));
            }
            return components;
        }
    }
};

var wktToGeometry=(function () {
    "use strict";
    /**
     *wkt转化成arcgis的Polyline对象
     * @param wkt
     * @returns {Point}
     * @constructor
     * wkt, spatialReference
     */
    var WktToPoint=function(options) {
        require([
            "esri/geometry/Point",
            "dojo/domReady!"
        ], function (Point) {
            var wktUtil = new WKTUtil();
            var pt = wktUtil.read(options.wkt);
            var json = {
                x: pt[0],
                y: pt[1],
                spatialReference: options.spatialReference
            };

            var point = new Point(json);
            options.callback(point);
        });
    };

    /**
     *wkt转化成arcgis的Polyline对象
     * @param wkt
     * @returns {Polyline}
     * @constructor
     */
    var WktToPolyLine= function (options) {
        require([
            "esri/geometry/Polyline",
            "dojo/domReady!"
        ], function (Polyline) {
            var wktUtil = new WKTUtil();
            var points = wktUtil.read(options.wkt);
            var json = {
                paths: [points],
                spatialReference: options.spatialReference
            };
            var polyLine = new Polyline(json);
            options.callback(polyLine);
        })
    };
    var WktToMultiPolyLine= function (options) {
        require([
            "esri/geometry/Polyline",
            "dojo/domReady!"
        ], function (Polyline) {
            var wktUtil = new WKTUtil();
            var polyLines = wktUtil.read(options.wkt);
            var polyLine = new Polyline(options.spatialReference);
            $(polyLines).each(function (index,item) {
                polyLine.addPath(item);
            });
            options.callback(polyLine);
        })
    };
    /**
     * wkt转化成arcgis的Polygon对象
     * @param wkt
     * @returns {Polygon}
     * @constructor
     */
    var WktToPolygon=function(options) {
        require([
            "esri/geometry/Point",
            "esri/geometry/Polygon",
            "dojo/domReady!"
        ], function (Point, Polygon) {
            var wktUtil = new WKTUtil();
            var points = wktUtil.read(options.wkt);
            var json = {
                rings: points,
                spatialReference: options.spatialReference
            };
            var polygon = new Polygon(json);
            options.callback(polygon);
        });
    };
    var WktToMultiPolygon=function(options) {
        require([
            "esri/geometry/Point",
            "esri/geometry/Polygon",
            "dojo/domReady!"
        ], function (Point, Polygon) {
            var wktUtil = new WKTUtil();
            var polygons = wktUtil.read(options.wkt);
            var polygon =new Polygon(options.spatialReference);
            $(polygons).each(function (index,item) {
                polygon.addRing(item);
            });
            options.callback(polygon);
        });
    };
    return {
        startParse: function (options) {
            var wkt = options.wkt;
            var type = wkt.split("(")[0].toLowerCase();
            switch (type.replace(" ", "")) {
                case "point":
                case "multipoint":
                    WktToPoint(options);
                    break;
                case "linestring":
                    WktToPolyLine(options);
                    break;
                case "multilinestring":
                    WktToMultiPolyLine(options);
                    break;
                case "polygon":
                    WktToPolygon(options);
                    break;
                case "multipolygon":
                    WktToMultiPolygon(options);
                    break;
            }
        }
    }
})();