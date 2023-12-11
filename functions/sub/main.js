const { getAPI_Suhu1Titik } = require("./getAPI_Suhu1Titik");
const { getCompany } = require("./getCompany");
const { getCompanyTangki } = require("./getCompanyTangki");
const { getDataHour_Await } = require("./getDataHour_Await");
const { getDeviceValidPattern } = require("./getDeviceValidPattern");
const { getJenisCompanyByDatentank } = require("./getJenisByDatentank");
const { getLastData } = require("./getLastData");

module.exports = {
    getDeviceValidPattern,
    getCompany,
    getAPI_Suhu1Titik,
    getCompanyTangki,
    getLastData,
    getJenisCompanyByDatentank,
    getDataHour_Await
}