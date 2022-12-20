# Superfluid accounting items

Accounting items aims to process the streaming data to a format that's easier to consume for traditional accounting tools. It takes a StreamPeriod and divides it into amounts streamed grouped by calendar days (`dailyAmounts`). StreamPeriod represents a period in a Stream where the flowRate remains constant.

All the timestamps used in the project are in UTC.


## Running locally

1) Install node modules:
```
yarn install
```

2) Install netlify cli (more info at `https://docs.netlify.com/cli/get-started/`)
```
npm install netlify-cli -g
```

3) Run netlify
```
netlify dev
```

4) Local server will start at
```
http://localhost:8888
```

## API endpoints

### Virtualized stream periods

**URL**
`https://accounting.superfluid.dev/v1/stream-periods`

**Query params:**
`chains` - **string** (chain ID-s separated by comma) <br />
`addresses` - **string** (addresses separated by comma) <br />
`start` - **number** (unix timestamp) <br />
`end` - **number** (unix timestamp) <br />
`priceGranularity` - **UnitOfTime** (timespan in seconds, only UnitOfTime values are accepted) <br />
`virtualization` - **UnitOfTime** (timespan in seconds, only UnitOfTime values are accepted) <br />
`currency` - **CurrencyCode** (ISO 3-Letter Currency Code) <br />
`counterparties` - **string** (addresses separated by comma). This field is optional. If no counterparties are provided, everyone will be selected <br />

**Example request**
```
https://accounting.superfluid.dev/v1/stream-periods?address=0xe38ffDD2B0B8bb7E93D409f4A282714b18B77980&chains=100%2C137%2C10%2C42161%2C43114%2C56&start=1638309600&end=1669845599&priceGranularity=86400&virtualization=2592000&currency=USD&counterparties=0x7BDa037dFdf9CD9Ad261D27f489924aebbcE71Ac%2C0x7269B0c7C831598465a9EB17F6c5a03331353dAF
```

*UnitOfTime* (use numerical value)
```
Second = 1
Minute = 60
Hour = 3600
Day = 86400
Week = 604800
Month = 2592000
Year = 31536000
```

*Supported currencies:*
```
USD
EUR
AUD
BRL
CAD
CHF
CNY
GBP
HKD
INR
JPY
KRW
MXN
NOK
RUB
SEK
```

### Swagger Documentation

**URL**
`https://accounting.superfluid.dev/v1/swagger`

### OpenAPI Configuration

**URL**
`https://accounting.superfluid.dev/static/api-docs.yaml`