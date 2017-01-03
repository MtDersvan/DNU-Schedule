'use strict';

const path = require('path');
const excelbuilder = require('msexcel-builder');
const regUtils = require('../utils');
const regSettings = require('../regsettings');
const {
  timeOrders,
  weekDays,
  extendedOrders,
  jobTypes
} = regSettings;
const timeOffset = extendedOrders[0].length;
const generalHeader = [
  'МІНІСТЕРСТВО ОСВІТИ ТА НАУКИ УКРАЇНИ ',
  'ДНІПРОПЕТРОВСЬКИЙ НАЦІОНАЛЬНИЙ УНІВЕРСИТЕТ',
  'імені Олеся Гончара',
  '------------------------',
  'Регламент',
  'роботи науково-педагогічного складу кафедри комп’ютерних технологій'
];
const dayHeaderMeta = ['№', 'Час', 'Вид роботи', 'Місце роботи'];

function build(data) {
  const {
    year,
    semester,
    filepath,
    filename,
    workplans
  } = data;
  generalHeader.push(`на ${semester} семестр ${year} | ${year + 1} навчального року`);
  const dhml = dayHeaderMeta.length;
  const wdl = weekDays.length;
  const tol = timeOrders.length;

  const workbook = excelbuilder.createWorkbook(filepath, filename);
  const colsCount = wdl * dhml + 2; // 2 - for teacher info and teacher work info
  const rowsCount = generalHeader.length + workplans.length * (timeOrders.length * 2 + 1) + 4; // 4 - for table header and open topic row
  let currentRow = 1;

  const mainSheet = workbook.createSheet('Загальний регламент', colsCount, rowsCount);

  generalHeader.forEach((line) => {
    mainSheet.merge(_cell(currentRow, 1), _cell(currentRow, colsCount));
    currentRow = setValue(mainSheet, 1, currentRow, line);
  });

  mainSheet.merge(_cell(currentRow, 1), _cell(currentRow + 2, 1));
  setValue(mainSheet, 1, currentRow, 'Призвіще, ім’я, по-батькові, посада та телефон');

  mainSheet.merge(_cell(currentRow, 2), _cell(currentRow, colsCount - 1));
  setValue(mainSheet, 2, currentRow, 'ДНІ ТИЖНЯ');

  mainSheet.merge(_cell(currentRow, colsCount), _cell(currentRow + 2, colsCount));
  currentRow = setValue(mainSheet, colsCount, currentRow, 'Робочий час');

  let col = 2;
  weekDays.forEach(day => {
    mainSheet.merge(_cell(currentRow, col), _cell(currentRow, col + 3));
    setValue(mainSheet, col, currentRow, day);
    col += 4;
  });

  currentRow += 1;
  col = 2;
  dayHeaderMeta.forEach((item, itemIndex) => {
    weekDays.forEach((day, dayIndex) => {
      setValue(mainSheet, col + itemIndex + dayIndex * dhml, currentRow, item);
    });
  });

  currentRow += 1;
  workplans.forEach(workplan => {
    const {
      teacher,
      reglament
    } = workplan;
    const activities = reglament.activity;
    const {
      openLesson
    } = reglament;
    let col = 1;
    let finishRow = currentRow + tol * 2;

    mainSheet.merge(_cell(currentRow, col), _cell(finishRow, col));
    setValue(mainSheet, col, currentRow, teacher.getInfo());

    const durations = countDuration(reglament);
    const durationsStr = buildDurationsStr(durations);
    mainSheet.merge(_cell(currentRow, colsCount), _cell(finishRow, colsCount));
    setValue(mainSheet, colsCount, currentRow, durationsStr);

    let tempColIndex = col + 1;
    let tempRowIndex = currentRow;
    weekDays.forEach((day, dayIndex) => {
      timeOrders.forEach((order, orderIndex) => {
        const orderNumberColIndex = tempColIndex + dayIndex * dhml;
        const startRow = tempRowIndex + orderIndex * 2;
        const endRow = startRow + 1;

        mainSheet.merge(_cell(startRow, orderNumberColIndex), _cell(endRow, orderNumberColIndex));
        setValue(mainSheet, orderNumberColIndex, startRow, orderIndex + 1);

        let localActivities = [];

        const firstActivityIndex = activities.findIndex(_findActivity(dayIndex, orderIndex));
        if (firstActivityIndex !== -1) {
          localActivities.push(activities[firstActivityIndex]);

          const activitiesPiece = activities.slice(firstActivityIndex + 1);
          const secondActivityIndex = activitiesPiece.findIndex(_findActivity(dayIndex, orderIndex));

          if (secondActivityIndex !== -1) {
            localActivities.push(activitiesPiece[secondActivityIndex]);
          }
        }

        const timeColIndex = orderNumberColIndex + 1;

        if (!localActivities.length) {
          mainSheet.merge(_cell(startRow, timeColIndex), _cell(endRow, timeColIndex));
          setValue(mainSheet, timeColIndex, startRow, timeOrders[orderIndex]);

          const infoCol = timeColIndex + 1;
          const placeCol = infoCol + 1;
          mainSheet.merge(_cell(startRow, infoCol), _cell(endRow, placeCol));
        } else if (localActivities.length === 1) {
          const activity = localActivities[0];
          const {
            numerator
          } = activity;

          if (numerator === -1) {
            mainSheet.merge(_cell(startRow, timeColIndex), _cell(endRow, timeColIndex));
            fillActivityCell(mainSheet, startRow, timeColIndex, activity);
          } else if (numerator === 0) {
            fillActivityCell(mainSheet, startRow, timeColIndex, activity);
          } else {
            fillActivityCell(mainSheet, endRow, timeColIndex, activity);
          }
        } else {
          localActivities.forEach(activity => {
            fillActivityCell(mainSheet, startRow + activity.numerator, timeColIndex, activity, true);
          });
        }
      });
    });

    currentRow = finishRow;
    mainSheet.merge(_cell(currentRow, 2), _cell(currentRow, colsCount - 1));
    setValue(mainSheet, 2, currentRow, `ТЕМА ВІДКРИТОГО ЗАНЯТТЯ: ${openLesson || ''}`);
    mainSheet.align(2, currentRow, 'left');
    
    currentRow += 1;
  });


  return workbook;
}

function fillActivityCell(sheet, row, col, activity, both) {
  const {
    order,
    timeStart,
    timeEnd,
    type,
    groups,
    place,
    discipline,
    numerator
  } = activity;
  const orderTimes = extendedOrders[order];
  const timeStr = `${ orderTimes[timeStart]} - ${orderTimes[timeEnd] }`;
  const infoStr = `${ discipline ? (discipline + '\n') : ''}${jobTypes[type]}\n${ groups ? groups.join(',') : '' }`;
  const placeStr = `${ place }`;

  setValue(sheet, col, row, timeStr);

  const infoCol = col + 1;
  setValue(sheet, infoCol, row, infoStr);

  const placeCol = infoCol + 1;
  setValue(sheet, placeCol, row, placeStr);

  if (!both) {
    if (numerator === 0) {
      sheet.merge(_cell(row + 1, infoCol), _cell(row + 1, placeCol));
      setValue(sheet, col, row + 1, timeOrders[order]);
    } else if (numerator === 1) {
      sheet.merge(_cell(row - 1, infoCol), _cell(row - 1, placeCol));
      setValue(sheet, col, row - 1, timeOrders[order]);
    } else {
      sheet.merge(_cell(row, infoCol), _cell(row + 1, infoCol));
      sheet.merge(_cell(row, placeCol), _cell(row + 1, placeCol));
    }
  }
}

function _findActivity(day, order) {
  return (activity) => (activity.day === day && activity.order === order);
}

function _cell(row, col) {
  return {
    row,
    col
  };
}

function setValue(sheet, col, row, value) {
  sheet.set(col, row, value);
  sheet.align(col, row, 'center');
  sheet.valign(col, row, 'center');
  sheet.wrap(col, row, true);

  return row + 1;
}

function countDuration(reglament) {
  const durations = {
    total: 0
  };
  const activities = reglament.activity;

  activities.forEach(activity => {
    const { day, timeStart, timeEnd, numerator } = activity;

    if (!durations[day]) {
      durations[day] = 0;
    }

    const value = ((timeEnd - timeStart) * timeOffset) * (numerator === -1 ? 1 : .5);

    durations[day] += value;
    durations.total += value;
  });

  return durations;
}

function buildDurationsStr(durations) {
  const times = [];

  weekDays.forEach((day, dayIndex) => {
    const duration = durations[dayIndex] || 0;
    const time = regUtils.convertTime(duration);

    times.push(`${day}: ${time};`);
  });

  times.push(`Загальний: ${regUtils.convertTime(durations.total)}.`);

  const str = times.join('\n');

  return str;
}

module.exports = build;