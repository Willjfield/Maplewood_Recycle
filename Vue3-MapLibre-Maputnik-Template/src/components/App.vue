<template>
  <div>
    <!-- <v-autocomplete class="top-auto" dense v-model="model" :items="items"></v-autocomplete> -->
    <ToggleControls class="above-map" v-if="this.map" :map="this.map" />
    <Legend v-show="model" :type="this.type" class="above-map clear-all legend" />
    <!-- <v-card v-show="this.geoidHover.length > 0" class="above-map">Hovered FIPS:{{ this.geoidHover }}</v-card> -->

    <div id="main-map"></div>
  </div>
</template>
<script>
import ml from "maplibre-gl";
import { inject } from "vue";
import ToggleControls from "./ToggleControls.vue";
import Legend from "./Legend.vue";
export default {
  components: {
    ToggleControls,
    Legend,
  },
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
      hoverActive: false
    };
  },
  created() {
    this.dataManager = inject("dataManager");
    this.mitt = inject("mitt");
    this.env = this.dataManager.env;
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

    this.map.addControl(new ml.NavigationControl(), "bottom-left");
    if (this.hoverActive) {
      this.map.on('mousemove', 'tracts', (e) => {
        if (e.features && e.features.length > 0 && self.geoidHover !== e.features[0].properties.geoid20) {
          self.geoidHover = e.features[0].properties.geoid20;
          self.map.setPaintProperty('tract-outline', 'line-width', ["case", ["==", ["get", "geoid20"], self.geoidHover], 5, ["==", ["get", "geoid20"], self.clickedId], 5, 1])
        }
      });

      this.map.on('mouseleave', 'tracts', (e) => {
        self.geoidHover = ''
      });
    }
    this.map.on('click', 'tracts', (e) => {
      if (e.features && e.features.length > 0) {
        self.searching = true;
        self.selectedData = null;
        //if()
        self.clickedId = e.features[0].properties.geoid20;
        self.map.setPaintProperty('tract-outline', 'line-width', ["case", ["==", ["get", "geoid20"], self.clickedId], 5, 1])
        self.map.setPaintProperty('tract-outline', 'line-opacity', ["case", ["==", ["get", "geoid20"], self.clickedId], 1, .2])
        self.map.setPaintProperty('tract-outline', 'line-color', ["case", ["==", ["get", "geoid20"], self.clickedId], "purple", "black"])

        this.dataManager.getDataForGeoid20(e.features[0].properties.geoid20).then((resp) => {
          self.selectedData = resp.data[0];
          //console.log(self.data)
          self._keys = self.data.filter(k => k.type === 'Percent' || k.type === 'Count').map(k => k.variable)
          self.searching = false;
          self.map.setPaintProperty('tract-outline', 'line-width', ["case", ["==", ["get", "geoid20"], self.clickedId], 5, 1])
          self.map.setPaintProperty('tract-outline', 'line-opacity', ["case", ["==", ["get", "geoid20"], self.clickedId], 1, .2])
          self.map.setPaintProperty('tract-outline', 'line-color', ["case", ["==", ["get", "geoid20"], self.clickedId], "purple", "black"])


        }).catch(e => {
          self.map.setPaintProperty('tract-outline', 'line-width', 1)
          self.map.setPaintProperty('tract-outline', 'line-opacity', .2)
          self.map.setPaintProperty('tract-outline', 'line-color', "black")

          self.selectedData = null
          self.clickedId = null
          self.searching = false
        })
      } else {
        // self.map.setPaintProperty('tract-outline','line-width',1)
        // self.map.setPaintProperty('tract-outline','line-opacity',.2)
        // self.map.setPaintProperty('tract-outline','line-color',"black")

        //   self.selectedData = null
        //   self.clickedId = null
        //   self.searching = false
      }
    });

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
  },
};
</script>

<style scoped>
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
  top: 0;
  left: 0;
  height: 100%;
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
</style>
