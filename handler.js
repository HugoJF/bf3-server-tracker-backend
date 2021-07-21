'use strict';

const Gamedig = require('gamedig');

function parseAddress(ip) {
    const match = ip.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})/);

    if (!match) {
        return null;
    }

    return {
        ip: match[1],
        port: parseInt(match[2]),
    }
}

async function queryServer(addressString) {
    const address = parseAddress(addressString);

    if (!address) {
        return {
            address: addressString,
            data: `${address} is not a valid address`
        };
    }

    try {
        const {ip, port} = address;

        return {
            address: addressString,
            data: await Gamedig.query({
                type: 'bf3',
                host: ip,
                port: port,
                attemptTimeout: 1000,
            })
        };
    } catch (e) {
        return {
            address: addressString,
            data: `Server error: ${e.message}`
        };
    }
}

function resultFormatter(result) {
    return {
        address: result.value.address,
        data: result.value.data,
    }
}

function resultsFormatter(results) {
    return results.map(resultFormatter).reduce((acc, i) => ({
        ...acc,
        [i.address]: i.data,
    }), {});
}

module.exports.hello = async (event) => {
    console.log(event);

    if (!event.queryStringParameters) {
        return {
            statusCode: 400,
            body: 'Missing query parameters',
        }
    }

    let address = event.queryStringParameters['address'];

    if (!address) {
        return {
            statusCode: 400,
            body: 'Missing address',
        }
    }

    if (address.split) {
        address = address.split(',');
    }

    if (!Array.isArray(address)) {
        address = [address];
    }

    const promises = address.map(queryServer);

    const result = await Promise.allSettled(promises);

    console.log(result);

    return {
        statusCode: 200,
        body: JSON.stringify(resultsFormatter(result)),
    }
};
