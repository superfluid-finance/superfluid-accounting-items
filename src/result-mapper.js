const { queryStreamPeriods } = require("./superfluid-graph-client");
const moment = require("moment");

async function getAccountingItems(
  address,
  network,
  startTimestamp,
  endTimestamp
) {
  const streamPeriods = await queryStreamPeriods();
  return getPeriodsWithDailyAmounts(streamPeriods);
}

function getPeriodsWithDailyAmounts(streamPeriods) {
  return streamPeriods.map((s) => ({ ...s, dailyAmounts: getDailyAmounts(s) }));
}

function getDailyAmounts(streamPeriod) {
  const isStreamTerminated = !!streamPeriod.streamStopTime;

  const startMoment = moment.unix(streamPeriod.streamStartTime).utc();
  const endMoment = isStreamTerminated
    ? moment.unix(streamPeriod.streamStopTime).utc()
    : moment().unix().utc();

  const dailyAmounts = calculateDailyAmounts(
    startMoment,
    endMoment,
    streamPeriod.flowRate
  );

  return dailyAmounts;
}

function calculateDailyAmounts(startMoment, endMoment, flowRate) {
  const dailyAmounts = [];
  const initialStartTime = startMoment;

  const nextDayStart = startMoment.clone().add(1, "days").startOf("day");
  const spansDays = endMoment.isAfter(nextDayStart);

  const firstDailyAmount = getFirstDailyAmount(
    initialStartTime.clone(),
    endMoment.clone(),
    spansDays,
    flowRate
  );
  dailyAmounts.push(firstDailyAmount);

  if (!spansDays) {
    return dailyAmounts;
  }

  const {
    fullDayAmounts,
    lastEndTime: nextStartTime,
  } = calculateDailyAmountsForFullDaysBetween(
    moment.unix(firstDailyAmount.endTime).utc(),
    endMoment.clone(),
    flowRate
  );

  const lastDailyAmount = getLastDailyAmount(
    nextStartTime,
    endMoment,
    flowRate
  );

  dailyAmounts.push(...fullDayAmounts, lastDailyAmount);
  return dailyAmounts;
}

function getFirstDailyAmount(startMoment, endMoment, spansDays, flowRate) {
  // If stream period spans for days the stop time for a given daily amount
  // is the start of next day, otherwise the end of streamperiod
  const firstEndTime = spansDays
    ? startMoment.clone().add(1, "days").startOf("day")
    : endMoment;
  const firstTokenQuantity = getFlowedTokenQuantityBetween(
    startMoment,
    firstEndTime,
    flowRate
  );
  return createDailyAmount(startMoment, firstEndTime, firstTokenQuantity);
}

function getLastDailyAmount(lastStartTime, endMoment, flowRate) {
  const quantityInToken = getFlowedTokenQuantityBetween(
    lastStartTime,
    endMoment,
    flowRate
  );
  return createDailyAmount(lastStartTime, endMoment, quantityInToken);
}

function calculateDailyAmountsForFullDaysBetween(
  startMoment,
  endMoment,
  flowRate
) {
  let startOfNextFullDay = startMoment.clone().add(1, "days").startOf("day");
  const fullDayAmounts = [];
  while (
    endMoment.isAfter(startOfNextFullDay) ||
    endMoment.isSame(startOfNextFullDay)
  ) {
    const startTime = startOfNextFullDay
      .clone()
      .subtract(1, "days")
      .startOf("day");
    const endTime = startOfNextFullDay.clone();
    const quantityInToken = getFlowedTokenQuantityBetween(
      startTime,
      endTime,
      flowRate
    );

    startOfNextFullDay = startOfNextFullDay.add(1, "days").startOf("day");
    fullDayAmounts.push(createDailyAmount(startTime, endTime, quantityInToken));
  }
  return {
    fullDayAmounts,
    lastEndTime:
      fullDayAmounts.length > 0
        ? moment.unix(fullDayAmounts.at(-1).endTime).utc()
        : startMoment,
  };
}

function createDailyAmount(startTime, endTime, quantityInToken) {
  return {
    startTime: startTime.unix(),
    endTime: endTime.unix(),
    quantityInToken,
  };
}

function getFlowedTokenQuantityBetween(startTime, endTime, flowRate) {
  return endTime.diff(startTime, "seconds") * flowRate;
}

module.exports = getAccountingItems;
