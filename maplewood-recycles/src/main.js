import 'vuetify/styles'; // Global CSS has to be imported
import { createApp } from 'vue';
import * as components from 'vuetify/components';
import { createVuetify } from 'vuetify';
import App from './components/App.vue';
import mitt from 'mitt';

import DataManager from "./js/datamanager";

const vuetify = createVuetify({ components }); // Replaces new Vuetify()

const app = createApp(App).use(vuetify);
app.provide('mitt',mitt());
app.provide('dataManager',new DataManager());

function tryParseJSON (jsonString){
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) { }
    return false;
};

// This script is released to the public domain and may be used, modified and
// distributed without restrictions. Attribution not necessary but appreciated.
// Source: https://weeknumber.net/how-to/javascript

// Returns the ISO week of the date.
Date.prototype.getWeek = function() {
    var date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    var week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                          - 3 + (week1.getDay() + 6) % 7) / 7);
  }

app.provide('tryParseJSON',tryParseJSON);

app.mount('#app');


