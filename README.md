# hapag-tnt-api

Fetch the HAPAG Track and Trace API https://api-portal.hlag.com/#/products/events-tracing-for-web-api-product-d73213 with Node.js, and write the result into a CSV file.

## Install

Copy `.env.example` to `.env` and provide credentials. Create folter `csv` if it doesn't exist yet.

```shell
npm install
```

## Run

```shell
node cmd.js --transportDocumentReference HLBU12345678
node cmd.js --carrierBookingReference 12345678
node cmd.js --equipmentReference ABCD1234567
```
