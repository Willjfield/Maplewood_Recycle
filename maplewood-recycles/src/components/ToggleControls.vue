<template>
  <v-card class="mx-auto" max-width="400" tile>
    <v-list>
      <v-list-item dense v-for="layer in layers" :key="layer.id">
        <v-checkbox
          v-model="selected"
          :label="tryParseJSON(layer.metadata['maputnik:comment']).label"
          :value="layer.id"
        ></v-checkbox>
      </v-list-item>
    </v-list>
  </v-card>
</template>
<script>
import { inject } from "@vue/runtime-core";
export default {
  props: ["map"],
  data() {
    return {
      layers: [],
      selected: [],
    };
  },
  mounted() {
    this.tryParseJSON = inject("tryParseJSON");

    let self = this;
    this.map.once("idle", () => {
      self.layers = self.map
        .getStyle()
        .layers
        .filter((l) => l.metadata && l.metadata["maputnik:comment"])
        .filter((l) => {
          return this.tryParseJSON(l.metadata["maputnik:comment"]).toggle;
        });

        self.layers.forEach(l=>{
         // console.log(self.map.getLayoutProperty(l.id,'visibility'))
          if(self.map.getLayoutProperty(l.id,'visibility') === 'visible'){
           // console.log(l.id)
            self.selected.push(l.id)
            self.$forceUpdate()
          }
        })

       // console.log(self.selected)
    });
  },
  watch: {
    selected(val) {
      this.layers.forEach((l) => {
        const _visibility = val.includes(l.id) ? "visible" : "none";
        //TODO: For labels: if l's comment parsed as json includes linked layers, toggle those ones to match
        this.map.setLayoutProperty(l.id, "visibility", _visibility);
        let comment = this.tryParseJSON(l.metadata["maputnik:comment"]);
        const linkedLayers =  comment['linked-layers'] || null;
        if(linkedLayers){
            linkedLayers.forEach((linkedlayer) =>{
                this.map.setLayoutProperty(linkedlayer, "visibility", _visibility);
            })
        }
      });
      this.map.getLayer(val);
    },
  },
};
</script>