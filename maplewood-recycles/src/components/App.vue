<template>
  <div class="title">
    <h2 style="color:#44744c;">Maplewood Recycling</h2>
    <!-- <h4>When? What? How?</h4> -->
  </div>
  <div>
    <div id="main-map">
      <div v-show="geoidHover > -1" id="hover-popup">
        <span class="hover-note"> You're hovered over zone {{ geoidHover }}</span>
        <br>
        Regular Pickup Day: {{ daysOfWeek[collectionDays[geoidHover]] }}
        <div class="small-hover-note">Click the map, enter address in the box, or geolocate for more info</div>
      </div>
    </div>
    <v-sheet>
      <div id="geocoder" class="geocoder-container mx-auto"></div>
    </v-sheet>

    <v-sheet class="side-info">
      <p class="disclaimer">This is an independent site not affiliated with Maplewood DPW. If you notice and errors, please email <a href="mailto:wijfi@duck.com">wijfi@duck.com</a></p>
<v-divider></v-divider>
      <div v-show="zone < 0">
        <b>
          Check your recycling schedule by:
          <br>
          <ul>
            <li>Clicking the map</li>
            <li>Entering your address in the box on the right</li>
            <li>Clicking the geolocate icon (<svg
                class="mapboxgl-ctrl-geocoder--icon mapboxgl-ctrl-geocoder--icon-geolocate" viewBox="0 0 18 18"
                xml:space="preserve" width="18" height="18">
                <path
                  d="M12.999 3.677L2.042 8.269c-.962.403-.747 1.823.29 1.912l5.032.431.431 5.033c.089 1.037 1.509 1.252 1.912.29l4.592-10.957c.345-.822-.477-1.644-1.299-1.299z"
                  fill="#4264fb"></path>
              </svg>) in the box on the right
            </li>
          </ul>
        </b>
        <br>
        Starting in January 2023, recycling materials will need to be separated into two categories for two distinct
        pickups on alternating weeks. One week’s pickup will be exclusively for Fibers (cardboard, paper) and the
        following week’s pickup will be for Commingled (plastic, glass, and metal containers). Cross-contaminated
        recycling loads or materials put out on the wrong week will not be picked up. For more information on what
        materials can and cannot be recycled, please reference the FAQ section at the bottom of this page. To download a
        copy of the recycling guide, <a
          href="https://www.maplewoodnj.gov/home/showpublisheddocument/984/638059490986930000">click here</a>.
      </div>
      <v-card variant="flat"  v-show="zone > 0">
        <v-btn class="reset-btn" flat variant="outlined" append-icon="mdi-restart" rounded @click="reset()"> Reset</v-btn> 
        <v-card variant="flat" class="outer-info-card" v-show="zone > 0">
        The location you selected is in <b>Zone {{ zone }} </b>
        <br>
        Your next collection is
        <span style="font-weight:bold;" v-show="nextCollectionWeek === nextWeek && !collectionIsToday">
          next week on {{
          daysOfWeek[collectionDays[zone]] }}
        </span>
        <span style="font-weight:bold;" v-show="nextCollectionWeek === thisWeek && !collectionIsToday">
          this week on {{
          daysOfWeek[collectionDays[zone]] }}
        </span>
        <span v-show="collectionIsToday">today.</span>
        <div v-show="collectionType === 'F'">
          <div class="type-of-week"> It is a <b>FIBER</b> week
          <h4>(Cardboard & Paper)</h4>
        </div>
          <ul  class="item-list">
        <li v-for="f in fiber" :key="f">
          - {{ f }}
          </li>
          </ul>
         
        </div>
        <div v-show="collectionType === 'C'">
          <div class="type-of-week"> It is a <b>COMMINGLED</b> week
          <h4>(Glass, Metal & Plastic)</h4></div>
          <ul class="item-list">
        <li v-for="f in mixed" :key="f">
          - {{ f }}
          </li>
          </ul>
        </div>
      </v-card>
      </v-card>
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
import { polygon } from "@turf/helpers";
import add from 'date-fns/add'

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
      geoidHover: -1,
      clickedId: '',
      selectedData: null,
      _keys: null,
      searching: false,
      hoverActive: true,
      geocoder: null,
      selectedAddress: {},
      fiber: [
        "Corrugated Cardboard (Flattened no packing materials)",
        "Boxboard (Flattened cereal boxes etc)",
        "Paper Bags",
        "Junk Mail (Including window envelopes)",
        "Office Paper",
        "Newspapers & Magazines",
        "Only Corrugated Brown Pizza Boxes (No grease. Food & liner removed)",
      ],
      mixed: [
        "#1, 2, & 5 Plastic Containers & Bottles with Caps",
        "Glass Bottles (Any Color) & Jars with Lids",
        "Aluminum cans, pie tins, & catering trays",
        "Steel/tin Food Cans",
        "Gable Top cartons (OJ, Milk, aseptic packaging)",
        "Juice Boxes (TetraPak)",
      ],
      collectionType: "",
      nextCollectionWeek: "",
      collectionIsToday: false,
      zone: -1,
      daysOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      collectionDays: [
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

    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });

    this.now;

    if (params.year && params.week && params.day) {
      this.now = new Date(params.year, params.week, params.day);
    } else {
      this.now = new Date();
    }

    this.today = this.now.getDay();

    this.thisWeek = this.now.getWeek();

    this.nextWeek = add(this.now, { weeks: 1 }).getWeek();

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
      accessToken: this.dataManager.mainConfig.api.keys.mapbox,
      mapboxgl: mapboxgl,
      bbox: [-74.3031128519256, 40.71514165, -74.237198398, 40.764057727],
      types: 'address',
      enableGeolocation: true,
      placeholder: 'Enter address or click arrow to geolocate'
    }

    this.geocoder = new MapboxGeocoder(geocoderOpts)
      .on('result', (res) => {
        this.selectedAddress = res.result;
      })
      .on('clear', () => {
        this.selectedAddress = {};
      })
      .addTo("#geocoder")

    this.map.addControl(new ml.NavigationControl(), "bottom-left");
    if (this.hoverActive) {
      this.map.on('mousemove', 'maplewood-zones', (e) => {
        // console.log(e.features)
        if (e.features && e.features.length > 0 && self.geoidHover !== e.features[0].properties.id) {
          self.geoidHover = e.features[0].properties.id;
          self.map.setPaintProperty('maplewood-zones', 'fill-opacity', ["case", ["==", ["get", "id"], self.geoidHover], .85, ["==", ["get", "id"], self.clickedId], .85, .5])
          self.map.setPaintProperty('maplewood-zone-outline', 'line-width', ["case", ["==", ["get", "id"], self.geoidHover], 4, ["==", ["get", "id"], self.clickedId], 4, 2])

        }
      });

      this.map.on('mouseleave', 'maplewood-zones', (e) => {
        self.geoidHover = -1;
        self.map.setPaintProperty('maplewood-zone-outline', 'line-width', 2)
        self.map.setPaintProperty('maplewood-zones', 'fill-opacity', .75)
      });
    }
    this.map.on('click', 'maplewood-zones', (e) => {
      if (e.features && e.features.length > 0) {
        if (this.marker) {
          this.marker.remove();
          this.marker = null;
        }

        self.setFromLngLat(e.lngLat.lng, e.lngLat.lat)
        // self.clickedId = e.features[0].properties.id;
        self.map.setPaintProperty('maplewood-zones', 'fill-opacity', ["case", ["==", ["get", "id"], self.clickedId], .85, .5])
        self.map.setPaintProperty('maplewood-zone-outline', 'line-width', ["case", ["==", ["get", "id"], self.clickedId], 4, 2])
      } else {
        self.clickedId = ''
        self.map.setPaintProperty('maplewood-zone-outline', 'line-width', 2)
        self.map.setPaintProperty('maplewood-zones', 'fill-opacity', .75)
      }
    });

  },
  methods: {
    reset() {
      this.zone = -1
      this.nextCollectionWeek = false;
      this.collectionIsToday = false;
      this.collectionType = ""
      if (this.marker) {
        this.marker.remove();
        this.marker = null;
      }
    },
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
    setFromLngLat(lng, lat) {
      maplewood.features.forEach((f) => {
        let poly = polygon(f.geometry.coordinates[0]);
        if (bpp([lng, lat], poly)) {
          this.zone = f.properties.id;
        }
      });

      this.nextCollectionWeek = this.today > this.collectionDays[this.zone] ? this.nextWeek : this.thisWeek;
      console.log(this.nextCollectionWeek)
      this.collectionIsToday = this.today === this.collectionDays[this.zone];

      this.collectionType = this.nextCollectionWeek % 2 === 0 ? 'C' : 'F';

      this.marker = new ml.Marker({
        color: "#FFFFFF",
        draggable: true
      }).setLngLat([lng, lat])
        .addTo(this.map);

      this.map.flyTo({
        // These options control the ending camera position: centered at
        // the target, at zoom level 9, and north up.
        center: [lng, lat],
        zoom: 16
      })

    }
  },
  watch: {
    model(_var) {

    },
    selectedAddress(_val) {
      if (this.marker) {
        this.marker.remove();
        this.marker = null;
      }

      this.setFromLngLat(_val.center[0], _val.center[1])
    }
  },
};
</script>

<style>

.type-of-week{
  text-align: center;
    padding: 15px 0;
}
.outer-info-card{
  clear: both;
  padding-top: 4%;
}
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
  top: 5%;
  bottom: 0;
  left: 33%;
  right: 0%;
  z-index: -1;
}

#main-map div.maplibregl-canvas-container.mapboxgl-canvas-container {
  cursor: crosshair;
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

.geocoder-container {
  float: right;
  margin: 5px;
}

.mapboxgl-ctrl-geocoder.mapboxgl-ctrl {
  width: 100%;
  min-width: 355px;
  margin: 5px;
}

.title {
  text-align: center;
  background: white;
  height: 40px;
}

.side-info {
  position: absolute;
  top: 40px;
  bottom: 0;
  padding: 0 40px;
  width: 33%;
  overflow-y: auto;
}

.reset-btn {
  float: right;
}

#hover-popup {
  position: absolute;
  left: 10px;
  top: 18px;
  z-index: 1;
  background: rgba(255, 255, 255, 0.75);
  padding: 5px;
  font-size: large;
  border: 1px solid black;
}

.hover-note{
  font-size: medium;
}

.small-hover-note{
  font-size: small;
  font-style: italic;
}

.disclaimer{
  font-size: small;
  line-height: 1;
  padding:5px 0px;
}
</style>
<style>
.portrait #main-map{
  left:0;
  right:0;
  bottom: 50%;
}

.portrait .side-info{
  top:50%;
  right: 0;
  left: 0;
  width: 100%;
}

.portrait #hover-popup {
  display: none;
}
</style>
