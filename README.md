# Superfluid accounting items

Accounting items aims to process the streaming data to a format that's easier to consume for traditional accounting tools. It takes a StreamPeriod and divides it into amounts streamed grouped by calendar days (`dailyAmounts`). StreamPeriod represents a period in a Stream where the flowRate remains constant. 

All the timestamps used in the project are in UTC.


## How It Works

1) Import getItems to your project:
```
const { getItems } = require('./index.js');
```
2) Query items
```
const accountingItems = getItems({ 
	address, // Address to get data for. Could be both sender and receiver of the stream.
	network, // matic, xDAI, testnets
	startTimestamp, // optional, could be all data. if endTimestamp defined it cannot be after the endTimestamp.
	endTimestamp // optional, could be all data
});
```

## Output format

```
[
{
  __typename: 'StreamPeriod',
  flowRate: '42438271604938',
  token: {
    __typename: 'Token',
    symbol: 'fDAIx',
    name: 'Super fDAI Fake Token',
    superTokenAddress: '0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00',
    underlyingAddress: '0x88271d333c72e51516b67f5567c728e702b3eee8'
  },
  sender: '0x0aff3384ef1299290a052b5b779bf6c231110841',
  receiver: '0x42d68d4e81087e43e70f6fd56be4ee356da3a3ac',
  startedAtTimestamp: '1617098929',
  startedAtBlockNumber: '4530830',
  stoppedAtTimestamp: '1618248567', // null if StreamPeriod is still ongoing
  stoppedAtBlockNumber: '4607379', // null if StreamPeriod is still ongoing
  totalAmountStreamed: '48788649691357712444', // null if StreamPeriod is still ongoing
  streamOpeningTxHash: '0x9fa9b6b066c2687282ca0020ac718297d421688950de7041d48abd06c84a2434',
  streamClosingTxHash: '0x67f9e6b35b5bc7d2b93be4dde32819d5daa96f8eaa43eea308fe4622a0a0e703',
  dailyAmounts: [
    {
      startTime: 1617098929, // startedAtTimestamp OR the limit defined by startTimestamp of the input if it's after startedAtTimestamp.
      endTime: 1617148800, // End of the first day (00:00 UTC). If this StreamPeriod would've started and ended within the same day this would be the stoppedAtTimestamp.
      quantityInToken: 2116439043209863000 // Streamed tokens during that time period
    },
    {
      startTime: 1617148800, // 00:00 UTC
      endTime: 1617235200, // 00:00 UTC the next day
      quantityInToken: 3666666666666643500
    },
    {
      startTime: 1617235200,
      endTime: 1617321600,
      quantityInToken: 3666666666666643500
    },
    {
      startTime: 1617321600,
      endTime: 1617408000,
      quantityInToken: 3666666666666643500
    },
    {
      startTime: 1617408000,
      endTime: 1617494400,
      quantityInToken: 3666666666666643500
    },
    {
      startTime: 1617494400,
      endTime: 1617580800,
      quantityInToken: 3666666666666643500
    },
    {
      startTime: 1617580800,
      endTime: 1617667200,
      quantityInToken: 3666666666666643500
    },
    {
      startTime: 1617667200,
      endTime: 1617753600,
      quantityInToken: 3666666666666643500
    },
    {
      startTime: 1617753600,
      endTime: 1617840000,
      quantityInToken: 3666666666666643500
    },
    {
      startTime: 1617840000,
      endTime: 1617926400,
      quantityInToken: 3666666666666643500
    },
    {
      startTime: 1617926400,
      endTime: 1618012800,
      quantityInToken: 3666666666666643500
    },
    {
      startTime: 1618012800,
      endTime: 1618099200,
      quantityInToken: 3666666666666643500
    },
    {
      startTime: 1618099200,
      endTime: 1618185600,
      quantityInToken: 3666666666666643500
    },
    {
      startTime: 1618185600,
      endTime: 1618248567, // stoppedAtTimestamp OR the endTimestamp if that's before stoppedAtTimestamp
      quantityInToken: 2672210648148131000
    }
  ]
}
  ...
]

```
