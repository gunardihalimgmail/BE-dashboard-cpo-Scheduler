const { getApiSync } = require("../support");
const { URL_API_LIVE } = require("../variable");

const getAPI_Suhu1Titik = async(arrCompanyId) => {
    let status = '';
    try{
        let final;
        const hasil = await getApiSync(URL_API_LIVE + "/company/tangki/suhu1titik?company_id=" + arrCompanyId, null, 'application/json', "GET");
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
    getAPI_Suhu1Titik
}