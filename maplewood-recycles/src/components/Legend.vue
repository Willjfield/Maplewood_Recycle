<template>
  <v-card dense class="mx-auto" max-width="400" tile>
    <v-list dense>
      <v-list-item>
        <span class="scale-item"></span
        ><span class="legend-text">No data or pop. &lt; 100</span></v-list-item
      >

      <v-list-item dense v-for="(item, idx) in scale" :key="item.stop">
        <div v-if="item.stop > 0">
          <span
            class="scale-item"
            :style="{ 'background-color': item.color }"
          ></span>
          <span class="legend-text" v-if="type === 'Percent'">
            <span v-if="idx > 0">{{ scale[idx - 1].stop * 100 }}% - </span
            ><span v-else>&lt;</span>{{ item.stop * 100 }}%
          </span>
          <span class="legend-text" v-if="type === 'Year'">
            <span v-if="idx > 0">Median yr built between {{ scale[idx - 1].stop}} &amp; </span
            ><span v-else>&lt;</span>{{ item.stop }}
          </span>
          <span class="legend-text" v-if="type === 'Monthly dollar'">
            <span v-if="idx > 0">${{ scale[idx - 1].stop }} - </span
            ><span v-else>&lt;</span>${{ item.stop }}
          </span>
          <span class="legend-text" v-if="type === 'Annual dollar'">
            <span v-if="idx > 0">${{ scale[idx - 1].stop }} - </span
            ><span v-else>&lt;</span>${{ item.stop }}
          </span>
          <span class="legend-text" v-if="type === 'Avg size'">
            <span v-if="idx > 0">{{ scale[idx - 1].stop }} - {{ item.stop }}</span
            ><span v-else>{{ item.stop }} or less</span>
          </span>
          <span class="legend-text" v-if="type === 'Index'">
            <span v-if="idx > 0">{{ scale[idx - 1].stop }} - </span
            ><span v-else>&lt;</span>{{ item.stop }}
          </span>
        </div>
      </v-list-item>
    </v-list>
  </v-card>
</template>
<script>
//import { inject } from "@vue/runtime-core";
import colorConfig from "../config/ColorConfig.json";

export default {
  props: ["type"],
  data() {
    return {
      scale: [],
    };
  },
  mounted() {
    
  },
  watch: {
    type(val){
      this.scale = colorConfig[val];
    }
  },
};
</script>

<style>
.scale-item {
  display: inline-block;
  height: 20px;
  width: 20px;
  border: 1px solid darkgray;
  border-radius: 4px;
}

.legend-text {
  vertical-align: text-bottom;
  padding: 0 5px;
}
</style>