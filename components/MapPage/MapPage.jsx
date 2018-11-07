'use_strict'
import React, { Component } from 'react'
import { mapObject } from '../../objects/Map'
const dat = require('dat.gui');
export class MapPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      map: null,
      loading: true,
      gui: new dat.GUI({ width: 400 }),
      heatmap: false,
      type: '0',// hour, day, week
      sourceMap: '2', 
      showLabels: false,
      spyTerrain: false,
      showGauge: false,
    }
  }
  async componentDidMount() {
    try{let map = await this.getMapObject()
    this.setState({
      map: map,
      loading: false,
      lastRefresh: Date(),
      timer: null,
      heatmap: false,
    })
    this.addGui()
    this.start()}
    catch(e){ Promise.reject(e)}
  }
  async getMapObject() {
    try{let map = await mapObject.create()
    map.heatmap = this.state.heatmap
    map.showLabels = this.state.showLabels
    map.myMap = map.getMapObject()
    return map}
    catch(e){ Promise.reject(e)}
  }
  addGui() {
    if (this.state.gui) {
      this.state.gui.destroy()
      this.state.gui = null
    }
    this.state.gui = new dat.GUI({ width: 400 })
    let controller = {
      heatmap: this.state.heatmap,
      type: this.state.type,
      sourceMap: this.state.sourceMap,
      showLabels: this.state.showLabels,
      spyTerrain: this.state.spyTerrain,
      showGauge: this.state.showGauge,
    }
    this.state.gui.add(controller, 'heatmap', 0, 1).name('Use Heatmap').onChange(async (value) => {
      try{if (this.state.heatmap === value) return
      this.state.heatmap = value
      this.state.map.heatmap = value
      await this.state.map.switchData(this.state.type)
      this.state.map.switchLayer('VECTOR')
      this.setState({
        heatmap: value,
      })}
      catch(e){ Promise.reject(e)}
    })
    this.state.gui.add(controller, 'type', { hour: 0, day: 1, week: 2 }).name('Type').onChange(async (value) => {
      try{if (this.state.type === value) return
      this.state.type = value
      await this.state.map.switchData(value)
      this.state.map.switchLayer('VECTOR')
      clearInterval(this.state.timer)
      this.start()
      this.setState({
        type: value,
        lastRefresh: Date(),
      })}
      catch(e){ Promise.reject(e)}
    })
    this.state.gui.add(controller, 'sourceMap', { Wiki: 0, Regular: 1, 'Black&white': 2, Watercolor: 3 }).name('Source Map').onChange((value) => {
      if (this.state.sourceMap === value) return
      this.state.sourceMap = value
      this.state.map.sourceMap = value
      this.state.map.switchMap()
      this.setState({
        sourceMap: value,
      })
    })
    this.state.gui.add(controller, 'showLabels', 0, 1).name('Show Labels').onChange(async (value) => {
      try{if (this.state.showLabels === value) return
      this.state.showLabels = value
      this.state.map.showLabels = value
      await this.state.map.switchData(this.state.map.type)
      this.state.map.switchLayer('VECTOR')
      this.setState({
        showLabels: value,
      })}
      catch(e){ Promise.reject(e)}
    })
    this.state.gui.add(controller, 'spyTerrain', 0, 1).name('Spy Terrain').onChange( (value) => {
      if (this.state.spyTerrain === value) return
      this.state.spyTerrain = value
      //this.state.map.spyTerrain = value
      this.state.map.toggleSpy(value)
      this.setState({
        spyTerrain: value,
      })
    })
    this.state.gui.add(controller, 'showGauge', 0, 1).name('Gauge').onChange( (value) => {
      if (this.state.showGauge === value) return
      this.state.showGauge = value
      this.state.map.showGauge = value
      this.state.map.switchLayer('VECTOR')
      this.setState({
        showGauge: value,
      })
    })
  }
  start() {
    this.timer = setInterval(() => {
      this.state.map.loadInfo()
      this.setState({
        lastRefresh: Date(),
      })
    }, 300000)
  }
  componentWillUnmount() {
    this.state.gui.destroy()
    this.state.gui = null
    clearInterval(this.state.timer)
  }
  render() {
    if (this.state.loading)
      return (<div>loading... </div>)
    let redStyle = {
      color: 'red',
      backgroundColor: 'rgba(0,0,0, 1)',
      textShadow: '1px 1px 1px white',
    }
    let blueStyle = {
      color: 'rgba(0,0,255, 1)',
      backgroundColor: 'rgba(0,0,0, 1)',
      textShadow: '1px 1px 1px white',
    }
    let greenStyle = {
      color: 'rgba(0,255,0, 1)',
      backgroundColor: 'rgba(0,0,0, 1)',
      textShadow: '1px 1px 1px white',
    }
    let yellowStyle ={
      color: 'rgba(255,255,0, 0.9)',
      backgroundColor: 'rgba(0,0,0, 1)',
      textShadow: '1px 1px 1px white',
    }
    let divStyle = {
      //border: '5px solid black',
      padding: '5px',
      boxShadow: '2px 2px 4px black',
      color: 'white',
      textShadow: '1px 1px 1px grey',
      fontSize: '14px',
      backgroundColor: 'rgba(0,0,0, 1)',
    }
    return (
      <div >
        <div style={{ fontSize: '10px', color: 'black', textShadow: '1px 1px 3px yellow' }}>
          <style type='text/css'>
          {`select {
              color: blue;
            }
            `}
          </style>
          last update: {this.state.lastRefresh}
        </div>
        <div style={divStyle}>
        Circle size is magnitude, Age color fades from opaque 
        <span style={redStyle}> Red</span> to transparent 
        <span style={blueStyle}> Blue</span>. Tsunami warnings are <span style={yellowStyle}>Yellow</span> squares. 
        Depth is the <span style={greenStyle}>Green</span> outline, 1px/100miles.
        </div>
      </div>
    )
  }
}
export default MapPage