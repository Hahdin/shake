import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import GeoJSON from 'ol/format/GeoJSON.js';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import Circle from 'ol/geom/Circle.js';
import { Vector as VectorLayer, Heatmap as HeatmapLayer } from 'ol/layer.js';
import Feature from 'ol/Feature.js';
import { transform } from 'ol/proj.js';
import styles from './mapStyles'
// import { ATTRIBUTION } from 'ol/source/OSM.js';
// import XYZ from 'ol/source/XYZ.js';
export const mapObject = {
  rawData: null,
  heatmap: false,
  myMap: null,
  type: '0',
  myLayer: null,
  sourceMap: '0',
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
    this.rawData = jsResult
    return jsResult
  },
  getVectorSource() {
    return new VectorSource({
      features: (new GeoJSON()).readFeatures(this.rawData)
    })
  },
  addMagnitudeFeature(source){
    this.rawData.features.forEach(feature => {
      let coords = feature.geometry.coordinates
      if (coords) {
        let mag = parseFloat(feature.properties.mag)
        mag = mag < 1 ? mag * 10000 : mag < 2 ? mag * 20000 : mag < 3 ? mag * 30000 : mag < 4 ? mag * 40000 : mag < 5 ? mag * 50000 : mag < 6 ? mag * 60000 : mag * 100000
        let cir = new Circle(coords, mag)
        let feat = new Feature(cir)
        source.addFeature(feat)
      }
    })

  },
  getVectorLayer() {
    let source = this.getVectorSource()
    this.addMagnitudeFeature(source)
    return new VectorLayer({
      source: source,
      style: this.styleFunction,
    })
  },
  getHeatVectorLayer() {
    let source = this.getVectorSource()
    return new HeatmapLayer({
      source: source,
      style: this.styleFunction,
      blur: 30,
      radius: 15,
    })
  },
  // openSeaMapLayer() {
  //   return new TileLayer({
  //     source: new OSM({
  //       attributions: [
  //         'All maps © <a href="http://www.openseamap.org/">OpenSeaMap</a>',
  //         ATTRIBUTION
  //       ],
  //       opaque: false,
  //       url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png'
  //     })
  //   });
  // },
  async switchData(type) {//0 - hour, 1-day, 2-week
    this.type = type
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
  styleFunction(feature) {
    styles.Point.getText().setText(String(feature.get('mag')))
    return styles[feature.getGeometry().getType()];
  },
}
export default mapObject