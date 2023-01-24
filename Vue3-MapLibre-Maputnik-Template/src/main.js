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

app.provide('tryParseJSON',tryParseJSON);

app.mount('#app');


