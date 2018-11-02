import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import GeoJSON from 'ol/format/GeoJSON.js';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import Circle from 'ol/geom/Circle.js';
import { Vector as VectorLayer, Heatmap as HeatmapLayer } from 'ol/layer.js';
import { transform } from 'ol/proj.js';
import { toContext } from 'ol/render.js';
import { Circle as CircleStyle, Fill, Stroke, Style, Text, Icon } from 'ol/style.js';
export const mapObject = {
  rawData: null,
  heatmap: false,
  myMap: null,
  type: '0',
  myLayer: null,
  sourceMap: '0',
  styleCache: {},
  showLabels: true,
  async create({ ...args }) {
    this.rawData = await this.loadInfo()
    this.updateCoords()
    return Object.assign(Object.create(this), { ...args })
  },
  async refresh() {
    this.rawData = await this.loadInfo()
    this.updateCoords()
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
    let path = this.type === '0' ? 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson'
      : this.type === '1' ? 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'
        : 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'
    let result = await window.fetch(path).catch(reason => { return reason })
    if (!result.ok) return Promise.reject(result)
    let jsResult = await result.json().catch(reason => { return reason })
    if (!jsResult) return 0
    //Fix up data
    let fixed = {
      features:[],
      bbox: [...jsResult.bbox],
      metadata: {...jsResult.metadata},
      type: jsResult.type,
    }
    jsResult.features.forEach(feature =>{
      if (parseFloat(feature.properties.mag ) < 0)   return
      fixed.features = fixed.features.concat(feature)
    })
    this.rawData = fixed
    return jsResult
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
      style: this.styleEarthquakes.bind(this),
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
    this.type = type
    this.styleCache = []
    return await this.refresh()
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
  getMapObject() {
    let center = [-119, 34]
    this.myLayer = new TileLayer({ source: new OSM({ url: 'https://maps-cdn.salesboard.biz/styles/klokantech-3d-gl-style/{z}/{x}/{y}.png' }) })
    let layers = [
      new TileLayer({ source: new OSM() }),
      this.myLayer,
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
  styleEarthquakes(feature) {
    let geo = feature.get('geometry')
    let depth = geo.flatCoordinates[2]
    //normalize at 100 miles
    let size = depth / 75
    let mag = parseFloat(feature.get('mag'))
    let time = parseFloat(feature.get('time'))
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
      let vectorContext = toContext((canvas.getContext('2d')),
        { size: [mag, mag], pixelRatio: 1 });
      vectorContext.setStyle(new Style({
        fill: new Fill({ color: color }),
        stroke: new Stroke({ color: strokecolor, width: Math.round(size) })
      }));
      vectorContext.drawGeometry(new Circle([mag / 2, mag / 2], (mag / 2) - (size * 2)))

      /**
       * Is exactly the same as this...
       */

      // let ctx = canvas.getContext('2d')
      // ctx.fillStyle = color
      // ctx.strokeStyle = strokecolor
      // ctx.lineWidth = Math.round(size) 
      // ctx.beginPath()
      // ctx.arc(mag / 2, mag / 2, (mag / 2) - (size * 2), Math.PI * 2, false)
      // ctx.fill();
      // ctx.stroke();




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
}
export default mapObject