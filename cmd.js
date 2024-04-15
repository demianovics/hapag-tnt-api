import { writeFile } from "node:fs";
import fetch from 'node-fetch';
import querystring from 'querystring';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import process from 'process';
import dotenv from 'dotenv';
dotenv.config();

/*
    // sample SHIPMENT Event
    {
        "eventCreatedDateTime": "2024-02-17T22:48:15.327Z",
        "eventType": "SHIPMENT",
        "eventClassifierCode": "ACT",
        "eventDateTime": "2024-02-17T22:48:15.000Z",
        "shipmentEventTypeCode": "CONF",
        "documentTypeCode": "BKG",
        "documentID": "12345678"
    }

    // sample TRANSPORT Event
    {
        "eventCreatedDateTime": "2024-02-16T19:01:04.355Z",
        "eventType": "TRANSPORT",
        "eventClassifierCode": "PLN",
        "eventDateTime": "2024-03-20T00:45:00.000Z",
        "transportEventTypeCode": "DEPA",
        "transportCall": {
            "transportCallId": "dfdf5cf6-033b-4782-b31c-98fbe6db65bf",
            "modeOfTransport": "VESSEL",
            "UNLocationCode": "DEHAM",
            "facilityCode": "DEHAMSRJQ",
            "facilityCodeListProvider": "BIC",
            "facilityTypeCode": "POTE",
            "location": {
            "UNLocationCode": "DEHAM",
            "locationName": "HAMBURG",
                "address": {
                    "name": "HHLA CONTAINER-TERMINAL (CTA)"
                }
            },
            "vessel": {
                "vesselName": "IDA RAMBOW",
                "vesselIMONumber": null
            },
            "importVoyageNumber": null,
            "exportVoyageNumber": "UNIF  54"
    }

    // sample EQUIPMENT Event
    {
        "eventType": "EQUIPMENT",
        "equipmentEventTypeCode": "DISC",
        "equipmentReference": "ABCD1234567",
        "ISOEquipmentCode": "45RT",
        "emptyIndicatorCode": "LADEN",
        "eventClassifierCode": "PLN",
        "eventDateTime": "2024-03-23T19:00:00.000Z",
        "eventCreatedDateTime": "2024-02-16T19:01:04.355Z",
        "eventLocation": {
        "UNLocationCode": "NOOSL",
        "locationName": "OSLO",
            "address": {
                "name": "OSL PORT YILPORT SJURSOYA/HLC DEPOT"
            }
        },
        "transportCall": {
            "transportCallId": "1deef68c-9437-440f-bff0-6db8bffe6706",
            "modeOfTransport": "VESSEL",
            "UNLocationCode": "NOOSL",
            "facilityCode": "SCT",
            "facilityCodeListProvider": "SMDG",
            "facilityTypeCode": "POTE",
            "location": {
                "UNLocationCode": "NOOSL",
                "locationName": "OSLO",
                "address": {
                    "name": "OSL PORT YILPORT SJURSOYA/HLC DEPOT"
                }
            },
            "vessel": {
                "vesselName": "IDA RAMBOW",
                "vesselIMONumber": null
            },
            "importVoyageNumber": "UNIF  54",
            "exportVoyageNumber": null
        }
    }
*/

const argumentOptions = {
    transportDocumentReference: {
        alias: 'tdr',
        describe: 'B/L Number',
        type: 'string',
    },
    carrierBookingReference: {
        alias: 'cbr',
        describe: 'Booking Number/Carrier\'s Reference',
        type: 'string',
    },
    equipmentReference: {
        alias: 'er',
        describe: 'BIC ISO Container Identification Number',
        type: 'string',
    }
};

const x = yargs(hideBin(process.argv))
    .usage('Usage: node $0 [options]')
    .usage('At least one of these parameters needs to be provided: --transportDocumentReference, --carrierBookingReference, --equipmentReference');

    Object.keys(argumentOptions).forEach((name) => {
        x.option(name, argumentOptions[name]);
    })
    
    x.option("verbose", {
        alias: 'v',
        describe: 'Verbose mode',
        type: 'boolean',
        default: false
    })
    .check((argv) => {
        // checks for required parameters
        if (!argv.carrierBookingReference && !argv.transportDocumentReference && !argv.equipmentReference) {
            throw new Error('At least one of these parameters needs to be provided --carrierBookingReference, --transportDocumentReference, --equipmentReference');
        }
        return true; // tell yargs about valid arguments
    })
    .version(false)
    .help()
    .alias('help', 'h');

const argv = x.argv;

// extract url_parameters from argv
const arguments_keys = Object.keys(argumentOptions);
const url_parameters = arguments_keys.reduce((acc, key) => {
  if (argv.hasOwnProperty(key)) {
    acc[key] = argv[key];
  }
  return acc;
}, {});
console.log("URL Parameters:", url_parameters);


// T&T API base_url
const base_url = 'https://api.hlag.com/hlag/external/v2/events/';

// build url from base_url and url_parameters
const encodedQueryString = querystring.stringify(url_parameters);
const url = base_url + '?' + encodedQueryString;

console.log("GET", url);

async function callAPI() {

    const options = {
        method: 'GET',
        headers: {
            'Accept':               'application/json',
            'API-Version':          '1',
            'X-IBM-Client-Id':      process.env.CLIENT_ID,
            'X-IBM-Client-Secret':  process.env.CLIENT_SECRET,
        }
    };

    try {
        const response = await fetch(url, options);
        console.log('Status:', response.status);

        // response.headers
        for (const pair of response.headers.entries()) {
            console.log(`< ${pair[0]}: ${pair[1]}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error calling the api:', error);
    }
}

function flattenObject(obj, prefix = "") {
    let flattened = {};
    Object.keys(obj).forEach((key) =>{
        const value     = obj[key];
        const newKey    = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "object" && !(value instanceof Date) && !Array.isArray(value) && value !== null && value !== undefined) {
            flattened = { ...flattened, ...flattenObject(value, newKey) };
        } else {
            flattened[newKey] = value;
        }
    });
    return flattened;
}

async function handler() {

    // fetch JSON from API
    const events = await callAPI();
    console.log("JSON: ", JSON.stringify(events).substring(0, 100) + " ...");

    // turn datestrings to date objects
    events.forEach(event => {
        event.eventDateTime         = new Date(event.eventDateTime);
        event.eventCreatedDateTime  = new Date(event.eventCreatedDateTime);
    });
    // sort by eventDateTime
    events.sort((a, b) => a.eventDateTime - b.eventDateTime);

    // print element as is and flattened to check
    if (argv.verbose) console.log(JSON.stringify(events[0], null, 2));
    if (argv.verbose) console.log(flattenObject(events[0], null, 2));

    // make sure to collect every field/path that exists
    const allColumnsObject = {};

    for (let index = 0; index < events.length; index++) {
        // flatten every event
        events[index] = flattenObject(events[index]);

        // turn date objects back into readable format
        events[index].eventCreatedDateTime  = events[index].eventCreatedDateTime.toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " ");
        events[index].eventDateTime         = events[index].eventDateTime.toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " ");

        // collect every field/path that exists
        Object.keys(events[index]).forEach((key) => {
            allColumnsObject[key] = null;
        })
    }
    // console.log("allColumnsObject", allColumnsObject);
    // turn allColumnsObject into Array
    const allColumnsArray = Object.keys(allColumnsObject);
    if (argv.verbose) console.log("allColumnsArray", allColumnsArray);

    // define all known fields/paths and their order
    const headers = [
        'eventCreatedDateTime',
        'eventDateTime',
        'eventType',
        'eventClassifierCode',
        'documentTypeCode',
        'documentID',
        'shipmentEventTypeCode',
        'transportEventTypeCode',
        'equipmentEventTypeCode',
        'equipmentReference',
        'ISOEquipmentCode',
        'emptyIndicatorCode',
        'transportCall.vessel.vesselName',
        'transportCall.vessel.vesselIMONumber',
        'transportCall.exportVoyageNumber',
        'transportCall.importVoyageNumber',
        'eventLocation.UNLocationCode',
        'eventLocation.locationName',
        'eventLocation.address.name',
        'transportCall.transportCallId',
        'transportCall.modeOfTransport',
        'transportCall.UNLocationCode',
        'transportCall.facilityCode',
        'transportCall.facilityCodeListProvider',
        'transportCall.facilityTypeCode',
        'transportCall.location.UNLocationCode',
        'transportCall.location.locationName',
        'transportCall.location.address.name'
    ];

    // add new fields/paths to headers
    const set1              = new Set(allColumnsArray);
    const set2              = new Set(headers);
    const difference        = new Set([...set1].filter(x => !set2.has(x)));
    headers.push(...difference);
    if (argv.verbose) console.log("headers", headers);

    // create csvString
    const csvHeaderString = "URL_PARAMETERS," + headers.join(",");
    if (argv.verbose) console.log(csvHeaderString);

    const csvBodyArray = [];

    events.forEach((event) => {
        let fields = [];

        fields.push(JSON.stringify(url_parameters));

        headers.forEach((key) => {

            if (event[key] !== undefined) {
                fields.push('"' + event[key] + '"');
            }
            else {
                fields.push('');
            }
        })

        csvBodyArray.push(fields.join(","));
    })

    const csvString = `${csvHeaderString}\n${csvBodyArray.join('\n')}`;
    if (argv.verbose) console.log(csvString);

    // write to file
    writeFile(`./csv/${JSON.stringify(url_parameters)}.csv`, csvString, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`${events.length} events written to ./csv/${JSON.stringify(url_parameters)}.csv`);
    });

}
handler();