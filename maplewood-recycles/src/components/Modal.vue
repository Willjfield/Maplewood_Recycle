<template>
    <div class="text-center">
      <v-dialog
        v-model="dialog"
      >
  
        <v-card>
          <v-card-text>
            <p>This is an independent site not affiliated with Maplewood DPW. If you notice and errors or have comments please email <a href="mailto:wijfi@duck.com">wijfi@duck.com</a></p>
          </v-card-text>
          <v-card-text>
            <p>This does <b>NOT</b> take into account changes to the regular schedule (holidays, inclement weather, etc.) <a href="https://www.maplewoodnj.gov/government/public-works/recycling-and-waste-disposal" target="_blank">Please check the DPW website for updates.</a></p>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" block @click="dialog = false">OK</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </template>
  <script>
  export default {
    data () {
      return {
        dialog: true,
      }
    },
  }
</script>