'use strict';

var activeRow = null;
var groupCleared = false;
var lessonInfoModal;
var globalAttributes = {};

const basicAttributesNames = ['teacher', 'reglament', 'day', 'order', 'numerator', 'status'];
const additionalAttributesNames = ['discipline', 'type', 'timestart', 'timeend', 'place', 'lesson', 'groups'];

window.addEventListener('load', function(evt) {
  lessonInfoModal = $('#lessonModal');
  lessonInfoModal.on('hidden.bs.modal', onHideModalHandler);
  $('.hidden-remove').on('click', onActivityRemoveBtnClickHandler);

  loadGroups(groupsList);
}, false);

function onChangeActivityClickHandler(evt) {
  let target = evt.target;
  activeRow = findParent(target, 'tr');
  var action = findParent(target, 'a').getAttribute('action'),
    title = (action === 'new') ? 'Додати заняття' : 'Редагувати заняття';

  document.getElementById('lessonForm').onsubmit = onSubmitActivityHandler;

  fillBasicInfo(title, action);
  console.log(action);
  if (action === 'edit') {
    fillAdditionalInfo();
  }

  lessonInfoModal.modal()[0];
}

var onActivityRemoveBtnClickHandler = function(evt) {
  if (confirm('Ви дійсно хочете видалити це заняття з регламенту?')) {
    let row = findParent(evt.target, 'tr');
    let lesson = row.getAttribute('lesson');
    let reglament = row.getAttribute('reglament');

    $.ajax({
      url: '/activity/delete',
      method: 'DELETE',
      data: {
        lesson: lesson,
        reglament: reglament
      },
      success: (data) => {
        location.reload();
      },
      error: (err) => {
        console.error('ERROR:', err);
      }
    });
  }
};

function onHideModalHandler(evt) {
  globalAttributes = {};
  document.getElementById('discipline').value = '';
  document.getElementById('place').value = '';

  let lessonType = document.getElementById('type');
  let timeStart = document.getElementById('timeStart');
  let timeEnd = document.getElementById('timeEnd');

  setSelectedFirstItem(lessonType);
  setSelectedFirstItem(timeStart);
  setSelectedFirstItem(timeEnd);
}

function setSelectedFirstItem(list) {
  if (list) {
    let value = list.children[0].value;

    list.value = value;
  }
}

function createNewActivity(data) {
  console.log('create new');
  console.log(data);

  return sendActivityRequest('/activity/new', 'POST', data);
}

function editActivity(data) {
  console.log('edit data');
  console.log(data);
  data.lesson = globalAttributes.lesson;

  return sendActivityRequest('/activity/edit', 'PUT', data);
}

function sendActivityRequest(url, method, data) {
  return new Promise((res, rej) => {
    // console.log('sending');
    $.ajax({
      method: method,
      url: url,
      data: data,
      success: (data) => {
        console.log('result data', data);
        res(data);
      },
      error: (err) => {
        rej(err);
      }
    });
  });
}

function onSubmitActivityHandler(evt) {
  evt.preventDefault();
  let form = evt.target;
  let data = collectLessonData(form);
  let action = globalAttributes.action;
  let resultPromise;

  // let fd = new FormData(form);

  // console.log('action', action);
  data.teacher = globalAttributes.teacher;
  data.reglament = globalAttributes.reglament;
  if (action === 'new') {
    resultPromise = createNewActivity(data);
  } else if (action === 'edit') {
    resultPromise = editActivity(data);
  }

  resultPromise
    .then((data) => {
      location.reload();
    })
    .catch((err) => {
      console.log(err);
    });
}

function collectLessonData(form) {
  let data = {};

  data.day = globalAttributes.day;
  data.order = globalAttributes.order;
  data.teacher = globalAttributes.teacher;
  data.timeStart = form.querySelector('#timestart').value;
  data.timeEnd = form.querySelector('#timeend').value;
  data.numerator = form.querySelector('#numerator').value;
  data.discipline = form.querySelector('#discipline').value;
  data.place = form.querySelector('#place').value;
  data.type = form.querySelector('#type').value;

  {
    let _groups = toArray(form.querySelectorAll('[name="groups"]'));
    console.log('groups', _groups);
    let groups = _groups ? _groups.map((group) => {
      let value = group.value;
      if (value && value.length) {
        return value;
      }
    }) : [];

    data.groups = groups;
  }

  return data;
}

function getBasicAttributesValue(row) {
  return getAttributesValue(globalAttributes, basicAttributesNames, row.attributes);
}

function getAdditionalAttributesValue(row) {
  return getAttributesValue(globalAttributes, additionalAttributesNames, row.attributes);
}

function getAttributesValue(attributes, attributesNames, rowAttributes) {
  // console.log(rowAttributes);
  attributesNames.forEach((name) => {
    attributes[name] = parseAttribute(rowAttributes[name], name);
  });
}

function parseAttribute(attributeNode, name) {
  // console.log(attributeNode);
  // let name = attributeNode.nodeName;
  let value = undefined;
  if (attributeNode) {
    value = attributeNode.nodeValue;
  }

  switch (name) {
    case 'day':
    case 'order':
    case 'numerator':
    case 'timestart':
    case 'timeend':
      return parseInt(value);
    case 'groups':
      return (value) ? value.split(',') : [];
    default:
      return value;
  }
}

function fillBasicInfo(title, action) {
  getBasicAttributesValue(activeRow);
  globalAttributes.row = activeRow;
  globalAttributes.action = action;

  if (lessonInfoModal) {
    let order = globalAttributes.order;
    lessonInfoModal.find('.modal-title').text(title);
    lessonInfoModal.find('#day').text(weekDays[globalAttributes.day]);
    lessonInfoModal.find('#teacherName').text(getTeacherFullName(globalAttributes.teacher));

    if (action === 'new') {
      setTimeLists(order, 0);
      setNumeratorList();
      createGroupList();
      enableDisciplineField(lessonInfoModal);
      enableGroupsList();
    }
  }

  // console.log(globalAttributes);
}

function fillAdditionalInfo() {
  getAdditionalAttributesValue(activeRow);
  let order = globalAttributes.order;
  console.log(globalAttributes);
  if (lessonInfoModal) {
    lessonInfoModal.find('#place').val(globalAttributes.place);
    lessonInfoModal.find('#discipline').val(globalAttributes.discipline);
    lessonInfoModal.find('#type').val(globalAttributes.type);
    setTimeLists(order, globalAttributes.timestart, globalAttributes.timeend);
    setNumeratorList();
    createGroupList(globalAttributes.groups);
    enableDisciplineField(lessonInfoModal);
    enableGroupsList();

    let lessonType = globalAttributes.type;
    if (lessonType === 'sci_work') {
      clearAndDisableGroupsList();
      disableDisciplineField(lessonInfoModal);
    } else if (lessonType === 'classHour') {
      disableDisciplineField(lessonInfoModal);
    }
  }

  // console.log(globalAttributes);
}

function getTeacherFullName(id) {
  let teacher;

  for (let i = 0, len = teachersData.length; i < len; i++) {
    let _teacher = teachersData[i];
    if (_teacher._id.toString() === id) {
      teacher = _teacher;
      break;
    }
  }

  return (teacher.lastName + ' ' + teacher.firstName + ' ' + teacher.fathersName);
}

function enableDisciplineField(modal) {
  let discipline = lessonInfoModal.find('#discipline');
  discipline.prop('disabled', '');
}

function disableDisciplineField(modal) {
  let discipline = lessonInfoModal.find('#discipline');
  discipline.val('').prop('disabled', 'disabled');
}

function setTimeLists(order, startTimeValue, endTimeValue) {
  let intervalList = extendedOrders[order];
  let intervalsNumber = intervalList.length;
  let timeStart = lessonInfoModal.find('#timestart')[0];
  let timeEnd = lessonInfoModal.find('#timeend')[0];
  if (!endTimeValue) {
    endTimeValue = intervalsNumber - 1;
  }

  let startTimeList = intervalList.slice(0, intervalsNumber - 1);
  let endTimeList = intervalList.slice(startTimeValue + 1, intervalsNumber);

  fillList(timeStart, startTimeList, 0, startTimeValue);
  fillList(timeEnd, endTimeList, startTimeValue + 1, endTimeValue);

  timeStart.addEventListener('change', onStartTimeChange, false);
  timeStart.setAttribute('order', order);
}

function setNumeratorList() {
  let list = lessonInfoModal.find('#numerator')[0];
  let numerator = globalAttributes.numerator;
  let possibleNumerators = {};

  if (numerator === -1) {
    fillList(list, numeratorsList);
    list.value = -1;
  } else {
    let row = globalAttributes.row;
    let sibling = (numerator === 0) ? row.nextElementSibling : sibling = row.previousElementSibling;
    let siblingStatus = sibling.getAttribute('status');

    if (siblingStatus === 'vacant') {
      fillList(list, numeratorsList);
      list.value = numerator;
    } else {
      possibleNumerators[numerator] = numeratorsList[numerator];
      fillList(list, possibleNumerators);
    }
  }
}

function getListValue(obj, text) {
  var value = '';
  for (var p in obj) {
    if (obj[p] == text) {
      value = p;
    }
  }

  return value;
}

function fillTypesList() {
  var list = document.getElementById('type'),
    types = [];
  removeAllNodes(list);
  for (var t in jobTypes) {
    types.push(createOption(t, jobTypes[t]));
  }

  append(types, list);
}

/**
 * @param {String} type - (all | numerator | denominator);
 * @param {Number} frequency - (-1 | 0 | 1) set current value of cell;
 */
function appendFrequencyList(type, frequency) {
  var select = document.createElement('select'),
    weekly = createOption(-1, 'Щотижня'),
    numerator = createOption(0, 'Чисельник'),
    denominator = createOption(1, 'Знаменник'),
    toAppend = [];
  $('#frequency').remove();
  select.className = 'form-control';
  select.name = 'numerator';
  select.form = 'lessonForm';
  select.id = 'frequency';
  if (type == 'all') {
    toAppend.push(weekly, numerator, denominator);
  } else if (type == 'numerator') {
    toAppend.push(numerator);
  } else if (type == 'denominator') {
    toAppend.push(denominator);
  }
  appendChildren(toAppend, select);
  $('.form-group.frequency label').append(select);

  select.value = frequency;
}

function onTypeChange(evt) {
  var value = evt.target.value;

  enableDisciplineField(lessonInfoModal);

  if (value === 'sci_work') {
    disableDisciplineField(lessonInfoModal);
    clearAndDisableGroupsList();
  } else {
    enableGroupsList();
    if (value === 'classHour') {
      disableDisciplineField(lessonInfoModal);
    }
  }
}

function enableFields(fields) {
  for (let i = 0, len = fields.length; i < len; i++) {
    fields[i].prop('disabled', '');
  }
}

function clearAndDisableGroupsList() {
  let groups = lessonInfoModal.find('#groups ul')[0];
  let children = groups.children;

  removeChildren(groups, 1);

  let groupItem = children[0];
  let itemChildren = groupItem.children;
  let groupsList = itemChildren[1];

  itemChildren[0].disabled = true; // group code input
  removeChildren(groupsList);
  groupsList.disabled = true; // select
  itemChildren[2].classList.add('hidden');
}

function enableGroupsList() {
  let groups = lessonInfoModal.find('#groups ul')[0];
  let item = groups.children[0];

  let itemChildren = item.children;
  itemChildren[0].disabled = false;
  let _groupsList = itemChildren[1];

  let addButtonClassList = itemChildren[2].classList;
  if (addButtonClassList.contains('hidden')) {
    addButtonClassList.remove('hidden');
  }

  _groupsList.disabled = false;
  if (groupsList) {
    fillList(_groupsList, groupsList);
  }
}

function createGroupList(_list) {
  let list = lessonInfoModal.find('#groups ul');
  let day = globalAttributes.day;
  let order = globalAttributes.order;
  list.attr({
    'day': day,
    'order': order
  });
  list.children().remove();

  if (_list) {
    list.append(createGroupItem(groupsList, day, order, false, _list[0]));
    for (let i = 1, len = _list.length; i < len; i++) {
      let groupItem = createGroupItem(groupsList, day, order, true, _list[i]);
      list.append(groupItem);
    }
  } else {
    let groupItem = createGroupItem(groupsList, day, order, false);
    list.append(groupItem);
  }
}