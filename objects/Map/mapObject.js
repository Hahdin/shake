import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import GeoJSON from 'ol/format/GeoJSON.js';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import { ATTRIBUTION } from 'ol/source/OSM.js';
import Circle from 'ol/geom/Circle.js';
import { Vector as VectorLayer, Heatmap as HeatmapLayer } from 'ol/layer.js';
import { transform } from 'ol/proj.js';
import { toContext } from 'ol/render.js';
import { Circle as CircleStyle, Fill, Stroke, Style, Text, Icon } from 'ol/style.js';
import { Gauge, Donut } from '../../helpers/gauge'
export const mapObject = {
  rawData: null,
  heatmap: false,
  myMap: null,
  type: '0',
  myLayer: null,
  sourceMap: '2',
  styleCache: {},
  showLabels: false,
  lens: null,
  container: null,
  mousePos: null,
  spyTerrain: false,
  showGauge: false,
  magThreshhold: 2.0,

  async create({ ...args }) {

    try {
    this.rawData = await this.loadInfo()
      this.updateCoords()
      return Object.assign({}, this, { ...args })
    } catch (e) { Promise.reject(e) }
  },
  async refresh() {
    try {
    this.rawData = await this.loadInfo()
      this.updateCoords()
    }
    catch (e) { Promise.reject(e) }
  },
  updateCoords() {
    //transform from lat/lon to UTM
    this.rawData.features.forEach(feature => {
      feature.geometry.coordinates = this._transform(feature.geometry.coordinates)
    })
  },
  _transform(coord) {
    return transform(coord, 'EPSG:4326', 'EPSG:3857');
  },

  async loadInfo() {
    try {
      let path = this.type === '0' ? 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson'
        : this.type === '1' ? 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'
          : 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'
      let result = await window.fetch(path).catch(reason => { return reason })
      if (!result.ok) return Promise.reject(result)
      let jsResult = await result.json().catch(reason => { return reason })
      if (!jsResult) return 0
      //Fix up data
      let fixed = {
        features: [],
        bbox:jsResult.bbox ? [...jsResult.bbox] : [],
        metadata:jsResult.metadata ? { ...jsResult.metadata } : {},
        type: jsResult.type,
      }
      jsResult.features.forEach(feature => {
        if (parseFloat(feature.properties.mag) < this.magThreshhold) return
        fixed.features = fixed.features.concat(feature)
      })
      return fixed
    }
    catch (e) { Promise.reject(e) }
  },
  getVectorSource() {
    return new VectorSource({
      features: (new GeoJSON()).readFeatures(this.rawData),
      format: new GeoJSON({
        extractStyles: false
      })
    })
  },
  getVectorLayer() {
    let source = this.getVectorSource()
    return new VectorLayer({
      source: source,
      style: this.showGauge ?  this.styleGauge.bind(this) : this.styleEarthquakes.bind(this),
    })
  },
  getHeatVectorLayer() {
    let source = this.getVectorSource()
    return new HeatmapLayer({
      source: source,
      blur: 30,
      radius: 15,
    })
  },
  async switchData(type) {//0 - hour, 1-day, 2-week
    try {
    this.type = type
      this.styleCache = []
      return await this.refresh()
    }
    catch (e) { Promise.reject(e) }
  },
  removeLayer(type) {
    let removed = false
    if (this.myMap) {
      this.myMap.getLayers().forEach(layer => {
        if (!layer) return false
        if (type.search(/VECTOR/i) >= 0) {
          if (layer.type.search(/VECTOR/i) >= 0) {
            this.myMap.removeLayer(layer)
            removed = true
          }
        }
        if (type.search(/tile/i) >= 0) {
          if (layer.type.search(/tile/i) >= 0) {
            this.myMap.removeLayer(layer)
            removed = true
          }
        }
      })
    }
    return removed
  },
  addLayer(type) {
    let layer = null
    if (type.search(/VECTOR/i) >= 0) {
      if (this.heatmap) {
        layer = this.getHeatVectorLayer()
      } else {
        layer = this.getVectorLayer()
      }
    }
    if (layer)
      this.myMap.addLayer(layer)
  },
  switchMap() {
    if (this.myLayer) {
      let url = this.sourceMap === '0' ? 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png'
        : this.sourceMap === '1' ? 'https://maps-cdn.salesboard.biz/styles/klokantech-3d-gl-style/{z}/{x}/{y}.png'
          : this.sourceMap === '2' ? 'http://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
            : 'http://{a-c}.tile.stamen.com/watercolor/{z}/{x}/{y}.png'
      this.myLayer.setSource(new OSM({ url: url }))
    }
  },
  switchLayer(type) {
    if (this.removeLayer(type)) {
      this.addLayer(type)
    }
  },
  mouseMoveEvent(event) {
    this.mousePos = this.myMap.getEventPixel(event);
    this.myMap.render();
  },
  mouseOutEvent(event) {
    this.mousePos = null;
    this.myMap.render();
  },
  updateContainer() {
    this.container.addEventListener('mousemove', this.mouseMoveEvent);
    this.container.addEventListener('mouseout', this.mouseOutEvent);
  },
  clipLens(event) {
    let radius = this.spyTerrain ? 75 : 0
    let ctx = event.context;
    let pixelRatio = event.frameState.pixelRatio;
    ctx.save();
    ctx.beginPath();
    if (this.mousePos) {
      ctx.arc(this.mousePos[0] * pixelRatio, this.mousePos[1] * pixelRatio,
        radius * pixelRatio, 0, 2 * Math.PI);
      ctx.lineWidth = 5 * pixelRatio;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.stroke();
    }
    ctx.clip();
  },
  postClip(event) {
    event.context.restore();
  },
  getMapObject() {
    this.container = document.getElementById('map');
    this.updateContainer = this.updateContainer.bind(this)
    this.clipLens = this.clipLens.bind(this)
    this.postClip = this.postClip.bind(this)
    this.mouseMoveEvent = this.mouseMoveEvent.bind(this)
    this.mouseOutEvent = this.mouseOutEvent.bind(this)
    let center = [-119, 34]
    let attr = { }
    this.myLayer = new TileLayer({
      source: new OSM({
        attributions: [
          'Gauges by <a href="http://bernii.github.io/gauge.js/">gauge.js</a>.',
            ATTRIBUTION
        ],
        url: 'http://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        
      })
    })
    this.lens = new TileLayer({
      source: new OSM({
        attributions: [
          'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
          ATTRIBUTION,
        ],
        url: 'http://tile.stamen.com/terrain/{z}/{x}/{y}.jpg'
      })
    })
    this.lens.on('precompose', (event) => {
      this.clipLens(event)
    })
    this.lens.on('postcompose', (event) => {
      this.postClip(event)
    })
    this.updateContainer()

    let layers = [
      this.myLayer,
      this.lens,
      (this.heatmap) ? this.getHeatVectorLayer() : this.getVectorLayer(),
    ]
    this.myMap = new Map({
      target: 'map',
      layers: layers,
      view: new View({
        center: this._transform(center),
        zoom: 2.8
      })
    })
    return this.myMap
  },
  toggleSpy(value) {
    this.spyTerrain = value
  },
  styleGauge(feature) {
    //test gauge
    let mag = parseFloat(feature.get('mag'))
    mag = mag > 0 ? mag : 0
    let canvas = (document.createElement('canvas'));
    let style = this.styleCache[mag]
    if (this.styleCache[mag])
      return style

    canvas.width = 125
    canvas.height = 125
    var opts = {
      lines: 12,
      angle: .05, // The span of the gauge arc
      lineWidth: .08, // The line thickness
      radiusScale: 0.2, // Relative radius
      pointer: {
        length: 0.6, // // Relative to gauge radius
        strokeWidth: 0.035, // The thickness
        color: '#000000' // Fill color
      },
      limitMax: false,     // If false, max value increases automatically if value > maxValue
      limitMin: false,     // If true, the min value of the gauge will be fixed
      percentColors: [[0.0, "#a9d70b" ], [0.50, "#f9c802"], [1.0, "#ff0000"]], // !!!!
      strokeColor: '#E0E0E0',
      generateGradient: true,
      staticLabels: {
        font: "9px sans-serif",  // Specifies font
        labels: [0, 2, 4, 6, 8, 10],  // Print labels at these values
        color: "#000000",  // Optional: Label text color
        fractionDigits: 0  // Optional: Numerical precision. 0=round off.
      },
      highDpiSupport: true,     // High resolution support
    };
    var target = canvas; // your canvas element
    var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
    gauge.maxValue = 9.0; // set max gauge value
    gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    gauge.animationSpeed = 32; // set animation speed (32 is default value)
    gauge.set(mag); // set actual value
    style = new Style({
      image: new Icon({
        img: canvas,
        imgSize: [150, 150],
      })
    })
    this.styleCache[mag] = style
    return style
  },
  styleEarthquakes(feature) {
    let mag = parseFloat(feature.get('mag'))
    let geo = feature.get('geometry')
    let depth = geo.flatCoordinates[2]
    //normalize
    let size = depth / 100

    let time = parseFloat(feature.get('time'))
    let tsunami = parseInt(feature.get('tsunami'))
    let _date = new Date(time)
    let mins = (Date.now() - _date.getTime()) / 60000
    let maxTime = this.type === '0' ? 60 : this.type === '1' ? 60 * 24 : 60 * 24 * 7
    let opac = 1 - (mins / maxTime)
    mag = mag < 1 ? mag * 10
      : mag < 2 ? mag * 12
        : mag < 3 ? mag * 14
          : mag < 4 ? mag * 16
            : mag < 5 ? mag * 17
              : mag < 6 ? mag * 18
                : mag * 20
    if (mag <= 2) mag = 2
    mag += size
    let style = this.styleCache[mag]
    let color = `rgba(${Math.round((255) * opac)},${0},${Math.round(255 * (1 - opac))},${opac})`
    let strokecolor = `rgba(${0},${Math.round(255 * (1 - (opac / 2)))},${Math.round((255) * (opac / 2))},${1})`
    if (!style) {
      let canvas = (document.createElement('canvas'));

      /**
       * This ...
       */
      // let vectorContext = toContext((canvas.getContext('2d')),
      //   { size: [mag, mag], pixelRatio: 1 });
      // vectorContext.setStyle(new Style({
      //   fill: new Fill({ color: color }),
      //   stroke: new Stroke({ color: strokecolor, width: Math.round(size) })
      // }));
      // vectorContext.drawGeometry(new Circle([mag / 2, mag / 2], (mag / 2) - (size * 2)))

      /**
       * Is exactly the same as this...
       */

      let ctx = canvas.getContext('2d')
      canvas.width = mag
      canvas.height = mag
      ctx.fillStyle = color
      ctx.strokeStyle = strokecolor
      ctx.lineWidth = size
      ctx.beginPath()
      ctx.arc(mag / 2, mag / 2, (mag / 2) - (size * 2), Math.PI * 2, false)
      ctx.fill();
      ctx.stroke();

      if (tsunami === 1) {
        ctx.fillStyle = `rgba(${255},${255},${0},${opac})`
        this.drawRect(ctx, (mag / 2) - 10, (mag / 2) - 10, 20, 20, true, false)
      }


      style = new Style({
        image: new Icon({
          img: canvas,
          imgSize: [mag, mag],
        }),
        text: new Text({
          font: '15px Arial,sans-serif',
          overflow: true,
          fill: new Fill({
            color: '#000'
          }),
          stroke: new Stroke({
            color: '#fff',
            width: 1
          })
        })
      })
      let text = `Mag: ${String(feature.get('mag'))} (depth ${depth})`
      if (this.showLabels) {
        style.getText().setText(text)
      }
      this.styleCache[mag] = style;
    }
    return style
  },
  //helpers
  drawRect(ctx, x, y, w, h, fill = true, line = true) {
    if (line) ctx.strokeRect(x, y, w, h)
    if (fill) ctx.fillRect(x, y, w, h)
  },
  lineTo(ctx, x1, y1, x2, y2, solid = false) {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  },
  drawSphere(ctx, point, radius) {
    ctx.beginPath()
    ctx.arc(point.x, point.y, radius, Math.PI * 2, false)
    ctx.fill();
    ctx.stroke();
  },

}
export default mapObject