const { getApiSync, postApiSync, formatDate } = require("../support");
const { URL_API_LIVE, URL_API_IOT_LIVE } = require("../variable");

const getDataHour_Await = async(datebegin, hourbegin, hourlast, arrIdDevice) => {
    let status = '';
    let final = {};
    try{

        let hasil = await postApiSync(URL_API_IOT_LIVE + "/api-v1/getDataHour?sort=ASC", true, "2", 
                            {
                                "date":formatDate(new Date(datebegin),'YYYY-MM-DD'),
                                "hourBegin": typeof hourbegin == 'undefined' || hourbegin == null ? '06:00' : hourbegin,
                                "hourLast": typeof hourlast == 'undefined' || hourlast == null ? '06:30' : hourlast,
                                "minutes":true,
                                "idDevice": [...arrIdDevice]
                            },
                            'application/json');
        if (
                ((typeof(hasil?.['statusCode'])) != 'undefined' && hasil?.['statusCode'] != null && hasil?.['statusCode'] == 200) || 
                (typeof(hasil?.['status']) != 'undefined' && hasil?.['status'] == 'success') ||
                (typeof(hasil?.['responseCode']) != 'undefined' && hasil?.['responseCode'] != null && hasil?.['responseCode'] == 200) ||
                (Array.isArray(hasil))
            )
        {
            status = 'success';
            final = {status, hasil};
        }
        else
        {
            status = 'failed';
            final = {status}
        }

        return final;

    } catch(error){
        console.error("Terjadi kesalahan: ", error);
        status = 'failed';
        final = {status};
        return final;
    }
}

module.exports = {
    getDataHour_Await
}