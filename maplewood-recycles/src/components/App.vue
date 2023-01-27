<template>
  <div class="title">
  <h2>Maplewood Recycling</h2>
  <h4>When? What? How?</h4>
</div>
  <div>
    <div id="main-map"></div>
    <v-sheet>
      <v-sheet ><div id="geocoder" class="geocoder-container mx-auto"></div></v-sheet>
      <!-- <div v-show="this.selectedAddress.address">{{ this.selectedAddress['place_name_en-US'] }}</div> -->
      <span v-show="zone > 0">You are in Zone {{ zone }}</span>
      Your next collection is 
      <span style="font-weight:bold;" v-show="nextCollectionWeek === nextWeek && !collectionIsToday">next {{ daysOfWeek[collectionDays[zone]] }}</span>
      <span style="font-weight:bold;" v-show="nextCollectionWeek === thisWeek && !collectionIsToday">this {{ daysOfWeek[collectionDays[zone]] }}</span>
      <span v-show="collectionIsToday">today</span>.
      <div v-show="collectionType === 'F'">
      It is a <b>FIBER</b> week
      <h4>Cardboard & Paper</h4>
      <ul>
        <li>Corrugated Cardboard (Flattened no packing materials)</li>
        <li>Boxboard (Flattened cereal boxes etc)</li>
        <li>Paper Bags</li>
        <li>Junk Mail (Including window envelopes)</li>
        <li>Office Paper</li>
        <li>Newspapers & Magazines</li>
        <li>Only Corrugated Brown Pizza Boxes (No grease. Food & liner removed)</li>
      </ul>
    </div>
    <div v-show="collectionType === 'C'">
      It is a <b>COMMINGLED</b> week
      <h4>Glass, Metal & Plastic</h4>
      <ul>
        <li>#1, 2, & 5 Plastic Containers & Bottles with Caps</li>
        <li>Glass Bottles (Any Color) & Jars with Lids</li>
        <li>Aluminum cans, pie tins, & catering trays</li>
        <li>Steel/tin Food Cans</li>
        <li>Gable Top cartons (OJ, Milk, aseptic packaging)</li>
        <li>Juice Boxes (TetraPak)</li>
      </ul>
    </div>
    </v-sheet>
  </div>
</template>
<script>
import ml from "maplibre-gl";
import { inject } from "vue";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import bpp from "@turf/boolean-point-in-polygon";
import {polygon} from "@turf/helpers";
import maplewood from "../assets/Maplewood_zones.json"//"https://gist.githubusercontent.com/Willjfield/12464b6bee6c21d40da3feb4bd0c42ca/raw/3c4a8cbfaab2198e6e00a6e22cc7ef83e98cb571/Maplewood-Zones.json"
export default {
  components: {},
  data() {
    return {
      data: null,
      items: [],
      model: null,
      map: null,
      type: '',
      geoidHover: '',
      clickedId: '',
      selectedData: null,
      _keys: null,
      searching: false,
      hoverActive: true,
      geocoder:null,
      selectedAddress:{},
      collectionType: "",
      nextCollectionWeek:"",
      collectionIsToday: false,
      zone:-1,
      daysOfWeek:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
      collectionDays:[
        -1,
        1,
        1,
        2,
        2,
        3,
        3
      ]
    };
  },
  created() {
    this.dataManager = inject("dataManager");
    this.mitt = inject("mitt");
    this.env = this.dataManager.env;

    this.today = new Date().getDay();

    this.thisWeek = new Date().getWeek();
    this.nextWeek= this.thisWeek+1;

   // this.collectionType = this.thisWeek % 2 === 0 ? 'C' : 'F';
    //console.log(this.collectionType)
  },
  computed: {

  },
  mounted() {
    let self = this;

    let config = this.dataManager.mainConfig.mapConfig;

    config.transformRequest = (url, resourceType) => {
      let _url;
      _url = url.replace('{key}', this.dataManager.mainConfig.api.keys.maptiler)
      const envs = Object.fromEntries(this.dataManager.mainConfig.environments);
      //console.log(self.env)
      switch (self.env) {
        case 'PROD':
          _url = _url.replace(envs["DEV"], envs["PROD"]);
        case 'DEV': case "LOCAL": default:
          _url = _url.replace(envs["PROD"], envs["DEV"]);
      }

      return {
        url: _url,
        //headers: { 'my-custom-header': true },
        //credentials: 'include'  // Include cookies for cross-origin requests
      };

    }
    this.map = new ml.Map(config);

    const geocoderOpts = {
      accessToken:  this.dataManager.mainConfig.api.keys.mapbox,
      mapboxgl: mapboxgl,
      bbox: [-74.3031128519256, 40.71514165, -74.237198398, 40.764057727],
      types:'address',
      enableGeolocation: true,
      placeholder:'Enter address or click arrow to geolocate'
    }

    this.geocoder = new MapboxGeocoder(geocoderOpts)
    .on('result',(res)=>{
      console.log(res)
      this.selectedAddress = res.result;
    })
    .on('clear',()=>{
      this.selectedAddress={};
    })
    .addTo('#geocoder')
    
    this.map.addControl(new ml.NavigationControl(), "bottom-left");
    if (this.hoverActive) {
      this.map.on('mousemove', 'maplewood-zones', (e) => {
       // console.log(e.features)
        if (e.features && e.features.length > 0 && self.geoidHover !== e.features[0].properties.id) {
          self.geoidHover = e.features[0].properties.id;
          self.map.setPaintProperty('maplewood-zones', 'fill-opacity', ["case", ["==", ["get", "id"], self.geoidHover], .85, .5])
        }
      });

      this.map.on('mouseleave', 'maplewood-zones', (e) => {
        self.geoidHover = ''
        self.map.setPaintProperty('maplewood-zones', 'fill-opacity', .75)
      });
    }
    // this.map.on('click', 'tracts', (e) => {
    //   if (e.features && e.features.length > 0) {

    //   } else {
    //     // self.map.setPaintProperty('tract-outline','line-width',1)
    //     // self.map.setPaintProperty('tract-outline','line-opacity',.2)
    //     // self.map.setPaintProperty('tract-outline','line-color',"black")

    //     //   self.selectedData = null
    //     //   self.clickedId = null
    //     //   self.searching = false
    //   }
    // });

  },
  methods: {
    getColor(val, type) {
      const scale = this.dataManager.colorConfig[type];
      for (let c = 0; c < scale.length; c++) {
        if (val < scale[c].stop) return scale[c].color;
      }

      return scale[scale.length - 1].color;
    },
    styleTractsLayer(_data, type) {
      const matchExpression = ["match", ["get", "geoid20"]];

      for (const row of _data) {
        if (row.val) {
          let color = this.getColor(row.val, type);
          matchExpression.push(row["geoid20"], color);
        }
      }

      matchExpression.push("rgba(0, 0, 0, 0)");

      this.map.setPaintProperty("tracts", "fill-color", matchExpression);
    },
  },
  watch: {
    model(_var) {

    },
    selectedAddress(_val){
      if(this.marker) {
        this.marker.remove();
        this.marker = null;
      }

      maplewood.features.forEach((f)=>{
        let poly = polygon(f.geometry.coordinates[0]);
        if(bpp([_val.center[0], _val.center[1]], poly)){
          this.zone = f.properties.id;
        }
      });

      this.nextCollectionWeek = this.today > this.collectionDays[this.zone] ? this.nextWeek : this.thisWeek;
      this.collectionIsToday = this.today === this.collectionDays[this.zone];

      this.collectionType = this.nextCollectionWeek % 2 === 0 ? 'C' : 'F';
      
      this.marker = new ml.Marker({
      color: "#FFFFFF",
      draggable: true
      }).setLngLat([_val.center[0], _val.center[1]])
      .addTo(this.map);
    }
  },
};
</script>

<style>
.above-map {
  z-index: 1;
  float: right;
}

.clear-all {
  clear: both;
  float: left;
}

#main-map {
  position: absolute;
  top: 34%;
  bottom: 0;
  left: 0;
  width: 100%;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

.top-auto {
  z-index: 999;
  position: absolute;
  width: 33%;

}

.data-display {
  max-width: 25%;
  max-height: 300px;
  overflow: scroll;
  float: right;
}

.legend {
  max-width: 400px;
  top: 67px;
  position: absolute;
  max-height: 90%;
  left: 10px;
  overflow: scroll;
}

.geocoder-container{
  width: 50%;
}

.geocoder-container .mapboxgl-ctrl-geocoder.mapboxgl-ctrl{
  width: 100%;
  margin: 0 auto;
}

.title{
  text-align: center;
}
</style>
