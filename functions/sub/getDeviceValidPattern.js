const { getApiSync } = require("../support");
const { URL_API_LIVE } = require("../variable");

const getDeviceValidPattern = async() => {
    let status = '';
    try{
        let final;
        const hasil = await getApiSync(URL_API_LIVE + "/get/devicevalidpattern", null, 'application/json', "GET");
        if (
                ((typeof(hasil?.['statusCode'])) != 'undefined' && hasil?.['statusCode'] != null && hasil?.['statusCode'] == 200) || 
                (typeof(hasil?.['status']) != 'undefined' && hasil?.['status'] == 'success') ||
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
    getDeviceValidPattern
}