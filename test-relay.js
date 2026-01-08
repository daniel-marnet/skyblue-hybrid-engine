const https = require('https');

const data = JSON.stringify({
    mas: 1, ice: 1, mot: 1, eme: 0, mod: 1,
    bat: 88.8, fue: 99.9, thr: 50, sol: 4.5,
    tst: 2500, spd: 150, alt: 3000,
    flt_time: 120, dist_km: 10, range_km: 500,
    elec_wh: 100, ice_wh: 200, solar_wh: 50,
    elec_pct: 33, co2_g: 500, co2_saved_g: 100
});

const options = {
    hostname: 'skyblue.marnettech.com.br',
    port: 443,
    path: '/api/websocket-relay/wokwi',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
