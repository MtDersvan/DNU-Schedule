'use strict';

var activeRow = null;
var groupCleared = false;
var lessonInfoModal;
var globalAttributes = {};

var basicAttributesNames = ['teacher', 'reglament', 'day', 'order', 'numerator', 'status'];
var additionalAttributesNames = ['discipline', 'type', 'timestart', 'timeend', 'place', 'lesson', 'groups'];

window.addEventListener('load', function (evt) {
  lessonInfoModal = $('#lessonModal');
  lessonInfoModal.on('hidden.bs.modal', onHideModalHandler);
  $('.hidden-remove').on('click', onActivityRemoveBtnClickHandler);

  loadGroups(groupsList);
}, false);

function onChangeActivityClickHandler(evt) {
  var target = evt.target;
  activeRow = findParent(target, 'tr');
  var action = findParent(target, 'a').getAttribute('action'),
      title = action === 'new' ? 'Додати заняття' : 'Редагувати заняття';

  document.getElementById('lessonForm').onsubmit = onSubmitActivityHandler;

  fillBasicInfo(title, action);
  console.log(action);
  if (action === 'edit') {
    fillAdditionalInfo();
  }

  lessonInfoModal.modal()[0];
}

var onActivityRemoveBtnClickHandler = function onActivityRemoveBtnClickHandler(evt) {
  if (confirm('Ви дійсно хочете видалити це заняття з регламенту?')) {
    var row = findParent(evt.target, 'tr');
    var lesson = row.getAttribute('lesson');
    var reglament = row.getAttribute('reglament');

    $.ajax({
      url: '/activity/delete',
      method: 'DELETE',
      data: {
        lesson: lesson,
        reglament: reglament
      },
      success: function success(data) {
        location.reload();
      },
      error: function error(err) {
        console.error('ERROR:', err);
      }
    });
  }
};

function onHideModalHandler(evt) {
  globalAttributes = {};
  document.getElementById('discipline').value = '';
  document.getElementById('place').value = '';

  var lessonType = document.getElementById('type');
  var timeStart = document.getElementById('timeStart');
  var timeEnd = document.getElementById('timeEnd');

  setSelectedFirstItem(lessonType);
  setSelectedFirstItem(timeStart);
  setSelectedFirstItem(timeEnd);
}

function setSelectedFirstItem(list) {
  if (list) {
    var value = list.children[0].value;

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
  return new Promise(function (res, rej) {
    // console.log('sending');
    $.ajax({
      method: method,
      url: url,
      data: data,
      success: function success(data) {
        console.log('result data', data);
        res(data);
      },
      error: function error(err) {
        rej(err);
      }
    });
  });
}

function onSubmitActivityHandler(evt) {
  evt.preventDefault();
  var form = evt.target;
  var data = collectLessonData(form);
  var action = globalAttributes.action;
  var resultPromise = void 0;

  // let fd = new FormData(form);

  // console.log('action', action);
  data.teacher = globalAttributes.teacher;
  data.reglament = globalAttributes.reglament;
  if (action === 'new') {
    resultPromise = createNewActivity(data);
  } else if (action === 'edit') {
    resultPromise = editActivity(data);
  }

  resultPromise.then(function (data) {
    location.reload();
  }).catch(function (err) {
    console.log(err);
  });
}

function collectLessonData(form) {
  var data = {};

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
    var _groups = toArray(form.querySelectorAll('[name="groups"]'));
    console.log('groups', _groups);
    var groups = _groups ? _groups.map(function (group) {
      var value = group.value;
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
  attributesNames.forEach(function (name) {
    attributes[name] = parseAttribute(rowAttributes[name], name);
  });
}

function parseAttribute(attributeNode, name) {
  // console.log(attributeNode);
  // let name = attributeNode.nodeName;
  var value = undefined;
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
      return value ? value.split(',') : [];
    default:
      return value;
  }
}

function fillBasicInfo(title, action) {
  getBasicAttributesValue(activeRow);
  globalAttributes.row = activeRow;
  globalAttributes.action = action;

  if (lessonInfoModal) {
    var order = globalAttributes.order;
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
  var order = globalAttributes.order;
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

    var lessonType = globalAttributes.type;
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
  var teacher = void 0;

  for (var i = 0, len = teachersData.length; i < len; i++) {
    var _teacher = teachersData[i];
    if (_teacher._id.toString() === id) {
      teacher = _teacher;
      break;
    }
  }

  return teacher.lastName + ' ' + teacher.firstName + ' ' + teacher.fathersName;
}

function enableDisciplineField(modal) {
  var discipline = lessonInfoModal.find('#discipline');
  discipline.prop('disabled', '');
}

function disableDisciplineField(modal) {
  var discipline = lessonInfoModal.find('#discipline');
  discipline.val('').prop('disabled', 'disabled');
}

function setTimeLists(order, startTimeValue, endTimeValue) {
  var intervalList = extendedOrders[order];
  var intervalsNumber = intervalList.length;
  var timeStart = lessonInfoModal.find('#timestart')[0];
  var timeEnd = lessonInfoModal.find('#timeend')[0];
  if (!endTimeValue) {
    endTimeValue = intervalsNumber - 1;
  }

  var startTimeList = intervalList.slice(0, intervalsNumber - 1);
  var endTimeList = intervalList.slice(startTimeValue + 1, intervalsNumber);

  fillList(timeStart, startTimeList, 0, startTimeValue);
  fillList(timeEnd, endTimeList, startTimeValue + 1, endTimeValue);

  timeStart.addEventListener('change', onStartTimeChange, false);
  timeStart.setAttribute('order', order);
}

function setNumeratorList() {
  var list = lessonInfoModal.find('#numerator')[0];
  var numerator = globalAttributes.numerator;
  var possibleNumerators = {};

  if (numerator === -1) {
    fillList(list, numeratorsList);
    list.value = -1;
  } else {
    var row = globalAttributes.row;
    var sibling = numerator === 0 ? row.nextElementSibling : sibling = row.previousElementSibling;
    var siblingStatus = sibling.getAttribute('status');

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
  for (var i = 0, len = fields.length; i < len; i++) {
    fields[i].prop('disabled', '');
  }
}

function clearAndDisableGroupsList() {
  var groups = lessonInfoModal.find('#groups ul')[0];
  var children = groups.children;

  removeChildren(groups, 1);

  var groupItem = children[0];
  var itemChildren = groupItem.children;
  var groupsList = itemChildren[1];

  itemChildren[0].disabled = true; // group code input
  removeChildren(groupsList);
  groupsList.disabled = true; // select
  itemChildren[2].classList.add('hidden');
}

function enableGroupsList() {
  var groups = lessonInfoModal.find('#groups ul')[0];
  var item = groups.children[0];

  var itemChildren = item.children;
  itemChildren[0].disabled = false;
  var _groupsList = itemChildren[1];

  var addButtonClassList = itemChildren[2].classList;
  if (addButtonClassList.contains('hidden')) {
    addButtonClassList.remove('hidden');
  }

  _groupsList.disabled = false;
  if (groupsList) {
    fillList(_groupsList, groupsList);
  }
}

function createGroupList(_list) {
  var list = lessonInfoModal.find('#groups ul');
  var day = globalAttributes.day;
  var order = globalAttributes.order;
  list.attr({
    'day': day,
    'order': order
  });
  list.children().remove();

  if (_list) {
    list.append(createGroupItem(groupsList, day, order, false, _list[0]));
    for (var i = 1, len = _list.length; i < len; i++) {
      var groupItem = createGroupItem(groupsList, day, order, true, _list[i]);
      list.append(groupItem);
    }
  } else {
    var _groupItem = createGroupItem(groupsList, day, order, false);
    list.append(_groupItem);
  }
}
