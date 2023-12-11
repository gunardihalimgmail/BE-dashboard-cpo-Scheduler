const { getApiSync } = require("../support");
const { URL_API_LIVE } = require("../variable");

const getJenisCompanyByDatentank = async(datebegin, tangki_id) => {
    let status = '';
    let final = {};
    try{

        const hasil = await getApiSync(URL_API_LIVE + "/getJenisByDatentank?tanggal=" + datebegin + "&tangki_id=" + tangki_id, null, 'application/json', "GET");
        if (
                ((typeof(hasil?.['statusCode'])) != 'undefined' && hasil?.['statusCode'] != null && hasil?.['statusCode'] == 200) || 
                (typeof(hasil?.['status']) != 'undefined' && hasil?.['status'].toString().toLowerCase() == 'success') ||
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
    getJenisCompanyByDatentank
}