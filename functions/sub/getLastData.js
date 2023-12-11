const { getApiSync, postApiSync } = require("../support");
const { URL_API_LIVE, URL_API_IOT_LIVE } = require("../variable");

const getLastData = async(arrIdDevice) => {
    let status = '';
    try{
        let final;

        const hasil = await postApiSync(URL_API_IOT_LIVE + "/api-v1/getLastData", true, "2", 
                            {"idDevice": [...arrIdDevice]},
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
    getLastData
}