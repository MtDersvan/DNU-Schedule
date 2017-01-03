'use strict';

var groupsList = {};

/**
 * 
 */
function createGroupItem(groupsList, day, order, withRemove, defaultValue) {
  var item = document.createElement('li');
  var groupCode = document.createElement('input');
  var groupList = document.createElement('select');
  var itemIndex = document.querySelectorAll('[name^="gc-' + day + '-' + order + '"]').length;
  var listName = 'groups';

  groupCode.className = 'gc';
  groupList.name = listName;
  groupList.classList.add('form-control');
  fillList(groupList, groupsList);
  append([groupCode, groupList], item);

  groupCode.addEventListener('keypress', onGroupCodeKeypressHandler, false);
  groupCode.addEventListener('keydown', onGroupCodeKeydownHandler, false);
  groupCode.addEventListener('keyup', onGroupCodeKeyupHandler, false);

  if (withRemove) {
    var removeGroupBtn = createRemoveGroupBtn();
    item.insertBefore(removeGroupBtn, item.firstChild);
  } else {
    var addGroupBtn = createAddGroupBtn();
    item.appendChild(addGroupBtn);
  }

  if (defaultValue) {
    groupList.value = defaultValue;
  }

  return item;
}

function createAddGroupBtn() {
  var btn = document.createElement('span');

  btn.classList.add('icon', 'icon-plus', 'right');
  btn.addEventListener('click', onAddGroupClickHandler, false);

  return btn;
}

function createRemoveGroupBtn() {
  var btn = document.createElement('span');

  btn.classList.add('icon', 'icon-remove', 'left');
  btn.addEventListener('click', onRemoveGroupBtnHandler, false);

  return btn;
}

function onAddGroupClickHandler(evt) {
  var item = evt.target.parentNode;
  var list = item.parentNode;
  var day = parseInt(list.getAttribute('day'));
  var order = parseInt(list.getAttribute('order'));
  var newItem = createGroupItem(groupsList, day, order, true);

  var row = findParent(list, 'tr');
  if (row) {
    var countBox = row.querySelector('td.activity-type').children[1];
    countBox.value = parseInt(countBox.value) + 1;
  }

  list.appendChild(newItem);
}

function onRemoveGroupBtnHandler(evt) {
  var item = evt.target.parentNode;
  var list = item.parentNode;

  var row = findParent(list, 'tr');
  if (row) {
    var countBox = row.querySelector('td.activity-type').children[1];
    countBox.value = parseInt(countBox.value) - 1;
  }

  list.removeChild(item);
}

function loadGroups() {
  _requestGroupList('', function (data) {
    var groups = data.groups;


    if (groups) {
      groups.forEach(function (group) {
        var groupName = group.name;

        groupsList[groupName] = groupName;
      });
    }
  });
}

/**
 * @param {function} cb - success callback
 */
function _requestGroupList(value, success) {
  $.ajax('/groups', {
    method: 'GET',
    data: {
      groupName: value
    },
    success: success,
    error: function error(err) {
      console.log('ERROR!', err);
    }
  });
}
