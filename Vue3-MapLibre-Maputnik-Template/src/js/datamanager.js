import axios from "axios";
import mainConfig from "../config/MainConfig.json";
import colorConfig from "../config/ColorConfig.json";

export default class DataManager {
    constructor() {
        this.mainConfig = mainConfig;
        this.colorConfig = colorConfig;
        const _envArr = mainConfig.environments.filter(f => f[1] === window.location.hostname);
        this.env = _envArr.length > 0 ? _envArr[0][1] : 'LOCAL';
    }
    getDropDownList(){
        return axios(`${this.mainConfig.api.hosts.cuny[this.env]}/query/coi_vars_sort?columns=*&limit=0`)
    }
    getDataForVar(_var){
        return axios(`${this.mainConfig.api.hosts.cuny[this.env]}/query/coi_data_filter?columns=stacotr20%2C${_var.variable}${_var.denomvar ? '%2C'+_var.denomvar :''}&limit=0`)
    }
    getDataForGeoid20(geoid){
        return axios(`${this.mainConfig.api.hosts.cuny[this.env]}/query/coi_data_filter?filter=stacotr20='${geoid}'&columns=*&limit=0`)
    }
}