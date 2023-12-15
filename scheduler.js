const { getDeviceValidPattern, getCompany, getAPI_Suhu1Titik, getCompanyTangki, getLastData, getJenisCompanyByDatentank, getDataHour_Await } = require('./functions/sub/main');
const { getApiSync, formatDate } = require('./functions/support');
const { encryptCode, URL_API_LIVE, URL_API_IOT_LIVE } = require('./functions/variable');
const { getData_SQL_Await } = require('./static/koneksi');

const tangki_1_json = require('./assets/data/volume_tangki/tangki_1.json');
const tangki_2_json = require('./assets/data/volume_tangki/tangki_2.json');
const tangki_3_json = require('./assets/data/volume_tangki/tangki_3.json');
const tangki_4_json = require('./assets/data/volume_tangki/tangki_4.json');
const tangki_5_json = require('./assets/data/volume_tangki/tangki_5.json');
const tangki_6_json = require('./assets/data/volume_tangki/tangki_6.json');
const tangki_7_json = require('./assets/data/volume_tangki/tangki_7.json');
const tangki_8_json = require('./assets/data/volume_tangki/tangki_8.json');
const tangki_9_json = require('./assets/data/volume_tangki/tangki_9.json');
const tangki_10_json = require('./assets/data/volume_tangki/tangki_10.json');
const tangki_11_json = require('./assets/data/volume_tangki/tangki_11.json');
const tangki_12_json = require('./assets/data/volume_tangki/tangki_12.json');
const tangki_13_json = require('./assets/data/volume_tangki/tangki_13.json');
const tangki_14_json = require('./assets/data/volume_tangki/tangki_14.json');
const tangki_15_json = require('./assets/data/volume_tangki/tangki_15.json');

const berat_jenis_cpo_json = require('./assets/data/volume_tangki/berat_jenis_cpo.json');
const berat_jenis_pko_json = require('./assets/data/volume_tangki/berat_jenis_pko.json');
const berat_jenis_cpo_task1_json = require('./assets/data/volume_tangki/berat_jenis_cpo_task1.json');
const berat_jenis_pko_task1_json = require('./assets/data/volume_tangki/berat_jenis_pko_task1.json');


const cliProgress = require('cli-progress');

// const generateDynamicFormat = (iteration, options) => {
// 	const dynamicLabel = `Dynamic Label: ${iteration}`;
// 	//  return `[{bar}] {percentage}% | ETA: {eta}s | ${iteration}/{total}`;
// 	 return `Progress [{bar}] {percentage}% | ETA: {eta}s | ${iteration}/{total} | Label: ${dynamicLabel}`;

// }

const progressBar = new cliProgress.SingleBar({
		format: `Progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`
}, cliProgress.Presets.shades_classic);

// GET ARGUMEN AS PARAMETER
// * Parameter di sini optional, jika tidak dimasukkan, maka akan diutamakan pakai api getLastData
// * --- getLastData => kondisi waktu paling terakhir per tangki dari database
// * --- getDataHour => kondisi waktu yang ditentukan range nya per tangki dari database
// execute : node scheduler.js --api=getLastData

let param_api = '';

const yargs = require('yargs');

const argvs = yargs
						.option('api', {
								alias:'a',
								describe:'API IoT ("getLastData" / "getDataHour")',
								demandOption: false,
								type:'string',
								coerce: (arg) => arg.toLowerCase(),
								choices: ['getlastdata','getdatahour']
						})
						.option('date', {
								alias:'d',
								describe:'Tanggal yang akan di Filter (Format : "yyyy-mm-dd")',
								demandOption: false,
								coerce: (arg) => {
										param_date_patt = new RegExp(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,'gi');
										let param_date_exec = param_date_patt.test(arg);
										if (!param_date_exec){
												throw new Error('* Masukkan Parameter Date sesuai format yaitu "yyyy-mm-dd"\n');
											}
											else{
												let validasiTanggal = new Date(arg);
												if (validasiTanggal == 'Invalid Date'){
														throw new Error('\n* Periksa kembali Tanggal \'' + arg + '\' tidak valid !\n');
												}
										}
										return arg;
								},
								type:'string'
						})
						.option('hourbegin', {
								alias:'h1',
								describe:'Hour Begin yang akan di Filter (Format : "hh:mm")',
								demandOption: false,
								coerce: (arg) => {
										param_hour1_patt = new RegExp(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/,'gi');
										let param_hour1_exec = param_hour1_patt.test(arg);
										if (!param_hour1_exec)
										{
												throw new Error('* Masukkan Parameter Hour Begin sesuai format yaitu "hh:mm" (max -> 23:59)\n');
										}
										return arg;
								}
						})
						.option('hourlast', {
								alias:'h2',
								describe:'Hour Last yang akan di Filter (Format : "hh:mm")',
								demandOption: false,
								coerce: (arg) => {
										param_hour2_patt = new RegExp(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/,'gi');
										let param_hour2_exec = param_hour2_patt.test(arg);
										if (!param_hour2_exec)
										{
												throw new Error('* Masukkan Parameter Hour Last sesuai format yaitu "hh:mm" (max -> 23:59)\n');
										}
										return arg;
								}
						})
						.option('replace', {
								alias:'r',
								type:'string',
								describe:'Replace data existing di database (true / false)',
								demandOption: false
						})
						.help()
						.argv;

param_api = argvs.api;
param_date = argvs.date;
param_hourbegin = argvs.hourbegin;
param_hourlast = argvs.hourlast;
param_replace = argvs.replace;

// * jika tidak masukkan parameter api, maka di set ke "getlastdata"
if (typeof param_api == 'undefined' || param_api == null || param_api == '')
{
		param_api = 'getlastdata';
}
else {

	// jika api nya adalah getDataHour, maka parameter date, hourbegin, dan hourlast wajib dimasukkan
		if (param_api == 'getdatahour'){
				if (typeof param_date == 'undefined' || param_date == '' || param_date == null){
						yargs.showHelp();
						console.error('\n* Parameter date harus di-Input !\n')
						return
						// throw new Error('* Parameter date, hourbegin dan hourlast harus di-input !\n');
				}
				else {
						let inputValidHour1 = true, inputValidHour2 = true;
						if (typeof param_hourbegin == 'undefined' || param_hourbegin == '' || param_hourbegin == null){
									inputValidHour1 = false;
						}
						if (typeof param_hourlast == 'undefined' || param_hourlast == '' || param_hourlast == null){
								inputValidHour2 = false;
								console.error('* Parameter "hourlast" harus di-Input !\n')
						}
							
						if (!inputValidHour1 || !inputValidHour2)
						{
								yargs.showHelp();
								console.error('\n');
								if (!inputValidHour1){
										console.error('* Parameter "hourbegin" harus di-Input !\n');
								}
								if (!inputValidHour2){
										console.error('* Parameter "hourlast" harus di-Input !\n')
								}

								return
						};

						let periode_begin = new Date(param_date + ' ' + param_hourbegin);
						let periode_last = new Date(param_date + ' ' + param_hourlast);
						if (periode_begin > periode_last){
								yargs.showHelp();
								console.error('\n* Periode "hourlast" harus lebih besar dari "hourbegin" !\n');
								return
						}
				}
		}

		if (typeof param_replace != 'undefined' && param_replace != null)
		{
				if (param_replace != 'true' && param_replace != 'false')
				{
					yargs.showHelp();
					console.error('\n* Parameter "Replace" harus bernilai "true / false"\n');
					return
				}

		}
}

console.log('\nParam API : ', param_api);
console.log('Param Date : ', param_date);
console.log('Param Hour Begin : ', param_hourbegin);
console.log('Param Hour Last : ', param_hourlast);
console.log('Param Replace Data : ', param_replace,'\n');

let paramArgument = {
	param_api,
	param_date,
	param_hourbegin,
	param_hourlast,
	param_replace
}
console.log(paramArgument);
// ... end Get Parameter

// return  

const _ = require('lodash');

// Cari Range Waktu 10 menit yang dipakai untuk cari tinggi modus
// jika waktu 07:19, maka range menit 0 - 9
// jika waktu 07:20, maka range menit 10 -19
this.range_waktu = [
	{start:0, end:9},
	{start:10, end:19},
	{start:20, end:29},
	{start:30, end:39},
	{start:40, end:49},
	{start:50, end:59}
];

this.mst_t_max = {}, this.mst_t_tangki = {}, this.mst_t_profile = {},
this.mst_avg_t_segitiga = {}, this.mst_t_kalibrasi = {}
, this.mst_1m_cpo_pko = {}   // master cpo / pko by suhu ketinggian 1 M  
, this.mst_jenis_by_api = {} // master jenis by api
, this.mst_jenis_by_api_perjam = {}  // kondisi awal hit dari realtime
, this.mst_suhu1titik = []   // master suhu 1 titik
, this.mst_1m_cpo_pko_filter = {};

this.arr_date_realtime = [];

// output from api ada 2 key yaitu 'status' dan 'hasil',
// status => 'success' or 'failed'
// hasil => hasil dari api

const handleToDatabase = async(p_obj_tinggi_tank_modus_filter_single, counterMajor, p_counterMinor, p_replace_data) => {
		let obj_modus = {...p_obj_tinggi_tank_modus_filter_single};

		let replace_data = false;
		if (typeof p_replace_data != 'undefined' && p_replace_data != '' && p_replace_data != null)
		{
				if (p_replace_data == "true"){
					replace_data = true
				}else{ replace_data = false}
		}else { replace_data = false}

		let sortedObject = Object.fromEntries(
														Object.keys(obj_modus)
														.sort((a,b)=>{
																const numA = parseInt(a.split('_')[1]);
																const numB = parseInt(b.split('_')[1]);
																return numA - numB;
														})
														.map(key => [key, obj_modus[key]])
													);

		// let counterAngka = 0;
		let counterMinor = p_counterMinor;
		// console.log(Object.keys(p_obj_tinggi_tank_modus_filter_single))
		for (const eleTankId of Object.keys(sortedObject))
		{
				// console.log("---- Tank", eleTankId, "----");
				// console.log(p_obj_tinggi_tank_modus_filter_single?.[eleTankId]);

				let qryCheckJarak = `SELECT * FROM Iot_Jarak where tangki_id = '` + eleTankId + `'` +
									` and logtime = '${obj_modus?.[eleTankId]?.['time']}'`;
				
				let qryInsertJarak = `INSERT INTO Iot_Jarak(tangki_id, logtime, jarak_sensor, tinggi_sounding, jarak_min, jarak_max, datapoin, logtime_min, logtime_max, berat, created_time)` +
									` VALUES('${eleTankId}', '${obj_modus?.[eleTankId]?.['time']}', ${obj_modus?.[eleTankId]?.['jarak_sensor_cm']}, ${obj_modus?.[eleTankId]?.['tinggi_minyak_cm']}` +
									`, ${obj_modus?.[eleTankId]?.['data_jarak_cm_10min_min']}, ${obj_modus?.[eleTankId]?.['data_jarak_cm_10min_max']}` +
									`, ${obj_modus?.[eleTankId]?.['datapoin']}, '${obj_modus?.[eleTankId]?.['data_jarak_cm_10min_min_log']}', '${obj_modus?.[eleTankId]?.['data_jarak_cm_10min_max_log']}'` +
									`, ${obj_modus?.[eleTankId]?.['volume']}, '${obj_modus?.[eleTankId]?.['created_time']}'` +	
								`)`;

					let qryUpdateJarak = `UPDATE Iot_Jarak` + 
							` SET logtime='${obj_modus?.[eleTankId]?.['time']}'` +
							`, jarak_sensor=${obj_modus?.[eleTankId]?.['jarak_sensor_cm']}` + 
							`, tinggi_sounding=${obj_modus?.[eleTankId]?.['tinggi_minyak_cm']}` + 
							`, jarak_min=${obj_modus?.[eleTankId]?.['data_jarak_cm_10min_min']}` + 
							`, jarak_max=${obj_modus?.[eleTankId]?.['data_jarak_cm_10min_max']}` + 
							`, datapoin=${obj_modus?.[eleTankId]?.['datapoin']}` + 
							`, logtime_min='${obj_modus?.[eleTankId]?.['data_jarak_cm_10min_min_log']}'` + 
							`, logtime_max='${obj_modus?.[eleTankId]?.['data_jarak_cm_10min_max_log']}'` + 
							`, berat=${obj_modus?.[eleTankId]?.['volume']}` + 
							`, created_time='${obj_modus?.[eleTankId]?.['created_time']}'` +
							` WHERE tangki_id='${eleTankId}' and logtime='${obj_modus?.[eleTankId]?.['time']}'`;
					
				
								
				let qryCheckSuhu = `SELECT * FROM Iot_Suhu where tangki_id = '` + eleTankId + `'` +
								` and suhutime = '${obj_modus?.[eleTankId]?.['time']}'`;

				let qryInsertSuhu = `INSERT INTO Iot_Suhu(tangki_id, logtime, suhu, suhutime, suhu_count, suhu_min, suhu_max, created_time)` +
									` VALUES('${eleTankId}', '${obj_modus?.[eleTankId]?.['logtime_suhu']}', ${obj_modus?.[eleTankId]?.['data_suhu_slice_sum_avg']}, '${obj_modus?.[eleTankId]?.['time']}'` +
									`, ${obj_modus?.[eleTankId]?.['suhu_count']}, ${obj_modus?.[eleTankId]?.['data_suhu_slice_min']}` +
									`, ${obj_modus?.[eleTankId]?.['data_suhu_slice_max']}, '${obj_modus?.[eleTankId]?.['created_time']}'` +	
								`)`;

				let qryUpdateSuhu = `UPDATE Iot_Suhu` + 
								` SET logtime='${obj_modus?.[eleTankId]?.['logtime_suhu']}'` +
								`, suhu=${obj_modus?.[eleTankId]?.['data_suhu_slice_sum_avg']}` + 
								`, suhutime='${obj_modus?.[eleTankId]?.['time']}'` + 
								`, suhu_count=${obj_modus?.[eleTankId]?.['suhu_count']}` + 
								`, suhu_min=${obj_modus?.[eleTankId]?.['data_suhu_slice_min']}` + 
								`, suhu_max=${obj_modus?.[eleTankId]?.['data_suhu_slice_max']}` + 
								`, created_time='${obj_modus?.[eleTankId]?.['created_time']}'` +
								` WHERE tangki_id='${eleTankId}' and suhutime='${obj_modus?.[eleTankId]?.['time']}'`;

				// console.log('---- query insert ----')
				// console.log(qryInsertJarak)

				// console.log(qryCheckSuhu)
				// console.log(qryInsertSuhu)
				
				// INSERT ke tabel jarak
				await getData_SQL_Await(qryCheckJarak)
					.then(async (result)=>{
							if (Array.isArray(result))
							{
								// jika data tidak ada di tabel, maka akan di insert ke Iot_Jarak
								// jika sudah ada akan di bypass

									if (result.length == 0)
									{
										await getData_SQL_Await(qryInsertJarak)
												.then(async (resultInsertJarak)=>{

														// console.log("Insert to Table Iot_Jarak_Temp Completed !")

														// Cek apa sudah insert ke tabel Suhu
														await getData_SQL_Await(qryCheckSuhu)
																.then(async (resultCheckSuhu)=>{

																		if (Array.isArray(resultCheckSuhu))
																		{

																				// jika data tidak ada di tabel, maka akan di insert ke Iot_Suhu
																				if (resultCheckSuhu.length == 0)
																				{
																						await getData_SQL_Await(qryInsertSuhu)
																									.then((resultInsertSuhu)=>{
				
																										// console.log(" --> Insert to Table Iot_Suhu_Temp Completed !")
																									})
																									.catch((errInsertSuhu)=>{
																											console.log("\n---- Error Insert to ",eleTankId, " ----");
																											console.log(errInsertSuhu);
																									})
																				}
																				else{
																						if (replace_data){
																							await getData_SQL_Await(qryUpdateSuhu)
																								.then((resultUpdateSuhu)=>{
			
																									// console.log(" --> Insert to Table Iot_Suhu_Temp Completed !")
																								})
																								.catch((errUpdateSuhu)=>{
																										console.log("\n---- Error Update Suhu to ",eleTankId, " ----");
																										console.log(errUpdateSuhu);
																								})
																						}
																				}
																		}

																})
												})
												.catch((errInsertJarak)=>{
														console.log("\n---- Error Insert to ",eleTankId, " ----");
														console.log(errInsertJarak);
												});
										// console.log(result);
									}
									else{
										if (replace_data){
											await getData_SQL_Await(qryUpdateJarak)
												.then(async (resultUpdateJarak)=>{

														await getData_SQL_Await(qryUpdateSuhu)
															.then((resultUpdateSuhu)=>{

															// console.log(" --> Insert to Table Iot_Suhu_Temp Completed !")
														})
														.catch((errUpdateSuhu)=>{
																console.log("\n---- Error Update Suhu to ",eleTankId, " ----");
																console.log(errUpdateSuhu);
														})

													// console.log(" --> Insert to Table Iot_Suhu_Temp Completed !")
												})
												.catch((errUpdateJarak)=>{
														console.log("\n---- Error Update Jarak to ",eleTankId, " ----");
														console.log(errUpdateJarak);
												})
										}
									}

							}

							// Step 8
							progressBar.update(
									// Math.min((Math.round((14.285 * (6.9 + (counterAngka * 0.01)) * 100)) / 100), 100)
									Math.min((Math.round((14.285 * (counterMajor + counterMinor) * 10000)) / 10000), 100)
							)
					});
					counterMinor += 0.0001;
				// counterAngka++;
		}

		// console.log(hasil)
		// console.log(obj_modus);
}

const getLastDate_obj_tank = (obj_tank_var) => {
	let obj_tank_temp = JSON.parse(JSON.stringify(obj_tank_var));
	let arr_tank_date = {};
	let obj_tank_maxdate = {};
	let obj_tank_temp_final = {};

	if (typeof obj_tank_temp == 'object')
	{

		if (Object.keys(obj_tank_temp).length > 0){

			Object.keys(obj_tank_temp).forEach((ele_tank_name,idx_tank)=>{

					for (let [i, v] of obj_tank_temp[ele_tank_name].entries())
					{
							let time = v?.['time'];
							let time_conv_date, time_conv_date_final;

							if (time != null)
							{
									time_conv_date = new Date(time);
									time_conv_date_final = formatDate(time_conv_date, 'YYYY-MM-DD 00:00:00')
							}

							obj_tank_temp[ele_tank_name][i] = {
									...obj_tank_temp[ele_tank_name][i],
									date: time_conv_date_final,
									date_getTime: new Date(time_conv_date_final).getTime()
							}

							// push ke 'arr_tank_date', 
							// tangki_1 : [1679590800000, 1679590800000, 1679590800000, ...]
							if (typeof arr_tank_date?.[ele_tank_name] != 'undefined')
							{
									arr_tank_date[ele_tank_name] = 
											[
												...arr_tank_date[ele_tank_name],
												new Date(time_conv_date_final).getTime()
											]
							}
							else{
									arr_tank_date[ele_tank_name] = [
											new Date(time_conv_date_final).getTime()
									]
							}
							// ... end      
					}

			})

			// looping arr_tank_date
			Object.keys(arr_tank_date).forEach((ele_tank_name, idx_tank_name)=>{
					
					let max_date = Math.max.apply(null, arr_tank_date?.[ele_tank_name]);
					obj_tank_maxdate = {
							...obj_tank_maxdate,
							[ele_tank_name]: max_date
					}

			})

			// tampung data yang paling maksimal di satu variabel

			Object.keys(obj_tank_temp).forEach((ele_tank_name2, idx_tank_name)=>{
					let filter_temp = _.filter(obj_tank_temp?.[ele_tank_name2], {'date_getTime':obj_tank_maxdate?.[ele_tank_name2]})

					obj_tank_temp_final = {
							...obj_tank_temp_final,
							[ele_tank_name2]: filter_temp
					}
			})

			// ... end looping arr_tank_date
			
			// console.error("ARR TANK !!!")
			// console.error(obj_tank_temp)

		}
	}

	return obj_tank_temp_final
}

const json_arr_berat_jenis_tangki = (jenis, tangki) =>
{
		let arr_temp = [];
	
		switch (tangki.toLowerCase()){
				case 'tangki_5': case 'tangki_6': case 'tangki_7':
						switch (jenis.toLowerCase()){
							case 'cpo':
									arr_temp = JSON.parse(JSON.stringify(berat_jenis_cpo_task1_json));
									break;
							case 'pko':
									arr_temp = JSON.parse(JSON.stringify(berat_jenis_pko_task1_json));
									break;
						}
						break;
				default:
						switch (jenis.toLowerCase()){
							case 'cpo':
									arr_temp = JSON.parse(JSON.stringify(berat_jenis_cpo_json));
									break;
							case 'pko':
									arr_temp = JSON.parse(JSON.stringify(berat_jenis_pko_json));
									break;
						}

		}

		return arr_temp;
}

const json_arr_volume_tangki = (tangki_name) => {
	let arr_temp = [];

	switch (tangki_name){
		case 'tangki_1':
				arr_temp = JSON.parse(JSON.stringify(tangki_1_json));
				break;
		case 'tangki_2':
				arr_temp = JSON.parse(JSON.stringify(tangki_2_json));
				break;
		case 'tangki_3':
				arr_temp = JSON.parse(JSON.stringify(tangki_3_json));
				break;
		case 'tangki_4':
				arr_temp = JSON.parse(JSON.stringify(tangki_4_json));
				break;
		case 'tangki_5':
				arr_temp = JSON.parse(JSON.stringify(tangki_5_json));
				break;
		case 'tangki_6':
				arr_temp = JSON.parse(JSON.stringify(tangki_6_json));
				break;
		case 'tangki_7':
				arr_temp = JSON.parse(JSON.stringify(tangki_7_json));
				break;
		case 'tangki_8':
				arr_temp = JSON.parse(JSON.stringify(tangki_8_json));
				break;
		case 'tangki_9':
				arr_temp = JSON.parse(JSON.stringify(tangki_9_json));
				break;
		case 'tangki_10':
				arr_temp = JSON.parse(JSON.stringify(tangki_10_json));
				break;
		case 'tangki_11':
				arr_temp = JSON.parse(JSON.stringify(tangki_11_json));
				break;
		case 'tangki_12':
				arr_temp = JSON.parse(JSON.stringify(tangki_12_json));
				break;
		case 'tangki_13':
				arr_temp = JSON.parse(JSON.stringify(tangki_13_json));
				break;
		case 'tangki_14':
				arr_temp = JSON.parse(JSON.stringify(tangki_14_json));
				break;
		case 'tangki_15':
				arr_temp = JSON.parse(JSON.stringify(tangki_15_json));
				break;

	}

	return arr_temp;
} 


const faktor_koreksi = (volume, suhu) =>{
	if (volume == null || suhu == null ||
			typeof volume == 'undefined' ||
			typeof suhu == 'undefined'){
			return null
	}


	if (typeof volume == 'number' && 
			typeof suhu == 'number'){

			let lambda = 0.0000348;
			let hitung_koreksi;
			hitung_koreksi = 1 + (lambda * (suhu - 36));

			return hitung_koreksi;
	}

	return null
}

const update_to_arr_json_tangki_last = (data_arr, ele, tangki_name, tangki_api, arr_json_tangki_last) => {
		// data_arr => {'Temperature Tank 5 TASK1 tinggi 0.2 M': '51.92', 'Jarak Sensor dengan permukaan Tank 5': 644.1}
		let findTank = Object.keys(data_arr).findIndex((res)=>{
					let patt = new RegExp(/[tT]ank [0-9]+/,'gi');
					let match = patt.exec(res);

					// return res.toLowerCase().indexOf(tangki_api) != -1		// ada kekurangan kalau tank 1, maka terambil tank 10,11,12,13,14,15,dst...
					if (typeof match?.[0] != 'undefined' && match?.[0] != null && match?.[0] != '')
					{
								return match?.[0].toLowerCase() == tangki_api.toLowerCase()
					}
		});

		if (findTank != -1)
		{
				// let findIdx = Object.keys(arr_json_tangki_last).findIndex(res=>res == tangki_name);
				// if (findIdx == -1){

						let sub_obj_keys = Object.keys(data_arr);
						sub_obj_keys.forEach((ele_for)=>{
								if (ele_for.toLowerCase().indexOf(tangki_api) != -1){
										// console.log(data_arr?.[ele_for])
										// contoh tangki_name => 'tangki_4'
										this.arr_json_tangki_last[tangki_name] = {
												...this.arr_json_tangki_last[tangki_name],
												[ele_for]: data_arr?.[ele_for]
										}
								}
						});

						this.arr_json_tangki_last[tangki_name]['time'] = ele?.['time'];
						this.arr_json_tangki_last[tangki_name]['id_device'] = ele?.['id_device'];
						this.arr_json_tangki_last[tangki_name]['rawData'] = ele?.['rawData'];
				// }
		}
}

// const get_jenis_by_api_lastdata = async (arr_json_tangki_last, callback) => {
const get_jenis_by_api_lastdata = async (arr_json_tangki_last) => {
		let arr_json_tangki_last_length = Object.keys(arr_json_tangki_last).length;
		let obj_keys_last_onprogress_1m = 0;
		
		let breakException = {};
    let all_done = false

		let arr_temp_jenis = {};  // isi dengan 'tangki_1':'PKO', 'tangki_2':'PKO'

		try {
				// Object.keys(arr_json_tangki_last).forEach(async (tank_name,idx)=>{
				for (const tank_name of Object.keys(arr_json_tangki_last))
				{
						let datebegin = formatDate(new Date(arr_json_tangki_last?.[tank_name]?.['time']),'YYYY-MM-DD');
						let tangki_id = tank_name;

						// get data api jenis company by date n tank
						// await getJenisCompanyByDatentank(datebegin, tangki_id).then((res)=>{
						const res = await getJenisCompanyByDatentank(datebegin, tangki_id);

								let hasil_status = res?.['status'];
								if (typeof (hasil_status) != 'undefined' && hasil_status  != null && 
										hasil_status.toString().toLowerCase() == 'success')
								{
										let arr_data = res?.['hasil']?.['data'];
										
										if (typeof arr_data != 'undefined' && arr_data != null)
										{
												if (arr_data.length > 0)
												{
														// ** Looping arr_data
														
														for (let obj_data of arr_data)
														{
																let time_obj_api = formatDate(new Date(obj_data?.['tanggal']),'YYYY-MM-DD');
																let tangki_id = obj_data?.['tangki_id'];
                                let jenis = obj_data?.['jenis'];

																if (time_obj_api == datebegin && tank_name == tangki_id)
																{
																		let temp_jenis = arr_temp_jenis?.[tank_name];
																		if (typeof temp_jenis == 'undefined' || temp_jenis == null)
																		{
																				arr_temp_jenis = {
																						...arr_temp_jenis,
																						[tank_name]: jenis
																				}
																		}
																}

														}
														// ** end looping
												}
										}
								}

								obj_keys_last_onprogress_1m++;
						// })
				}
				// console.log("\n (--> 1st) arr_json_tangki_last_length")
				// console.log(arr_json_tangki_last_length)
				// console.log("(--> 2nd) obj_keys_last_onprogress_1m")
				// console.log(obj_keys_last_onprogress_1m)

				let temp_mst_jenis_by_api = {};

				if (Object.keys(arr_temp_jenis).length > 0)
				{
						temp_mst_jenis_by_api = {...arr_temp_jenis};
						this.mst_jenis_by_api = {...arr_temp_jenis};
				}
				else{
						temp_mst_jenis_by_api = {}
						this.mst_jenis_by_api = {}
				}

				return temp_mst_jenis_by_api;
				
				// })
		}catch(e){

				if (e != breakException){
					throw e
				}
    }

		// TUNGGU HINGGA SELESAI
		
// 		let intLast = setInterval(async ()=>{
// 				if (arr_json_tangki_last_length == obj_keys_last_onprogress_1m){

// 						let temp_mst_jenis_by_api = {};

// 						if (Object.keys(arr_temp_jenis).length > 0)
// 						{
// 								temp_mst_jenis_by_api = {...arr_temp_jenis};
// 								this.mst_jenis_by_api = {...arr_temp_jenis};
// 						}
// 						else{
// 								temp_mst_jenis_by_api = {}
// 								this.mst_jenis_by_api = {}  
// 						}
						
// 						clearInterval(intLast)
// 						// return temp_mst_jenis_by_api;
// 						callback(temp_mst_jenis_by_api);
// 				}
// 		})
}

const processPreviousMinTank_fromLast = async (arr_json_tangki_last, counterMajor, p_counterMinor) => {
		// console.log("\nprocessPreviousMinTank_fromLast\n");
		// console.log(arr_json_tangki_last);
		
		// console.log('-------------(4.1) masuk 4.1\n')

		this.arr_tangki_last_from_dataHour = {};

		// variable menampung data semua array based on looping nama tangki (ada 4), ada kemungkinan double
		let arr_raw_all = [];

		// LOOPING NAMA TANGKI (KEY PERTAMA)
		let obj_keys_last = Object.keys(arr_json_tangki_last);	// ['tangki_12','tangki_13','tangki_1',dst..]

		// panjang tangki obj_keys_last
		let obj_keys_last_length = obj_keys_last.length;
		let obj_keys_last_onprogress = 0;
		
		let counterAngka = 0;
		let counterMinor = p_counterMinor;

		// ** Step 8
		// progressBar.update(14.285 * (counterMajor + counterAngka));

		// obj_keys_last.forEach(async (ele_name, idx_rec)=>{
		for (const ele_name of obj_keys_last)
		{
				let time_tank = '';
				try{
						time_tank = new Date(arr_json_tangki_last[ele_name]?.['time']);
				}catch(e){
						time_tank = null;			
				}

				if (time_tank != null)
				{
						let get_timetank_minus10 = time_tank.getTime() - (10 * 60 * 1000);  // waktu tangki last data dikurangi 10 menit
						let get_timetank_minus10_Minute = new Date(get_timetank_minus10).getMinutes(); // ambil Menit

						let range_waktu_min, range_waktu_max;
						
						// Cari range waktu start dan end untuk menit yang dikurangi 10
						let find_range_waktu = this.range_waktu.find(x => x.start <= get_timetank_minus10_Minute && x.end >= get_timetank_minus10_Minute);
						if (find_range_waktu)
						{
								let time_tank_range = new Date(get_timetank_minus10);  // new Date copy independen agar tidak sinkron dengan time_tank

								range_waktu_min = new Date(new Date(time_tank_range.setMinutes(find_range_waktu?.['start'])).setSeconds(0));
                range_waktu_max = new Date(new Date(time_tank_range.setMinutes(find_range_waktu?.['end'])).setSeconds(59));
						}

						let time_tank_time_begin, time_tank_time_last;  // tanggal yg di filter sudah fix begin dan last
						time_tank_time_begin = range_waktu_min;
						time_tank_time_last = range_waktu_max;

						let datebegin = formatDate(time_tank_time_begin,'YYYY-MM-DD');

						let hourbegin = !isNaN(time_tank_time_begin) ? formatDate(time_tank_time_begin,'HH:mm') : '';
            let hourlast = !isNaN(time_tank_time_last) ? formatDate(time_tank_time_last,'HH:mm') : '';
					
						// console.log("time_tank : ", time_tank.toString());

						// console.log("Range Waktu Min : ", range_waktu_min.toString());
						// console.log("Range Waktu Max : ", range_waktu_max.toString());
						// console.log("Hour Begin : ", hourbegin.toString());
						// console.log("Hour Last : ", hourlast.toString());

						
						this.arr_date_realtime = [
								...this.arr_date_realtime,
								{
										time_tank,
										time_tank_getTime: !isNaN(time_tank) ? time_tank.getTime() : 0,
										datebegin: time_tank_time_begin,
										datelast: time_tank_time_last,
										hourbegin,
										hourlast
								}
						]

						// masukkan datebegin, datelast, hourbegin, hourlast ke arr_json_tangki_last
						this.arr_json_tangki_last[ele_name] = {
								...this.arr_json_tangki_last[ele_name],
								datebegin: time_tank_time_begin,
								datelast: time_tank_time_last,
								hourbegin,
								hourlast
						}

						// console.log(this.arr_json_tangki_last)

						let idDevice = null;

						let find_idDevice_Tangki = this.mst_list_tangki.find(v => v.name == ele_name);
						if (find_idDevice_Tangki){
								idDevice = find_idDevice_Tangki?.['id_device']
						}

						

						// await getDataHour_Await(datebegin, hourbegin, hourlast, [idDevice]).then(resDataHour => {
						const resDataHour = await getDataHour_Await(datebegin, hourbegin, hourlast, [idDevice])
									
									let hasil_status = resDataHour?.['status'];
									if (typeof (hasil_status) != 'undefined' && hasil_status  != null && 
											hasil_status.toString().toLowerCase() == 'success')
									{
											
											let arr_data = resDataHour?.['hasil']?.['data'];
											if (typeof arr_data != 'undefined' && arr_data != null)
											{
													if (arr_data.length > 0)
													{
															arr_raw_all = [
																	...arr_raw_all,
																	...arr_data
															]
													}
											}											
									}

									// ** Step 8 Sub
									progressBar.update(
											// Math.min(Math.round((14.285 * (6.7 + (counterAngka * 0.01)) * 1000)) / 1000, 100)
											Math.min(Math.round((14.285 * (counterMajor + (counterAngka)) * 10000)) / 10000, 100)
									)

									counterAngka++;
									counterMinor += 0.0001;
						// });

				}
		}
		// });

		// console.log("\nCounter Angka : ", counterAngka)
		// console.log("\nObject Keys Last: ", obj_keys_last.length)

		// console.log('-------------(4.2) masuk 4.2\n')

		// const intervalDataHour = setInterval(()=>{
				if (counterAngka == obj_keys_last.length)
				{
				
					// console.log("Counter : ", counterAngka);
					// console.log("Total Data Hour : ", arr_raw_all.length);

					// Hilangkan Duplicate Value berdasarkan id_device dan time
					let arr_raw_reduce = _.uniqBy(arr_raw_all, obj => `${obj.id_device}-${obj.time}`);
					// console.log("Jumlah Reduce (device - time) : ",arr_raw_reduce.length);
					
					// *** REALTIME (kondisi jika tidak ada data 10 menit terakhir, maka pakai last data) ***
					// jika sekumpulan data realtime (10 menit terakhir) kosong,
					//    maka pakai yang last data tangki (tanpa bandingkan terbesar karena cuma satu data)

					if (Array.isArray(arr_raw_reduce))
					{
						if (arr_raw_reduce.length == 0)
						{

							Object.keys(this.arr_json_tangki_last).forEach((ele_name,idx_name)=>{

								let temp_obj = {};
								temp_obj = {
									...temp_obj,
									data: [
										{...this.arr_json_tangki_last?.[ele_name]}
									],
									id_device: this.arr_json_tangki_last?.[ele_name]?.['id_device'],
									rawData: this.arr_json_tangki_last?.[ele_name]?.['rawData'],
									time: this.arr_json_tangki_last?.[ele_name]?.['time']
								}
								arr_raw_reduce = [
									...arr_raw_reduce,
									{...temp_obj}
								]
							});
						}
						else 
						{
							let arr_json_tangki_last_tankname = Object.keys(this.arr_json_tangki_last);
							if (arr_json_tangki_last_tankname.length > 0)
							{
								let arr_temp_device = [];
								let obj_temp_device = [];
								// grouping id device dari last data
								
								// 	// e.g. {tangki_12: 'WSSLTANK12', tangki_11: 'WSSLTANK11', dst...}
								obj_temp_device = _.mapValues(this.arr_json_tangki_last, (tangki)=>tangki?.['id_device']);

								// e.g. ['WSSLTANK12', 'WSSLTANK11', 'TANK12_HP_PAMALIAN', 'TANK34_HP_PAMALIAN']
								arr_temp_device = Object.values(obj_temp_device);

								// console.log("---- Arr Temp Device ----");
								// console.log(arr_temp_device);
								// ... end grouping id device
								
								// cari apakah device yang diloop sudah ada dalam arr_raw_reduce,
								// jika belum ada, maka di masukkan semua id_device (last data) ke arr_raw_reduce dari obj_json_tangki_last
								arr_temp_device.forEach((ele_device, idx_device)=>{

									let find_dev_inraw = arr_raw_reduce.find(ele=>ele?.['id_device'] == ele_device);
									if (!find_dev_inraw){
										// looping data last untuk masukkan data sesuai id_device
										// ** Looping arr_json_tangki_last
										Object.keys(this.arr_json_tangki_last).forEach((ele_tank,idx_tank)=>{

												let tank_data = this.arr_json_tangki_last?.[ele_tank];
												if (tank_data?.['id_device'] == ele_device){

														let temp_obj = {};
														temp_obj = {
															...temp_obj,
															data: [
																{...this.arr_json_tangki_last?.[ele_tank]}
															],
															id_device: this.arr_json_tangki_last?.[ele_tank]?.['id_device'],
															rawData: this.arr_json_tangki_last?.[ele_tank]?.['rawData'],
															time: this.arr_json_tangki_last?.[ele_tank]?.['time']
														}
														arr_raw_reduce = [
															...arr_raw_reduce,
															{...temp_obj}
														]
												}

										});
										// ** ... end Looping arr_json_tangki_last
									}
								});
							}
						}
					}

					// kosongkan data master 1m cpo / pko
					
					let arr_kosongkan_data_mst_1m_cpopko = Object.keys(this.mst_1m_cpo_pko).map((tangki, idx)=>{return {[tangki]: ''}});

					let kosongkan_data_mst_1m_cpopko = {}
					kosongkan_data_mst_1m_cpopko = _.merge({}, ...arr_kosongkan_data_mst_1m_cpopko);

					this.mst_1m_cpo_pko = {...kosongkan_data_mst_1m_cpopko};
					
					// funcSeparateTank(arr_raw_reduce, async (obj_tinggi_tank_modus_filter_single)=>{
					const obj_tinggi_tank_modus_filter_single = funcSeparateTank(arr_raw_reduce);
					
						// INSERT DATA TO DATABASE
						// console.log(obj_tinggi_tank_modus_filter_single);

						await handleToDatabase(obj_tinggi_tank_modus_filter_single, counterMajor, counterMinor, param_replace);
						
						return obj_tinggi_tank_modus_filter_single;

				// })


					// clearInterval(intervalDataHour);
				}
		// });

		// progressBar.update(100);
		// progressBar.stop()

}

const funcSeparateTank = (arr_raw_alls, callback) => {
		// console.log("---------- funcSeparateTank -----------")
		let obj_tank = {};

		// menghitung total cpo / pko
		let obj_tank_total = {
				"PKO":0,
				"CPO":0
		}
		let obj_tank_max_total = {
				"PKO":0,
				"CPO":0
		}
		let obj_tank_total_percent = {
				"PKO":0,
				"CPO":0
		}

		for (let [i,v] of arr_raw_alls.entries())
		{
				let data_arr = v?.['data']?.[0];
				let time = v?.['time'] ?? '';
				let time_getTime = v?.['time'] != null ? new Date(v?.['time']).getTime() : 0;
				let id_device = v?.['id_device'] ?? '';
				let rawData = v?.['rawData'];

				// ambil dan simpan masing-masing tangki
				// looping dalam object data_arr

				let obj_store_temp = {};
				let obj_store_suhu_temp = {};


				// Object.keys(data_arr).forEach((ele_attr)=>{
				for (const ele_attr of Object.keys(data_arr))
				{
						let patt_tank = new RegExp(/(Tank [0-9]+)/,'gi');
						let patt_tank_exec = patt_tank.exec(ele_attr);

						if (patt_tank_exec != null)
						{

								let data_tank = patt_tank_exec[0];

								let find_mst_list = this.mst_list_tangki.find(ele_list=>ele_list.api.toLowerCase() == data_tank.toLowerCase());
								if (find_mst_list){
										// nama tangki harus ada dalam list master, baru dapat disimpan
										let nama_tangki = find_mst_list?.['name'] ?? '';
										let title_tangki = find_mst_list?.['title'] ?? '';

										// ** HITUNG TINGGI CPO / PKO **
										let patt_tinggi = new RegExp(/(Jarak Sensor dengan permukaan Tank [0-9]+)/,'gi')
                    let patt_tinggi_exec = patt_tinggi.exec(ele_attr);

										let tangki_jarak_sensor;
										let tangki_jarak_sensor_cm;	// untuk satuan cm
                    let tinggi_hitung;   // tinggi cpo / pko

										if (patt_tinggi_exec != null){

												let data_jarak_sensor = patt_tinggi_exec['input'];

												tangki_jarak_sensor =  data_arr?.[data_jarak_sensor];
												tangki_jarak_sensor_temp_cm =  data_arr?.[data_jarak_sensor];

												if (typeof tangki_jarak_sensor != 'undefined' && tangki_jarak_sensor != null){
														if (typeof tangki_jarak_sensor == 'string'){
															tangki_jarak_sensor = (parseFloat(tangki_jarak_sensor) / 100);	// satuan meter
															tangki_jarak_sensor_cm = Math.round(parseFloat(tangki_jarak_sensor_temp_cm * 100)) / 100
														}else{
															tangki_jarak_sensor = (tangki_jarak_sensor / 100);
															tangki_jarak_sensor_cm = Math.round(tangki_jarak_sensor_temp_cm * 100) / 100
														}
												}else{tangki_jarak_sensor = 0; tangki_jarak_sensor_cm = 0;}

												// === CARI TINGGI MINYAK MENGGUNAKAN TINGGI PROFILE ===
												tinggi_hitung = 0;
												if (typeof this.mst_t_profile?.[nama_tangki] != 'undefined' &&
															this.mst_t_profile?.[nama_tangki] != null)
												{
														tinggi_hitung = Math.round((this.mst_t_profile?.[nama_tangki] - tangki_jarak_sensor) * 1000) / 1000;
												}
												// ... end <TINGGI PROFILE>

												if (tinggi_hitung < 0){
													tinggi_hitung = 0;
												}
												
										}
										
										// ... ** end TINGGI CPO / PKO

										// ** SET SUHU TINGGI **
										let patt_tank_tinggi_num_exec_final;
										let data_temperature;

										let patt_suhu = new RegExp(/(Temperature Tank [0-9]+)/,'gi')
										let patt_suhu_exec = patt_suhu.exec(ele_attr);

										if (patt_suhu_exec != null){
												data_temperature = patt_suhu_exec['input'];
												let patt_tank_number = new RegExp(/(tinggi [0-9]+(\.?[0-9]+)?.?M)/,'gi')    // bisa jadi ada koma misal 0.2 M
                        let patt_tank_number_exec = patt_tank_number.exec(ele_attr) ?? -1

												patt_tank_tinggi_num_exec_final = patt_tank_number_exec != null 
                                          ? parseFloat(patt_tank_number_exec[0].replace(/(tinggi|M)/gi,'').trim())
                                          : null

												// SET SUHU SEMENTARA DI obj_store_suhu_temp per SATU DATA ARR object
												if (typeof obj_store_suhu_temp?.[nama_tangki] == 'undefined' ||
														obj_store_suhu_temp?.[nama_tangki] == null)
												{
														obj_store_suhu_temp[nama_tangki] = 
														{
																data_suhu: [data_arr?.[data_temperature]],
																data_suhu_tank_num: [patt_tank_tinggi_num_exec_final]
														}
												}
												else{
														obj_store_suhu_temp[nama_tangki] = 
														{
															...obj_store_suhu_temp[nama_tangki],
															data_suhu: [...obj_store_suhu_temp[nama_tangki]['data_suhu'], 
																						data_arr?.[data_temperature]
																				],
															data_suhu_tank_num: [...obj_store_suhu_temp[nama_tangki]['data_suhu_tank_num'], 
																											patt_tank_tinggi_num_exec_final
																									],
														}
												}
										}
										// ... ** end SET SUHU TINGGI **

										if (typeof obj_store_temp?.[nama_tangki] == 'undefined' ||
                            obj_store_temp?.[nama_tangki] == null)
										{
												// jika tidak ada key tangki nya
												obj_store_temp[nama_tangki] = 
													{
														[ele_attr]: data_arr[ele_attr],
														jarak_sensor_m: tangki_jarak_sensor,
														jarak_sensor_cm: tangki_jarak_sensor_cm,
														data_suhu: obj_store_suhu_temp[nama_tangki]['data_suhu'],
														data_suhu_tank_num: obj_store_suhu_temp[nama_tangki]['data_suhu_tank_num'],
														time,
														time_getTime,
														id_device,
														rawData
													}

													// ** HITUNG TINGGI CPO / PKO
													if (typeof tangki_jarak_sensor != 'undefined'){
															obj_store_temp[nama_tangki]['tinggi_minyak'] = tinggi_hitung;
													}
													// ... end ** HITUNG TINGGI CPO / PKO
										}
										else {
													// jika ada key tangki nya
													obj_store_temp[nama_tangki] = 
													{
															...obj_store_temp[nama_tangki],
															[ele_attr]: data_arr[ele_attr],
															jarak_sensor_m: tangki_jarak_sensor,
															jarak_sensor_cm: tangki_jarak_sensor_cm,
															data_suhu: obj_store_suhu_temp[nama_tangki]['data_suhu'],
															data_suhu_tank_num: obj_store_suhu_temp[nama_tangki]['data_suhu_tank_num'],
															time,
															time_getTime,
															id_device,
															rawData
													}

													// ** HITUNG TINGGI CPO / PKO
                          if (typeof tangki_jarak_sensor != 'undefined'){
															obj_store_temp[nama_tangki]['tinggi_minyak'] = tinggi_hitung;
															obj_store_temp[nama_tangki]['tinggi_minyak_cm'] = Math.round((parseFloat(tinggi_hitung) * 100 * 100)) / 100;
													}
													// ... end ** HITUNG TINGGI CPO / PKO
										}
								}
						}
				// });
				}

				// ... end looping dalam object data_arr key

				// simpan hasil kumpulan key ke obj_tank (final)
				// Object.keys(obj_store_temp).forEach((ele_nama_tangki, idx_store)=>{
				for (const ele_nama_tangki of Object.keys(obj_store_temp))
				{
						let arr_tinggi_suhu_tmp = [];
          	let arr_tinggi_suhu_val_tmp = [];

						let volume_tbl = 0;
						let volume_prev;
						let beda_liter_hitung_StoreToObj;
						let volume_tbl_plus_beda_liter;
						let faktor_koreksi_temp;
						let find_berat_jenis;

						let arr_obj_tmp_tank_data = obj_store_suhu_temp[ele_nama_tangki]['data_suhu'];

						// REVISI KETINGGIAN SUHU yang KE CELUP  20 feb '23
						let obj_tmp_tank_tinggi_minyak = parseFloat(obj_store_temp[ele_nama_tangki]['tinggi_minyak']);

						// (PAKAI SUHU SATU TITIK) REVISI TANGGAL 29 MARET 2023
						let suhu_1titik_level_minyak = parseFloat(obj_store_temp?.[ele_nama_tangki]?.['tinggi_minyak']);
						let arr_suhu_1titik_suhu_tank_num = obj_store_temp?.[ele_nama_tangki]?.['data_suhu'];    // ['40.63', '38.91', '37.91', '28.59', '27.97']
						let arr_suhu_1titik_suhu_tank_num_raw = obj_store_temp?.[ele_nama_tangki]?.['data_suhu_tank_num']; // [1, 3, 5, 7, 10]
						let suhu_1titik_getTinggiSuhu;
						let suhu_1titik_getTinggiSuhu_Val;

						// CARI SUHU 1 TITIK DARI DATABASE dalam array "mst_suhu1titik"
						let findSuhu1Titik = this.mst_suhu1titik.find((ele_suhu1titik,idx_suhu1titik)=>{
								if (ele_suhu1titik?.['tangki_id'] == ele_nama_tangki &&
										ele_suhu1titik?.['level_isi_start'] <= suhu_1titik_level_minyak &&
										ele_suhu1titik?.['level_isi_end'] >= suhu_1titik_level_minyak)
								{
										return true 
								}
						})

						suhu_1titik_getTinggiSuhu = findSuhu1Titik?.['suhu_tinggi'];

						let findIdx = arr_suhu_1titik_suhu_tank_num_raw.findIndex(ele_raw=>parseFloat(ele_raw) == parseFloat(suhu_1titik_getTinggiSuhu))
						if (findIdx != -1){
								try {
									suhu_1titik_getTinggiSuhu_Val = arr_suhu_1titik_suhu_tank_num?.[findIdx];
								}catch(e){
									suhu_1titik_getTinggiSuhu_Val = 0;
								}
						}else{
								suhu_1titik_getTinggiSuhu_Val = 0;
						}

						let avg_tank = suhu_1titik_getTinggiSuhu_Val;

						// VOLUME TANGKI
						let tinggi_tmp = parseFloat(obj_store_temp[ele_nama_tangki]['tinggi_minyak']).toFixed(3);
						let avg_tmp = parseFloat(avg_tank);

						let data_suhu_slice = []; 
						let data_suhu_slice_sum = 0;
						let data_suhu_slice_sum_avg = 0;

						// Average-kan data suhu
						if (Array.isArray(obj_store_temp[ele_nama_tangki]?.['data_suhu'])
								&& findIdx >= 0)
						{
								if (obj_store_temp[ele_nama_tangki]?.['data_suhu'].length > 0)
								{
										data_suhu_slice = obj_store_temp[ele_nama_tangki]?.['data_suhu'].slice(0, findIdx + 1);

										data_suhu_slice_sum = data_suhu_slice.reduce((tmp, val)=>{
												return parseFloat(tmp) + parseFloat(val);
										},0)

										data_suhu_slice_sum_avg = Math.round((data_suhu_slice_sum / data_suhu_slice.length) * 100) / 100;

										avg_tank = data_suhu_slice_sum_avg;
										avg_tmp = data_suhu_slice_sum_avg;
								}
						}
						else
						{
								avg_tank = 0;
								avg_tmp = 0;
						}

						// console.log("\nSuhu 1 Titik getTinggi Val\n");
						// console.log(suhu_1titik_getTinggiSuhu_Val)

						let jenis = ''; // cpo atau pko
						if (tinggi_tmp != null){

								// REVISI VOLUME BEDA LITER
								let tinggi_tmp_floor = Math.floor(parseFloat(tinggi_tmp) * 100); // angka floor ( 1010 )
								let tinggi_tmp_all = parseFloat((parseFloat(tinggi_tmp) * 100).toFixed(3));   // angka plus decimal ( 1010,7 )
								let tinggi_tmp_dec = (Math.round((tinggi_tmp_all - tinggi_tmp_floor) * 1000)) / 1000;   // (1010,7777 - 1010 = 0,778)
								// ... end <REVISI VOLUME BEDA LITER>

								// panggil array json tabel volume tangki yang sesuai
								let arr_volume = json_arr_volume_tangki(ele_nama_tangki);

								let findItem = arr_volume.find(res=>
											parseInt(res.tinggi) == tinggi_tmp_floor
								)

								let tanggal_tangki = new Date(obj_store_temp[ele_nama_tangki]['time']);

								let jenisExistsInDB = false;

								Object.keys(this.mst_jenis_by_api).forEach((ele_tank_api, idx_tank_api)=>{
										if (ele_tank_api == ele_nama_tangki)
										{
											if (this.mst_jenis_by_api?.[ele_tank_api] != '' &&
													this.mst_jenis_by_api?.[ele_tank_api] != null)
											{
													jenis = this.mst_jenis_by_api?.[ele_tank_api];
													jenisExistsInDB = true;
											}
										}
								})

								if (!jenisExistsInDB){

										// PRIORITAS JENIS (CPO / PKO)
										// -> 1. Database (api : getJenisByDatentank)
										// -> 2. Langsung ditentukan suhu 1 titik yang diambil apakah <= 39.9999 atau > 39.9999

										// UPDATE TERBARU (PENENTUAN CPO / PKO DARI SUHU YANG DI AMBIL)
										// JIKA SUHU 1 TITIK <= 39.9999, MAKA DIANGGAP "PKO", SEBALIKNYA JIKA > 39.9999 MAKA DIANGGAP "CPO" 
										// jenis = Math.floor(avg_tmp) <= 39.9999 ? "PKO" : "CPO";
										jenis = avg_tmp <= 39.9999 ? "PKO" : "CPO";
										// ... <end>
								}

								if (findItem)
								{
										let beda_liter_mst = 0;
										let beda_liter_hitung = 0;

										// VOLUME LITER ATAU KG tangki
										volume_tbl = parseFloat(findItem.volume);
										beda_liter_mst = parseFloat(findItem.beda_liter);

										beda_liter_hitung = Math.round((beda_liter_mst * tinggi_tmp_dec) * 1000) / 1000; // cth : (dari 1010,7) 0.7 * 4613 => 3229,1 

										beda_liter_hitung_StoreToObj = beda_liter_hitung; // untuk di tampilkan di box rolling

										volume_prev = volume_tbl;

										if (typeof findItem?.['volume'] != 'undefined' &&
													findItem?.['volume'] != null)
										{
												volume_tbl_plus_beda_liter = volume_tbl + beda_liter_hitung;
										}
										
										volume_tbl = volume_tbl_plus_beda_liter;
										
										if (jenis != '' && jenis != null){
												let arr_berat_jenis = json_arr_berat_jenis_tangki(jenis, ele_nama_tangki);

												// === UPDATE BERAT JENIS ===
												find_berat_jenis = arr_berat_jenis.find(res=>
														Math.round(parseFloat(res.temperature)) == Math.floor(avg_tmp)  // "avg_tmp" tidak perlu dibulatkan
												);
												if (find_berat_jenis){
														volume_tbl = volume_tbl * find_berat_jenis?.['berat_jenis'];
												}

												// faktor_koreksi_temp = this.faktor_koreksi(volume_tbl, Math.round(parseFloat(avg_tmp)));
												faktor_koreksi_temp = faktor_koreksi(volume_tbl, Math.floor(parseFloat(avg_tmp))); // tidak perlu dibulatkan
												if (faktor_koreksi_temp != null){

														volume_tbl *= faktor_koreksi_temp;
												}


										}

								}

								// console.log("Tangki : ", ele_nama_tangki);
								// console.log("Tanggal : ", tanggal_tangki.toString());
						}

						// (SUHU 1 TITIK) jika 1 titik suhu di dapat 0 / di bawah 5 M, maka volume langsung di set 0
						if (suhu_1titik_getTinggiSuhu == 0)
						{
								volume_tbl = 0;
						}

						if (typeof obj_tank?.[ele_nama_tangki] == 'undefined' ||
                    obj_tank?.[ele_nama_tangki] == null)
						{
								obj_tank[ele_nama_tangki] = [
										{...obj_store_temp[ele_nama_tangki],
											avg: avg_tank,
											data_suhu_slice,
											data_suhu_slice_sum,
											data_suhu_slice_sum_avg,
											avg_tinggi_suhu: [...arr_tinggi_suhu_tmp],
											avg_tinggi_suhu_val: [...arr_tinggi_suhu_val_tmp],
											beda_liter: beda_liter_hitung_StoreToObj,
											volume_prev,    // volume master
											volume_tbl_plus_beda_liter,
											volume: volume_tbl,
											volume_faktor_koreksi: faktor_koreksi_temp,
											volume_berat_jenis: find_berat_jenis?.['berat_jenis'],
											jenis
										}
								]
						}
						else{
								obj_tank[ele_nama_tangki] = [
										...obj_tank[ele_nama_tangki],
										{...obj_store_temp[ele_nama_tangki],
											avg: avg_tank,
											data_suhu_slice,
											data_suhu_slice_sum,
											data_suhu_slice_sum_avg,
											avg_tinggi_suhu: [...arr_tinggi_suhu_tmp],
											avg_tinggi_suhu_val: [...arr_tinggi_suhu_val_tmp],
											beda_liter: beda_liter_hitung_StoreToObj,
											volume_prev,    // volume master
											volume_tbl_plus_beda_liter,
											volume: volume_tbl,
											volume_faktor_koreksi: faktor_koreksi_temp,
											volume_berat_jenis: find_berat_jenis?.['berat_jenis'],
											jenis
										}
								]
						}

				// })
				}
				// ... end obj_store_temp  

		}


		obj_tank = getLastDate_obj_tank(obj_tank);
		// console.log("==== OBJ TANK TERBARU ====")
		// console.log(obj_tank)

		 // AMBIL MODUS (TINGGI TERBANYAK) masing-masing tangki
		 let obj_tank_modus = {};
		 let obj_temp_tinggi_map = [];
		 let obj_tinggi_map = {};
		 let obj_tinggi_modus = {};
		 let obj_tinggi_modus_filter = {};
		 let obj_tinggi_tank_modus_filter_single = {};

		//  Object.keys(obj_tank).forEach((ele_nama_tangki, idx_obj_tank)=>{
		for (const ele_nama_tangki of Object.keys(obj_tank))
		{
					// [11.16, 11.10, 11.16, 11.16]
					obj_temp_tinggi_map = obj_tank?.[ele_nama_tangki].map((ele_key, idx_key)=>{
						return ele_key?.['tinggi_minyak']
					});
					// ... end []

					if (typeof obj_tinggi_map?.[ele_nama_tangki] == 'undefined'){

							// {'tangki_1' : [11.16, 11.10, 11.16, 11.16]}
							obj_tinggi_map = {
								...obj_tinggi_map,
								[ele_nama_tangki]: [...obj_temp_tinggi_map]
							}
							// ... end {}

							if (typeof obj_tinggi_modus?.[ele_nama_tangki] == 'undefined')
							{
									// single data yang sering keluar
									let getFrequentItem = _(obj_temp_tinggi_map)
																							.countBy()
																							.entries()
																							.maxBy(_.last);
									
									// hanya sebagai referensi master countBy
									let obj_temp_tinggi_map_countBy = _.countBy(obj_temp_tinggi_map);

									if (getFrequentItem.length >= 1){

												let arr_val_y_countBy_entries = Object.entries(obj_temp_tinggi_map_countBy);

												// filter yang memiliki kemunculan angka yang sama (misal, [[12.34, 2], [9.56, 2]]) => [2] == [2]
                        let filter_val_y_countBy_entries = arr_val_y_countBy_entries.filter(elefil => elefil[1] == getFrequentItem[1]);

                        let arr_getMax_Values = filter_val_y_countBy_entries.map((ele_max,idx_max)=>{
                            return parseFloat(ele_max[0])
                        });

												// ambil angka tinggi yang paling maksimal (misal : 12.34)
                        let getMax_Value = Math.max.apply(null, arr_getMax_Values);
												getFrequentItem = [[getMax_Value, getFrequentItem[1]]]
												
									}

									obj_tinggi_modus = {
											...obj_tinggi_modus,
											[ele_nama_tangki]: getFrequentItem
									}

									// filter yang ter banyak dari obj_tinggi_modus

									if (typeof obj_tinggi_modus_filter?.[ele_nama_tangki] == 'undefined')
									{
												let arr_filter_temp = obj_tank?.[ele_nama_tangki].filter((ele,idx)=>{

													return parseFloat(ele?.['tinggi_minyak']) == parseFloat(getFrequentItem[0])
												});

												// multi data yang terbanyak (beda jam dengan satu ketinggian)
                        obj_tinggi_modus_filter = {
                          ...obj_tinggi_modus_filter,
                          [ele_nama_tangki]: [...arr_filter_temp]
                        }

												// single data (cari time yang paling max)
                        let arr_map_time_data = arr_filter_temp.map((ele,idx)=>{
														return ele?.['time_getTime']
												})

												let arr_map_time_data_max = Math.max.apply(null, arr_map_time_data);
                        // ... end tanggal max

												// cari yang last update (tanggal ter-update)
                        let filter_single_modus = obj_tinggi_modus_filter[ele_nama_tangki].filter((ele,idx)=>{
														return ele?.['time_getTime'] == arr_map_time_data_max
												})

												if (filter_single_modus.length > 0)
                        {
														if (typeof obj_tinggi_tank_modus_filter_single?.[ele_nama_tangki] == 'undefined')
														{
																let jarak_sensor_val = 0;
																let find_jarak_sensor_inobj = Object.keys(filter_single_modus?.[0]).find(ele=>ele.toLowerCase().indexOf("jarak sensor") != -1);

																if (find_jarak_sensor_inobj){
																	
																		jarak_sensor_val = parseFloat(filter_single_modus?.[0]?.[find_jarak_sensor_inobj])

																		if (typeof obj_tinggi_tank_modus_filter_single?.[ele_nama_tangki] == 'undefined')
																		{
				
																			let jarak_sensor_val = 0;
																			let find_jarak_sensor_inobj = Object.keys(filter_single_modus?.[0]).find(ele=>ele.toLowerCase().indexOf("jarak sensor") != -1);
				
																			if (find_jarak_sensor_inobj){
																				
																					jarak_sensor_val = parseFloat(filter_single_modus?.[0]?.[find_jarak_sensor_inobj])
																			}
				
																			// hanya menampung satu data tanggal terakhir per tangki
																				obj_tinggi_tank_modus_filter_single = {
																						...obj_tinggi_tank_modus_filter_single,
																						[ele_nama_tangki]: {
																							jarak_sensor: jarak_sensor_val,
																							sensor_off: jarak_sensor_val >= parseFloat(this.mst_t_kalibrasi[ele_nama_tangki]) ? true : false,
																							...filter_single_modus?.[0]
																						}
																				}
																		}
																}
														}

												}

												// Dapatkan Suhu Terkecil dan Terbesar yang tercelup (* hanya ada di scheduler)
												let suhu_tercelup = obj_tinggi_tank_modus_filter_single?.[ele_nama_tangki]?.['data_suhu_slice'];
												if (Array.isArray(suhu_tercelup))
												{
														let suhu_terkecil = Math.min.apply(null, suhu_tercelup);
														let suhu_terbesar = Math.max.apply(null, suhu_tercelup);
														obj_tinggi_tank_modus_filter_single = {
																...obj_tinggi_tank_modus_filter_single,
																[ele_nama_tangki]:{
																		...obj_tinggi_tank_modus_filter_single?.[ele_nama_tangki],
																		data_suhu_slice_min: suhu_terkecil,		// SUHU TERKECIL
																		data_suhu_slice_max: suhu_terbesar		// SUHU TERBESAR
																}
														}
												}

												// console.log("obj_tank")
												// obj_tank => kumpulan 10 menit
												// obj_tinggi_tank_modus_filter_single => nilai modus satu waktu per satu tangki

												// Cari yang tinggi terbesar dari 10 menit terakhir
												let obj_tinggi_max_10min = _.maxBy(obj_tank?.[ele_nama_tangki], 'tinggi_minyak');
												let arr_tinggi_max_10min_filter = _.filter(obj_tank?.[ele_nama_tangki], {tinggi_minyak: obj_tinggi_max_10min?.['tinggi_minyak']});
												// // --- Final Max tinggi-time 
												let obj_tinggi_time_max_10min = _.maxBy(arr_tinggi_max_10min_filter, 'time');

												// Cari yang tinggi terkecil dari 10 menit terakhir
												let obj_tinggi_min_10min = _.minBy(obj_tank?.[ele_nama_tangki], 'tinggi_minyak');
												let arr_tinggi_min_10min_filter = _.filter(obj_tank?.[ele_nama_tangki], {tinggi_minyak: obj_tinggi_min_10min?.['tinggi_minyak']});
												// // --- Final Minimal tinggi-time dengan waktu yang paling Maksimal
												let obj_tinggi_time_min_10min = _.maxBy(arr_tinggi_min_10min_filter, 'time');

												// Cari "Jarak Sensor (cm)" terkecil dari 10 menit terakhir
												let obj_jarak_min_10min = _.minBy(obj_tank?.[ele_nama_tangki], 'jarak_sensor_cm');
												let arr_jarak_min_10min_filter = _.filter(obj_tank?.[ele_nama_tangki], {jarak_sensor_cm: obj_jarak_min_10min?.['jarak_sensor_cm']});
												// // --- Final Minimal jarak-time dengan waktu yang paling Maksimal
												let obj_jarak_time_min_10min = _.minBy(arr_jarak_min_10min_filter, 'time');
												
												// Cari "Jarak Sensor (cm)" terbesar dari 10 menit terakhir
												let obj_jarak_max_10min = _.maxBy(obj_tank?.[ele_nama_tangki], 'jarak_sensor_cm');
												let arr_jarak_max_10min_filter = _.filter(obj_tank?.[ele_nama_tangki], {jarak_sensor_cm: obj_jarak_max_10min?.['jarak_sensor_cm']});
												// // --- Final Maksimal jarak-time dengan waktu yang paling Maksimal
												let obj_jarak_time_max_10min = _.maxBy(arr_jarak_max_10min_filter, 'time');
											
												// console.log('---- TANGKI ---- ', ele_nama_tangki)

												// hitung jumlah / count data yang keluar selama 10 menit terakhir => "datapoin"
												let datapoin_tinggi = 0;
												datapoin_tinggi = obj_tank?.[ele_nama_tangki].length
												
												// //	misal tinggi modus = 875 Cm, datapoin adalah jumlah yang muncul ada berapa banyak 875
												// let filterTinggiModus = _.filter(obj_tank?.[ele_nama_tangki], {tinggi_minyak_cm: obj_tinggi_tank_modus_filter_single?.[ele_nama_tangki]?.['tinggi_minyak_cm']});
												// if (filterTinggiModus != null){ datapoin_tinggi = filterTinggiModus.length }
												// ... end datapoin

												// Hitung jumlah titik suhu tercelup
												let suhu_tercelup_count = 0;
												suhu_tercelup_count = obj_tinggi_tank_modus_filter_single?.[ele_nama_tangki]?.['data_suhu_slice'];
												if (Array.isArray(suhu_tercelup_count)) {suhu_tercelup_count = suhu_tercelup_count.length};
												// ... end count suhu tercelup

												// logtime suhu adalah ambil time yang paling akhir dari 10 menit terakhir
												// misal filter 09:00 - 09:09, maka ambil yang 09:09
												let logtime_suhu = _.maxBy(obj_tank?.[ele_nama_tangki], "time")?.['time'];


												obj_tinggi_tank_modus_filter_single = {
														...obj_tinggi_tank_modus_filter_single,
														[ele_nama_tangki]:{
																...obj_tinggi_tank_modus_filter_single?.[ele_nama_tangki],

																data_tinggi_10min_min: obj_tinggi_time_min_10min?.['tinggi_minyak'],		// TINGGI TERKECIL
																data_tinggi_10min_min_log: obj_tinggi_time_min_10min?.['time'],		// LOG TIME TINGGI TERKECIL
																data_tinggi_10min_max: obj_tinggi_time_max_10min?.['tinggi_minyak'],		// TINGGI TERBESAR
																data_tinggi_10min_max_log: obj_tinggi_time_max_10min?.['time'],		// LOG TIME TINGGI TERBESAR

																data_jarak_cm_10min_min: obj_jarak_time_min_10min?.['jarak_sensor_cm'],		// JARAK SENSOR TERKECIL
																data_jarak_cm_10min_min_log: obj_jarak_time_min_10min?.['time'],		// LOG TIME JARAK SENSOR TERKECIL
																data_jarak_cm_10min_max: obj_jarak_time_max_10min?.['jarak_sensor_cm'],		// JARAK SENSOR TERBESAR
																data_jarak_cm_10min_max_log: obj_jarak_time_max_10min?.['time']		// LOG TIME JARAK SENSOR TERBESAR

																,tangki_id: ele_nama_tangki
																,datapoin: datapoin_tinggi				// semua data yang terambil dari 10 menit terakhir
																
																,logtime_suhu				// logtime suhu adalah ambil time yang paling akhir dari 10 menit terakhir
																,suhu_count: suhu_tercelup_count	// jumlah titik suhu yang tercelup
																,created_time: formatDate(new Date(),"YYYY-MM-DD HH:mm:ss")
														}
												}

												// let tinggi_max_map = _.map(obj_tank?.[ele_nama_tangki], (val)=>val?.['tinggi_minyak']);
												// let time_max_map = _.map(obj_tank?.[ele_nama_tangki], (val)=>val?.['time']);
												// let jarak_max_cm_map = _.map(obj_tank?.[ele_nama_tangki], (val)=>val?.['jarak_sensor_cm']);

												// console.log("jarak_max_map");
												// console.log(jarak_max_cm_map);

												// console.log("tinggi_max_map");
												// console.log(tinggi_max_map);

												// console.log("time_max_map");
												// console.log(time_max_map);

												// console.log("obj_tinggi_time_min_10min");
												// console.log(obj_tinggi_time_min_10min);

												// console.log("obj_tinggi_time_max_10min");
												// console.log(obj_tinggi_time_max_10min);

												// console.log("arr_tinggi_max_10min_filter");
												// console.log(arr_tinggi_max_10min_filter);
												
												// // ----- ARRAY ACUAN DATA LATEST OR 10 MENIT TERAKHIR
												// console.log(obj_tinggi_tank_modus_filter_single)		// satu data angka modus
												// console.log(obj_tank)															// data 10 menit terakhir

									}
							}
							
					}

		//  });
		}
		//  * end Looping Object.keys(obj_tank)

		return obj_tinggi_tank_modus_filter_single
		// callback(obj_tinggi_tank_modus_filter_single)
}



const rekursif = async () => {

		progressBar.start(100,0);

		arr_device_pattern = [];
		arr_company_list = [];
		mst_list_tangki = [];
		arr_json_alldata = [];
		this.arr_json_tangki_last = {};
		this.mst_jenis_by_api_perjam = {};
		this.arr_tangki_last_from_dataHour = {};
		
    // Get List Device Valid Pattern
		// progressBar.update(14.285 * 1, {format: generateDynamicFormat(14.285*1, 'Get Device Valid Pattern')});
	
		progressBar.update(14.285 * 1);

		// ** step 1
    await getDeviceValidPattern().then(async resPatt=>{ // [ 'BESTAGRO', 'HP_PAMALIAN', 'TASK1TANK', 'WSSLTANK' ]
        
        if (typeof resPatt?.['status'] != 'undefined' && 
            resPatt?.['status'].toLowerCase() == 'success')
        {
						this.arr_device_pattern = [...resPatt?.['hasil']];

						// ** step 2
						// progressBar.update(14.285 * 2, {format: generateDynamicFormat(14.285*2, 'Get Company')});
						progressBar.update(
								Math.round((14.285 * 2) * 100) / 100
						);
            // Get List company
            await getCompany().then(async resCom=>{     //   {id: 1,company_name: 'PT. TASK 3',bg_color: 'bg-gradient-danger', ...
        
                if (typeof resCom?.['status'] != 'undefined' && 
                    resCom?.['status'].toLowerCase() == 'success')
                {
                    let arr_company = [];

                    if (Array.isArray(resCom?.['hasil']))
                    {
                        arr_company = resCom?.['hasil'].map((ele,idx)=>{
                                        return {
                                            id: ele?.['id'],
                                            company: ele?.['company_name'],
                                            backgroundColor: ele?.['bgcolor_gl'] != null ? JSON.parse(ele?.['bgcolor_gl']) : [],    // cth : [255,255,255]
                                            centroid: [ele?.['centroid_lng'], ele?.['centroid_lat']]  // [longitude, latitude]
                                        }
                        });


												// ambil semua company dengan id company saja seperti [1,2,3]
												let selected_company_str = arr_company.map(ele=>ele?.['id']);

												// ** step 3
												progressBar.update(
													Math.round((14.285 * 3) * 100) / 100
												);
												// ambil range suhu tinggi tangki
												await getAPI_Suhu1Titik(selected_company_str).then(async resSuhu1Titik=>{     //   {company_id: 1,company_name: 'PT. TASK 3',level_isi_start: 9, level_isi_end: 11.9999, suhu_tinggi: 9, tangki_id: 'tangki_3' ...
		
													if (typeof resSuhu1Titik?.['status'] != 'undefined' && 
															resSuhu1Titik?.['status'].toLowerCase() == 'success')
													{

															this.mst_suhu1titik = [...resSuhu1Titik?.['hasil']];
															// console.log("mst_suhu1titik")
															// console.log(mst_suhu1titik)

															// ** step 4
															progressBar.update(
																	Math.round((14.285 * 4) * 100) / 100
															);
															// ambil master company tangki yang terdapat id_device, profile, volume maks, dst..
															// getCompanyTangki sama seperti getCompanyList (dashboard)
															await getCompanyTangki(selected_company_str).then(async resComTank => {

																	if (typeof resComTank?.['status'] != 'undefined' && 
																			resComTank?.['status'].toLowerCase() == 'success')
																	{
																			
																			let resCompTankHasil = [...resComTank?.['hasil']];
																			this.arr_company_list = [...resComTank?.['hasil']];

																			if (Array.isArray(resComTank?.['hasil']))
																			{
																					let arr_id_device = resComTank?.['hasil'].map((eleComTank, idxComTank)=>{
																							return eleComTank?.['id_device'];
																					})
																					// hilangkan id_device duplikat
																					let arr_id_device_group = _.uniq(arr_id_device);
																					let global_arr_id_device_group = [...arr_id_device_group];

																					this.mst_list_tangki = [];

																					

																					if (Array.isArray(resCompTankHasil))
																					{
																						// Looping List Company Tangki

																								let arr_mst_t_max = resCompTankHasil.map((v) => {return { [v?.['tangki_id']]: v?.['volume_maks']}});
																								this.mst_t_max = _.merge({}, ...arr_mst_t_max);	// jadikan object bukan array

																								let arr_mst_t_tangki = resCompTankHasil.map((v) => {return { [v?.['tangki_id']]: v?.['tinggi_tangki']}});
																								this.mst_t_tangki = _.merge({}, ...arr_mst_t_tangki);

																								let arr_mst_t_profile = resCompTankHasil.map((v) => {return { [v?.['tangki_id']]: v?.['tinggi_profile']}});
																								this.mst_t_profile = _.merge({}, ...arr_mst_t_profile);

																								let arr_mst_avg_t_segitiga = resCompTankHasil.map((v) => {return { [v?.['tangki_id']]: v?.['tinggi_delta']}});
																								this.mst_avg_t_segitiga = _.merge({}, ...arr_mst_avg_t_segitiga);

																								let arr_mst_t_kalibrasi = resCompTankHasil.map((v) => {return { [v?.['tangki_id']]: v?.['tinggi_kalibrasi']}});
																								this.mst_t_kalibrasi = _.merge({}, ...arr_mst_t_kalibrasi);
																								
																								let arr_mst_jenis_by_api = resCompTankHasil.map((v) => {return { [v?.['tangki_id']]: ''}});
																								this.mst_jenis_by_api = _.merge({}, ...arr_mst_jenis_by_api);

																								let arr_mst_1m_cpo_pko = resCompTankHasil.map((v) => {return { [v?.['tangki_id']]: ''}});
																								this.mst_1m_cpo_pko = _.merge({}, ...arr_mst_1m_cpo_pko);
																								
																								let arr_mst_jenis_by_api_perjam = resCompTankHasil.map((v) => {return { [v?.['tangki_id']]: ''}});
																								this.mst_jenis_by_api_perjam = _.merge({}, ...arr_mst_jenis_by_api_perjam);
																								
																								let arr_mst_1m_cpo_pko_filter = resCompTankHasil.map((v) => {return { [v?.['tangki_id']]: ''}});
																								this.mst_1m_cpo_pko_filter = _.merge({}, ...arr_mst_1m_cpo_pko_filter);
																								
																								this.mst_list_tangki = resCompTankHasil.map((v)=>{
																										return {
																												company: v?.['company_name'],
																												name: v?.['tangki_id'],
																												api: v?.['api'],
																												bgColor_Tangki: v?.['bg_color_tangki'],
																												bgColor_Company: v?.['bg_color_company'],
																												bgColor: v?.['bg_color'],
																												title: v?.['tangki_name'],
																												value: v?.['tangki_name'],
																												label: v?.['tangki_name'],
																												id_device: v?.['id_device'],
																												centroid: [v?.['centroid_lng'], v?.['centroid_lat']],
																												centroid_text: [v?.['centroid_text_lng'], v?.['centroid_text_lat']],
																												volume_maks: v?.['volume_maks'],
																												tinggi_tangki: v?.['tinggi_tangki'],
																												tinggi_delta: v?.['tinggi_delta'],
																												tinggi_profile: v?.['tinggi_profile'],
																												tinggi_kalibrasi: v?.['tinggi_kalibrasi']
																										}
																								})

																								// ** step 5
																								progressBar.update(
																										Math.min(Math.round((14.285 * 5) * 100) / 100, 100)
																								);
																								// get Last Data Terakhir dari semua tangki
																								
																								await getLastData(global_arr_id_device_group, param_api, param_date, param_hourbegin, param_hourlast).then(async resLastData => {
																										if (typeof resComTank?.['status'] != 'undefined' && 
																														resComTank?.['status'].toLowerCase() == 'success')
																										{
																											arrHasilLast = resLastData?.['hasil']?.['data'];

																											// console.log("arrHasilLast")
																											// console.log(arrHasilLast)
																											// console.log("==================> end arrHasilLast <==========")
																											
																											// * Grouping per waktu time, jadi tidak mungkin ada tangki yang sama dalam satu time.
																											let hasilgroup = _.groupBy(arrHasilLast, 'time');

																											// console.log("hasilgroup")
																											// console.log(hasilgroup)
																											// console.log("==================> end hasilgroup <==========")

																											// console.log("ARR JSON GET LAST DATA\n")
																											// console.log(arrHasilLast)

																											// * simpan ke array yang menampung time secara flat
																											// * Object awal => { '2023-12-14 09:37:00' : [{ id_device:'WSSLTANK1', dst...}], dst... }
																											// * hasil akhir => [ '2023-12-14 09:37:00', '2023-12-14 09:36:00' ]
																											let arrHasilGroup = Object.keys(hasilgroup);

																											// console.log("arrHasilGroup")
																											// console.log(arrHasilGroup)
																											
																											if (arrHasilGroup.length > 0)
																											{
																												let counterAngka = 0.001	// cliProgress
																												// ** array Hasil group [ '2023-12-14 09:37:00', '2023-12-14 09:36:00' ]
																												let counterProgressMajor = 6.5;

																												for (const hasilGroupSingle of arrHasilGroup)
																												{

																													// *Kosongkan dahulu object arr_json_tangki_last
																														this.arr_json_tangki_last = {};
																														this.arr_date_realtime = [];

																														// * ambil per waktu time. dalam satu time banyak tangki yang unik.

																														let arrHasilGroupTime = hasilgroup?.[hasilGroupSingle];
																													
																														// if (typeof arrHasilLast != 'undefined' && arrHasilLast != null)
																														
																														if (typeof arrHasilGroupTime != 'undefined' && arrHasilGroupTime != null)
																														{

																																this.arr_json_alldata = [...
																																			// arrHasilLast.filter((res)=>{

																																				arrHasilGroupTime.filter((res)=>{
																																					if (typeof res?.['id_device'] != 'undefined' && 
																																							res?.['id_device'] != null &&
																																							(
																																									// cek apakah id_device nya valid dan tercantum di dalam tabel device pattern
																																									this.arr_device_pattern.find((val,idx)=>res?.['id_device'].toString().toUpperCase().indexOf(val) != -1)
																																							)
																																					)
																																					{
																																							return true
																																					}
																																			})
																																];
			
																																// ** Looping
																																// console.log("=== ", this.mst_list_tangki);
			
																																// console.log("MASTER LIST TANGKI\n")
																																// console.log(this.mst_list_tangki)
			
																																// console.log('\nARR JSON ALL DATA (AWAL)\n---');
																																// console.log(this.arr_json_tangki_last);

																																// console.log(Object.keys(this.arr_json_tangki_last));


																																// this.arr_json_alldata.forEach((ele)=>{
																																
																																for (const ele of this.arr_json_alldata){
			
																																		let data_arr = ele?.['data']?.[0];
																																		
																																		// let counterAngka = 0;
																																		// for (let mst_list_tangki of this.mst_list_tangki)
																																		for (const mst_list_tangki of this.mst_list_tangki)
																																		{
																																			
																																				// if (mst_list_tangki?.['name'] == 'tangki_1')
																																				// {
																																						// simpan ke this.arr_json_tangki_last
																																						// console.log("*** => ", Object.keys(data_arr));
						
																																							update_to_arr_json_tangki_last(data_arr, ele, mst_list_tangki?.['name'], mst_list_tangki?.['api'], this.arr_json_tangki_last);
			
																																							progressBar.update(
																																									// Math.round((14.285 * (5 + (counterAngka * 0.01)) * 100)) / 100
																																									Math.min(Math.round((14.285 * (counterProgressMajor + (counterAngka)) * 10000)) / 10000, 100)
																																							)
																																							counterAngka += 0.001;
																																				// }
																																		}
																																// });
																																}


																																// console.log("\nARR JSON ALLDATA \n", hasilGroupSingle ,"end arr json alldata\n");
																																// console.log('\nARR JSON TANGKI LAST (AKHIR)\n---');
																																// console.log(this.arr_json_tangki_last);
			
																																// ** step 6
																																counterAngka += 0.001;
																																progressBar.update(
																																		// Math.round((14.285 * 6) * 100000) / 100000
																																		Math.min(Math.round((14.285 * (counterProgressMajor + counterAngka)) * 10000) / 10000, 100)
																																);
													
																																// await get_jenis_by_api_lastdata(this.arr_json_tangki_last).then(async (resJenisAPI)=>{
			
																																// console.log("-------------- ARR JSON TANGKI LAST -------- ", mst_list_tangki)
																																// console.log(this.arr_json_tangki_last);

																																// console.log('\n (1) -------------(1) masuk 1')
																																

																																// const jeniapilast = await get_jenis_by_api_lastdata(this.arr_json_tangki_last, async (resJenisAPI)=>{
																																const resJenisAPI = await get_jenis_by_api_lastdata(this.arr_json_tangki_last);

																																console.log("\n---- (3) MAP arr_json_tangki_last ----\n")
																																let maptes = _.mapValues(this.arr_json_tangki_last, 'time');
																																console.log(maptes)

																																		// console.log('-------------(2) masuk 2\n')
		
																																		// const resJenisAPI = await get_jenis_by_api_lastdata(this.arr_json_tangki_last);
																																		// console.log("\nMaster Jenis Tangki")
																																		// console.log(this.mst_jenis_by_api)
																																		
																																		this.mst_jenis_by_api_perjam = {...resJenisAPI};
																																		// console.log('-------------(3) masuk 3\n')
			
																																		// console.log("\n");
																																		// console.log(this.mst_jenis_by_api_perjam);
			
																																		// ** step 7
																																		// progressBar.update(14.285 * 6.5);

																																		// console.log('-------------(4) masuk 4\n')
																																		
																																		const obj_tinggi_tank_modus_filter_single = await processPreviousMinTank_fromLast(this.arr_json_tangki_last, counterProgressMajor, counterAngka);
																																		counterAngka += 0.001;
																																		counterProgressMajor += 0.1
			
																																// })
			
																																// console.log(this.arr_json_tangki_last)
			
																														}
																														// * Looping hasil last data
																												}

																												progressBar.update(100);
																												progressBar.stop();

																												console.log('\t----- COMPLETED -----')
																												if (param_api == 'getlastdata')
																												{
																														setTimeout(() => {
																																rekursif()
																														}, 60000);
																												}
																												// ** ---- end array Hasil group
																											}

																										}
																								})
																					}
																					// console.log(global_arr_id_device_group)
																			}
																	}
															})
													}

												})

                    }

                    // console.log(arr_company)

                    // setTimeout(() => {
                    //     rekursif()
                    // }, 3000);
                }
    
            })
        }
        
    })

}

rekursif();