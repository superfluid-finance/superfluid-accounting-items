const periodSpanningDays_terminated = require("./mockResponses/streamPeriod_spanning3Days_terminated.json");
const periodWithinDay_terminated = require("./mockResponses/streamPeriod_withinDay_terminated.json");
const periodSpanning1Day_terminated = require("./mockResponses/streamPeriod_spanning1Day_terminated.json");

const assert = require("assert");

function dayAmountMappingTests() {
  it("should generate multiple dailyAmounts based on the timespan of the stream", async () => {
    // given
    const queryStreamPeriodsStub = sinon.stub();
    const getAccountingItems = proxyquire("../src/result-mapper", {
      "./superfluid-graph-client": {
        queryStreamPeriods: queryStreamPeriodsStub,
      },
    });
    queryStreamPeriodsStub.resolves(periodSpanningDays_terminated);

    // when
    // given the streamperiod span of 3 days it should account for 2 partial days and 1 full day
    const accountingItems = await getAccountingItems();

    // then
    assert.strictEqual(accountingItems[0].dailyAmounts.length, 3);
  });
  it("should generate a single dailyAmounts based on the timespan of the stream", async () => {
    // given
    const queryStreamPeriodsStub = sinon.stub();
    const getAccountingItems = proxyquire("../src/result-mapper", {
      "./superfluid-graph-client": {
        queryStreamPeriods: queryStreamPeriodsStub,
      },
    });
    queryStreamPeriodsStub.resolves(periodWithinDay_terminated);

    // when
    // given a StreamPeriod that starts and ends within a single day it should only create a single dailyAmount
    const accountingItems = await getAccountingItems();

    // then
    assert.strictEqual(accountingItems[0].dailyAmounts.length, 1);
  });
  it("should generate a single dailyAmounts based on the timespan of the stream", async () => {
    // given
    const queryStreamPeriodsStub = sinon.stub();
    const getAccountingItems = proxyquire("../src/result-mapper", {
      "./superfluid-graph-client": {
        queryStreamPeriods: queryStreamPeriodsStub,
      },
    });
    queryStreamPeriodsStub.resolves(periodSpanning1Day_terminated);

    // when
    // given a StreamPeriod that starts and ends within a single day it should only create a single dailyAmount
    const accountingItems = await getAccountingItems();

    // then
    assert.strictEqual(accountingItems[0].dailyAmounts.length, 2);
  });
}

module.exports = dayAmountMappingTests;
