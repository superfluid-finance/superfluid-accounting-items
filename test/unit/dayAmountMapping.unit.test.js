const periodSpanningDays_terminated = require('./mockResponses/streamPeriod_spanning3Days_terminated.json');
const periodWithinDay_terminated = require('./mockResponses/streamPeriod_withinDay_terminated.json');
const periodSpanning1Day_terminated = require('./mockResponses/streamPeriod_spanning1Day_terminated.json');

const assert = require('assert');
const { getDailyAmounts } = require('../../src/result-mapper');

function dayAmountMappingTests() {
	it('should generate multiple valid dailyAmounts when the StreamPeriod is spanning over multiple days', () => {
		// given
		const startedAtTimestamp = 1628411351; // August 8, 2021 8:29:11 AM GMT
		const stoppedAtTimestamp = 1628587165; // August 10, 2021 9:19:25 AM GMT
		const flowRate = 1;

		const streamPeriodSpanningDays = {
			from: '0x321',
			to: '0x123',
			flowRate: flowRate.toString(),
			startedAtTimestamp: startedAtTimestamp.toString(),
			stoppedAtTimestamp: stoppedAtTimestamp.toString(),
		};

		// when
		// given the streamperiod span of 3 days it should account for 2 partial days and 1 full day
		const dailyAmounts = getDailyAmounts(streamPeriodSpanningDays);

		// then
		// with a flowRate of 1 the combined amount should be exactly as much as the time difference in seconds
		const august9StartOfTheDay = 1628467200; // August 9, 2021 00:00:00 GMT
		const august10StartOfTheDay = 1628553600; // August 10, 2021 00:00:00 GMT
		const streamedAmount = stoppedAtTimestamp - startedAtTimestamp;
		assert.strictEqual(dailyAmounts.length, 3);
		assert.strictEqual(
			streamedAmount,
			dailyAmounts.reduce((previousValue, dailyAmount) => previousValue + dailyAmount.quantityInToken, 0),
		);
		// Assert start/end timestamps
		assert.strictEqual(dailyAmounts[0].startTime, startedAtTimestamp);
		assert.strictEqual(dailyAmounts[0].endTime, august9StartOfTheDay);
		assert.strictEqual(dailyAmounts[1].startTime, august9StartOfTheDay);
		assert.strictEqual(dailyAmounts[1].endTime, august10StartOfTheDay);
		assert.strictEqual(dailyAmounts[2].startTime, august10StartOfTheDay);
		assert.strictEqual(dailyAmounts[2].endTime, stoppedAtTimestamp);
	});
	it('should generate a 1 dailyAmount for each partial calendar day based on the timespan of the stream', async () => {
		// given
		const startedAtTimestamp = 1628411351; // August 8, 2021 8:29:11 AM GMT
		const stoppedAtTimestamp = 1628511351; // August 9, 2021 12:15:51 PM GMT
		const flowRate = 1;

		const streamPeriodSpanningDays = {
			from: '0x321',
			to: '0x123',
			flowRate: flowRate.toString(),
			startedAtTimestamp: startedAtTimestamp.toString(),
			stoppedAtTimestamp: stoppedAtTimestamp.toString(),
		};

		// when
		// given the streamperiod span of 3 days it should account for 2 partial days and 1 full day
		const dailyAmounts = getDailyAmounts(streamPeriodSpanningDays);

		// then
		// with a flowRate of 1 the combined amount should be exactly as much as the time difference in seconds
		const august9StartOfTheDay = 1628467200; // August 9, 2021 00:00:00 GMT
		const streamedAmount = stoppedAtTimestamp - startedAtTimestamp;
		assert.strictEqual(dailyAmounts.length, 2);
		assert.strictEqual(
			streamedAmount,
			dailyAmounts.reduce((previousValue, dailyAmount) => previousValue + dailyAmount.quantityInToken, 0),
		);
		// Assert start/end timestamps
		assert.strictEqual(dailyAmounts[0].startTime, startedAtTimestamp);
		assert.strictEqual(dailyAmounts[0].endTime, august9StartOfTheDay);
		assert.strictEqual(dailyAmounts[1].startTime, august9StartOfTheDay);
		assert.strictEqual(dailyAmounts[1].endTime, stoppedAtTimestamp);
	});
	it('should generate a single valid dailyAmount when StreamPeriod starts and ends on the same calendar day', async () => {
		// given
		const startedAtTimestamp = 1628411351; // August 8, 2021 8:29:11 AM GMT
		const stoppedAtTimestamp = 1628418351; // August 8, 2021 10:25:51 AM GMT
		const flowRate = 1;

		const streamPeriodSpanningDays = {
			from: '0x321',
			to: '0x123',
			flowRate: flowRate.toString(),
			startedAtTimestamp: startedAtTimestamp.toString(),
			stoppedAtTimestamp: stoppedAtTimestamp.toString(),
		};

		// when
		// given the streamperiod span of 3 days it should account for 2 partial days and 1 full day
		const dailyAmounts = getDailyAmounts(streamPeriodSpanningDays);

		// then
		// with a flowRate of 1 the combined amount should be exactly as much as the time difference in seconds
		const streamedAmount = stoppedAtTimestamp - startedAtTimestamp;
		assert.strictEqual(dailyAmounts.length, 1);
		assert.strictEqual(
			streamedAmount,
			dailyAmounts.reduce((previousValue, dailyAmount) => previousValue + dailyAmount.quantityInToken, 0),
		);
    		// Assert start/end timestamps
		assert.strictEqual(dailyAmounts[0].startTime, startedAtTimestamp);
		assert.strictEqual(dailyAmounts[0].endTime, stoppedAtTimestamp);
	});
}

module.exports = dayAmountMappingTests;
