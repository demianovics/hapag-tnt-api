# hapag-tnt-api

Fetch Hapag-Lloyd's Track and Trace API https://api-portal.hlag.com/#/products/events-tracing-for-web-api-product-d73213 with Node.js, and write the result into a CSV file.

## Install

```shell
git clone git@github.com:demianovics/hapag-tnt-api.git
```

Copy `.env.example` to `.env` and provide credentials. Create folder `csv` if it doesn't exist yet.

```shell
npm install
```

## Run

```shell
hapag-tnt-api % node cmd.js                 
Usage: node cmd.js [options]
At least one of these parameters needs to be provided: --transportDocumentRefere
nce, --carrierBookingReference, --equipmentReference

Options:
      --transportDocumentReference, --tdr  B/L Number                   [string]
      --carrierBookingReference, --cbr     Booking Number/Carrier's Reference
                                                                        [string]
      --equipmentReference, --er           BIC ISO Container Identification Numb
                                           er                           [string]
  -v, --verbose                            Verbose mode
                                                      [boolean] [default: false]
  -h, --help                               Show help                   [boolean]

At least one of these parameters needs to be provided --carrierBookingReference, --transportDocumentReference, --equipmentReference
```

Fetch with a transportDocumentReference (B/L Number)
```shell
node cmd.js --transportDocumentReference HLBU12345678
```
Fetch with a carrierBookingReference (Booking Number/Carrier's Reference)
```shell
node cmd.js --carrierBookingReference 12345678
```
Fetch with an equipmentReference (BIC ISO Container Identification Number)
```shell
node cmd.js --equipmentReference ABCD1234567
```
