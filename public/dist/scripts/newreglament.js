'use strict';

var DEFAULT_ACTIVITY_TYPE = 'lecture';
var numberOfLessonCounter = null;

window.addEventListener('load', onWindowLoadHandler, false);

function addActivity(item, frequency) {
  var row = findParent(item, 'tr');
  fillActivityRow(row, frequency);
}

/**
 * Creates default activity row.
 */
function fillActivityRow(row, frequency) {
  var order = getOrder(row);
  var day = getDay(row);
  var nextRow = row.nextElementSibling;
  var prevRow = row.previousElementSibling;
  var numerator = getNumerator(row);
  var startIndex = numerator == 1 ? 0 : 1;

  if (!isVacant(row)) {
    return;
  }

  numberOfLessons.value = parseInt(numberOfLessons.value) + 1;
  setStatus(row, 'new');
  row.dataset.activity = DEFAULT_ACTIVITY_TYPE;
  row.onclick = null;

  removeChildren(row, startIndex);

  var timeCell = createTimeCell(day, order);
  var freqCell = createFreqCell(day, order, row);
  var typeCell = createJobTypeCell(day, order);
  var groupsCell = createGroupsCell(day, order);
  var discCell = createDisciplineCell(day, order);
  var placeCell = createPlaceCell(day, order);

  append([timeCell, freqCell, typeCell, groupsCell, discCell, placeCell], row);
  updateRate();
}

/**
 * Transform specified row into weekly row with all necessary params.
 */
function setRowAs(row, asWhat) {
  row.dataset.numerator = asWhat;
  if (asWhat === -1) {
    row.firstElementChild.rowSpan = 1;
  } else if (asWhat === 0) {
    row.firstElementChild.rowSpan = 2;
  }
}

/**
 * Remove srecific row and rebuild vacant places
 * @param {DOMobject} row - row that we need to remove
 */
function removeActivityRow(row, cb) {
  var numerator = getNumerator(row);
  var startIndex = numerator === 1 ? 0 : 1;
  var anotherRow = undefined;

  removeChildren(row, startIndex);
  if (numerator === 0) {
    anotherRow = row.nextElementSibling;
  } else if (numerator === 1) {
    anotherRow = row.previousElementSibling;
  }
  modifyVacantRowDisposition(row, anotherRow, numerator);
  numberOfLessons.value = parseInt(numberOfLessons.value) - 1;

  if ('function' === typeof cb) {
    cb();
  }
}

/**
 * Rebuild vacant cell appearance after removing.
 * @param {} row
 * @param {} anotherRow
 * @param {Number} numerator
 */
function modifyVacantRowDisposition(row, anotherRow, numerator) {
  var vacant = isVacant(anotherRow);
  var vacantCell = createVacantCell(row);

  setStatus(row, 'vacant');
  if (!vacant || numerator === -1) {
    row.appendChild(vacantCell);
  } else if (numerator === 0) {
    setRowAs(row, -1);
    row.appendChild(vacantCell);
    anotherRow.remove();
  } else {
    setRowAs(anotherRow, -1);
    row.remove();
  }

  return;
}

/**
 * Insert element after another.
 * @param {} element after which element need to insert
 * @param {} toInsert new element which should be inserted 
 */
function insertAfter(element, toInsert) {
  element.parentNode.insertBefore(toInsert, element.nextElementSibling);
}

/**
 * Transform activity row to vacant.
 */
function makeActivityVacant(row) {
  var numerator = getNumerator(row);
  var ac = createVacantCell(row);
  var startIndex = numerator === 1 ? 0 : 1;
  removeChildren(row, startIndex);
  setStatus(row, 'vacant');
  row.appendChild(ac);
}

function createVacantCell(row) {
  var cell = document.createElement('td');
  var numerator = getNumerator(row);
  var obj = {
    row: row,
    numerator: numerator
  };

  cell.colSpan = 6;
  cell.classList.add('activity-type');
  cell.innerHTML = '<i class="icon-plus"></i>';
  row.addEventListener('click', onCreateDefaultCellIconClickHandler.bind(obj), false);

  return cell;
}

function createEmptyRow(day, order, numerator) {
  var row = document.createElement('tr');
  var ds = row.dataset;
  var vacantCell;

  setStatus(row, 'vacant');
  ds.day = day;
  ds.order = order;
  ds.numerator = numerator;

  vacantCell = createVacantCell(row);
  row.appendChild(vacantCell);

  return row;
}

function setName(params) {
  return params.join('-');
}

function createSelect(name) {
  var select = document.createElement('select');
  select.name = name;
  select.className = 'form-control';

  return select;
}

function updateRate() {
  var startTimes = document.querySelectorAll('select[name="timeStart"]');
  var endTimes = document.querySelectorAll('select[name="timeEnd"]');
  var numerators = document.querySelectorAll('tr[data-status="new"]');
  var rateBox = document.getElementById('new-rate');
  var totalDuration = 0;
  var localRate, newRate;

  for (var i = 0, len = startTimes.length; i < len; i++) {
    localRate = parseInt(numerators[i].dataset.numerator) === -1 ? 1 : 0.5;
    totalDuration += (parseInt(endTimes[i].value) - parseInt(startTimes[i].value)) * localRate * 10;
  }

  newRate = Math.floor(totalDuration / 60 / 36 * 100) / 100;
  rateBox.textContent = newRate.toFixed(2);
}

/** BLOCK WITH TABLE COMPONENTS CREATION **/

function createFreqCell(day, order, row) {
  var cell = document.createElement('td');
  var name = 'numerator';
  var numerator = getNumerator(row);
  var prevRow = row.previousElementSibling;
  var nextRow = row.nextElementSibling;
  var selFreq = createSelect(name),
      options = [],
      value = -1,
      weeklyOption = createOption(-1, 'Т'),
      numeratorOption = createOption(0, 'Ч'),
      denominatorOption = createOption(1, 'З'),
      defOpts = [weeklyOption, numeratorOption, denominatorOption];

  cell.classList.add(name);

  if (numerator === -1 || numerator === 0 && !hasClass(nextRow, 'busy') || numerator === 1 && !hasClass(prevRow, 'busy')) {
    options.push(defOpts[0]);
    options.push(defOpts[1]);
    options.push(defOpts[2]);
  } else if (numerator === 0) {
    options.push(defOpts[1]);
  } else {
    options.push(defOpts[2]);
  }

  selFreq.addEventListener('change', onFrequencyChangeHandler, false);
  appendChildren(options, selFreq);
  selFreq.value = numerator;
  cell.appendChild(selFreq);

  return cell;
}

function createTimeCell(day, order) {
  var timeCell = document.createElement('td'),
      dayInput = createHiddenInput('days', day),
      orderInput = createHiddenInput('orders', order),
      timeStartSelect = document.createElement('select'),
      timeEndSelect = document.createElement('select');

  timeCell.classList.add('activity-time');

  timeStartSelect.name = 'timeStart';
  timeStartSelect.setAttribute('order', order);
  timeStartSelect.classList.add('form-control', 'lesson-time-list');
  timeStartSelect.addEventListener('change', onStartTimeChange, false);
  timeStartSelect.addEventListener('change', updateRate, false);

  timeEndSelect.name = 'timeEnd';
  timeEndSelect.classList.add('form-control', 'lesson-time-list');
  timeEndSelect.addEventListener('change', updateRate, false);

  fillList(timeStartSelect, extendedOrders[order].slice(0, extendedOrders[order].length - 1));
  fillList(timeEndSelect, extendedOrders[order].slice(1), 1);

  append([dayInput, orderInput, timeStartSelect, timeEndSelect], timeCell);

  timeEndSelect.value = String(extendedOrders[order].length - 1);

  return timeCell;
}

function createJobTypeCell(day, order) {
  var cell = document.createElement('td');
  var name = 'type';
  var groupsNumber = createHiddenInput('groups-number', 1);
  var list = createSelect(name);

  cell.className = 'activity-type';

  fillList(list, jobTypes);
  list.addEventListener('change', onJobTypeChangeHandler, false);
  append([list, groupsNumber], cell);

  return cell;
}

function isVacant(row) {
  return row && row.dataset.status === 'vacant';
}

/**
 *
 */
function createGroupsCell(day, order) {
  var cell = document.createElement('td');
  var list = document.createElement('ul');
  var item = createGroupItem(groupsList, day, order, false);

  list.dataset.day = day;
  list.dataset.order = order;

  cell.classList.add('groups');
  list.appendChild(item);
  append([list], cell);

  return cell;
}

function createDisciplineCell(day, order) {
  var cell = document.createElement('td');
  var disc = document.createElement('input');

  cell.classList.add('discipline');

  disc.name = 'discipline';
  disc.classList.add('form-control');
  disc.required = true;
  disc.placeholder = 'Назва дисципліни';

  cell.appendChild(disc);

  return cell;
}

function createPlaceCell(day, order) {
  var cell = document.createElement('td');
  var place = document.createElement('input');
  var removeIcon = createRemoveIcon();

  cell.className = 'place';
  place.name = 'place';
  place.className = 'form-control';
  place.required = true;

  append([place, removeIcon], cell);

  return cell;
}

function createRemoveIcon() {
  var icon = document.createElement('span');

  icon.classList.add('icon', 'icon-remove');
  icon.addEventListener('click', onRemoveActivityIconClickHandler, false);

  return icon;
}

/** EVENT HANDLERS **/

function onWindowLoadHandler(evt) {
  var year = document.getElementById('year');
  var reglamentForm = document.getElementById('newReglamentForm');
  numberOfLessonCounter = document.getElementById('numberOfLessons');

  document.getElementById('nextYear').textContent = parseInt(year.value) + 1;
  reglamentForm.addEventListener('submit', onSubmitFormHandler, false);
  year.addEventListener('change', onYearChangeHandler, false);
  setHandlersToVacantCells();
  loadGroups();
}

function onYearChangeHandler(evt) {
  var value = parseInt(evt.target.value);
  document.getElementById('nextYear').textContent = value + 1;
}

function onSubmitFormHandler(evt) {
  var places = document.querySelectorAll('[name="place"]');
  var disciplines = document.querySelectorAll('[name="discipline"]');
  var form = evt.target;
  var i, len;

  for (i = 0, len = places.length; i < len; i++) {
    var place = places[i];
    place.value = place.value.trim();
  }

  for (i = 0, len = disciplines.length; i < len; i++) {
    var discipline = disciplines[i];
    discipline.value = discipline.value.trim();
  }

  if (checkGroupsUniqueness(form).length !== 0) {
    evt.preventDefault();
  }
}

function checkGroupsUniqueness(form) {
  var lists = form.querySelectorAll('td.groups ul');
  var groups = [];
  var errorRows = [];
  var i, len, checked;

  for (i = 0, len = lists.length; i < len; i++) {
    var list = lists[i];
    var parentRow = findParent(list, 'tr');
    parentRow.classList.remove('groups-error');

    groups.push(getGroups(list));
    groups[i].parentRow = parentRow;
  }

  for (i = 0, len = groups.length; i < len; i++) {
    var gr = groups[i];
    var grlen = gr.length;
    checked = false;

    for (var j = 0; j < grlen; j++) {
      for (var k = j + 1; k < grlen; k++) {
        var group = gr[j];
        if (group && group === gr[k]) {
          errorRows.push(gr.parentRow);
          checked = true;
          break;
        }
      }

      if (checked) {
        break;
      }
    }
  }

  for (i = 0, len = errorRows.length; i < len; i++) {
    errorRows[i].classList.add('groups-error');
  }

  console.log(errorRows);

  return errorRows;
}

function getGroups(list) {
  var items = list.querySelectorAll('[name="groups"]');
  var groups = [];

  for (var i = 0, len = items.length; i < len; i++) {
    groups.push(items[i].value);
  }

  return groups;
}

function onFrequencyChangeHandler(evt) {
  var row = findParent(evt.target, 'tr');
  var day = getDay(row);
  var order = getOrder(row);
  var numerator = getNumerator(row);
  var value = parseInt(evt.target.value);
  var newWeeklyRow = row;
  var vacantCell, prevRow, nextRow;

  if (numerator === -1) {
    var newRow = createEmptyRow(day, order, 1);
    setRowAs(row, 0);
    insertAfter(row, newRow);

    if (value === 1) {
      switchRowsData(row, newRow);
    }
  } else if (numerator === 0) {
    nextRow = row.nextElementSibling;
    if (value === -1) {
      setRowAs(row, value);
      nextRow.remove();
    } else {
      switchRowsData(row, nextRow);
    }
  } else {
    prevRow = row.previousElementSibling;
    if (value === -1) {
      setRowAs(prevRow, value);
      switchRowsData(row, prevRow);
      row.remove();
    } else {
      switchRowsData(row, prevRow);
    }
  }

  updateRate();
}

function onJobTypeChangeHandler(evt) {
  var row = findParent(evt.target, 'tr');
  var value = evt.target.value;
  var type = row.dataset.activity;
  var numCell = row.querySelector('td.numerator');
  var hiddenDiscipline = numCell.querySelector('[name="discipline"]');
  var activityCell = row.querySelector('td.activity-type');
  var groupsNumber = activityCell.children[1];
  var groupCell, disciplineCell;
  var day = getDay(row);
  var order = getOrder(row);

  if (value === 'classHour') {
    groupCell = row.querySelector('td.groups');
    if (type === 'sci_work') {
      groupCell = createGroupsCell(day, order);
      activityCell.colSpan = 1;
      insertAfter(activityCell, groupCell);
      groupsNumber.value = 1;
    }
    groupCell.colSpan = 2;
    if (type !== 'sci_work') {
      disciplineCell = row.querySelector('td.discipline');
      disciplineCell.remove();
    }
    if (!hiddenDiscipline) {
      numCell.appendChild(createHiddenInput('discipline', ''));
    }
  } else if (value === 'sci_work') {
    groupCell = row.querySelector('td.groups');
    groupCell.remove();
    groupsNumber.value = 0;
    if (type !== 'classHour') {
      disciplineCell = row.querySelector('td.discipline');
      disciplineCell.remove();
    }
    activityCell.colSpan = 3;
    if (!hiddenDiscipline) {
      numCell.appendChild(createHiddenInput('discipline', ''));
    }
  } else {
    activityCell.colSpan = 1;
    disciplineCell = createDisciplineCell(day, order);
    if (type === 'sci_work') {
      groupCell = createGroupsCell(day, order);
      insertAfter(activityCell, groupCell);
      insertAfter(groupCell, disciplineCell);
      groupsNumber.value = 1;
    } else if (type === 'classHour') {
      groupCell = row.querySelector('td.groups');
      groupCell.colSpan = 1;
      insertAfter(groupCell, disciplineCell);
    }

    if (hiddenDiscipline) {
      hiddenDiscipline.remove();
    }
  }

  row.dataset.activity = value;
}

function onRemoveActivityIconClickHandler(evt) {
  var row = evt.target.parentNode.parentNode;
  removeActivityRow(row, function () {
    updateRate();
  });
}

function onCreateDefaultCellIconClickHandler(evt) {
  if (evt.target.matches('.icon-remove')) {
    return;
  }
  addActivity(this.row, this.numerator);
}

/** AUXILIARY FUNCTIONS **/

/**
 * Find numerator of the activity.
 */
function getNumerator(row) {
  return parseInt(row.dataset.numerator);
}

function getDay(element) {
  return parseInt(element.dataset.day);
}

function getOrder(element) {
  return parseInt(element.dataset.order);
}

function setStatus(row, status) {
  row.dataset.status = status;
}

function getStatus(row) {
  return row.dataset.status;
}

/**
 * Set basic event listeners on vacant cells according to rows' numerators.
 */
function setHandlersToVacantCells() {
  var weekly = toArray(document.querySelectorAll('tr[data-numerator="-1"][data-status="vacant"]'));
  var numerator = toArray(document.querySelectorAll('tr[data-numerator="0"][data-status="vacant"]'));
  var denominator = toArray(document.querySelectorAll('tr[data-numerator="1"][data-status="vacant"]'));
  var i, len, row;

  [].forEach.call(weekly, function (item) {
    item.onclick = function (evt) {
      addActivity(item, -1);
    };
  });

  [].forEach.call(numerator, function (item) {
    item.onclick = function (evt) {
      addActivity(item, 0);
    };
  });

  [].forEach.call(denominator, function (item) {
    item.onclick = function (evt) {
      addActivity(item, 1);
    };
  });
}

/**
 * Switch data between two rows.
 */
function switchRowsData(from, to) {
  var fromNumerator = getNumerator(from);
  var toNumerator = getNumerator(to);
  var startIndexFrom = fromNumerator === 1 ? 0 : 1;
  var startIndexTo = toNumerator === 1 ? 0 : 1;
  var fs = '[name="numerator"]';
  var fromFrequency = from.querySelector(fs);
  var toFrequency = to.querySelector(fs);
  var fromChildren = copyChildren(from, startIndexFrom);
  var toChildren = copyChildren(to, startIndexTo);
  var fromStatus = getStatus(from);
  var toStatus = getStatus(to);

  console.log(to, fromChildren, fromStatus, fromNumerator, toFrequency);
  console.log(from, toChildren, toStatus, toNumerator, fromFrequency);

  setDataToSwitchedRow(to, fromChildren, fromStatus, fromNumerator, toFrequency);
  setDataToSwitchedRow(from, toChildren, toStatus, toNumerator, fromFrequency);
}

function setDataToSwitchedRow(row, children, status, numerator, frequency) {
  var obj = {
    row: row,
    numerator: numerator
  };

  setStatus(row, status);
  if (frequency) {
    frequency.value = numerator;
  }
  if (status === 'vacant') {
    children.querySelector('td.activity-type').addEventListener('click', onCreateDefaultCellIconClickHandler.bind(obj), false);
  }
  row.appendChild(children);
}

/**
 * Copy children elements from some node with specific position.
 */
function copyChildren(from, startIndex, c) {
  var frag = document.createDocumentFragment();
  var children = from.children;
  var count = c ? c : children.length - startIndex;

  while (count--) {
    frag.appendChild(children[startIndex]);
  }

  return frag;
}

function createHiddenInput(name, value) {
  var element = document.createElement('input');
  element.type = 'hidden';
  element.name = name;
  element.value = value;

  return element;
}
