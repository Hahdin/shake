import {Circle as CircleStyle, Fill, Stroke, Style, Text} from 'ol/style.js';
import Circle from 'ol/geom/Circle.js';
let image = new CircleStyle({
  radius: 5,
  fill: null,
  stroke: new Stroke({color: 'red', width: 1}),
});
let imageblue = new CircleStyle({
  radius: 5,
  fill: null, 
  stroke: new Stroke({color: 'yellow', width: 1})
});
export default {
  'Point': new Style({
    image: imageblue,
    text: new Text({
      font: '15px Calibri,sans-serif',
      overflow: true,
      fill: new Fill({
        color: '#fff'
      }),
      stroke: new Stroke({
        color: '#000',
        width: 2
      })
    })
  }),
  'LineString': new Style({
    stroke: new Stroke({
      color: 'green',
      width: 1
    })
  }),
  'MultiLineString': new Style({
    stroke: new Stroke({
      color: 'green',
      width: 1
    })
  }),
  'MultiPoint': new Style({
    image: image
  }),
  'MultiPolygon': new Style({
    stroke: new Stroke({
      color: 'yellow',
      width: 1
    }),
    fill: new Fill({
      color: 'rgba(255, 255, 0, 0.1)'
    })
  }),
  'Polygon': new Style({
    stroke: new Stroke({
      color: 'blue',
      lineDash: [4],
      width: 3
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.1)'
    })
  }),
  'GeometryCollection': new Style({
    stroke: new Stroke({
      color: 'magenta',
      width: 2
    }),
    fill: new Fill({
      color: 'magenta'
    }),
    image: new CircleStyle({
      radius: 10,
      fill: null,
      stroke: new Stroke({
        color: 'magenta'
      })
    })
  }),
  'Circle': new Style({
    stroke: new Stroke({
      color: 'blue',
      width: 2
    }),
    fill: new Fill({
      color: 'rgba(255,0,0,0.2)'
    })
  }),
};
