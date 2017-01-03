'use strict';

var isCtrl = false;

function onGroupCodeKeypressHandler(evt) {
	var value = evt.target.value,
	    cc = evt.charCode,
	    kc = evt.keyCode,
	    ch = String.fromCharCode(evt.charCode);

	if (kc !== 8 && !isCtrl && (cc === 1105 || cc === 1031 || cc === 1111 || cc >= 1040 && cc <= 1103)) {
		value = value + ch;
	}
}

function onGroupCodeKeydownHandler(evt) {
	if (evt.keyCode == 17) {
		isCtrl = true;
	}
}

function onGroupCodeKeyupHandler(evt) {
	var target = evt.target;
	var value = target.value;
	var list = target.nextElementSibling;

	if (evt.keyCode === 17) {
		isCtrl = false;
	}

	removeAllNodes(list);
	_requestGroupList(value, function (data) {
		var groups = data.groups;
		var newValues = {};
		for (var i = 0, len = groups.length; i < len; i++) {
			var group = groups[i];
			newValues[group.name] = group.name;
		}
		fillList(list, newValues);
	});
}

function addDataToSelect(groups, select, value) {
	var options = [];
	removeAllNodes(select);
	for (var i = 0; i < groups.length; i++) {
		options.push(createOption(groups[i].name, groups[i].name));
	}
	if (options.length !== 0) {
		append(options, select);
		select.value = typeof value === 'undefined' ? options[0] : null;
	}
}
