/*
 * Copyright (c) 2014
 *
 * @author Vincent Petry
 * @copyright 2014 Vincent Petry <pvince81@owncloud.com>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {

	if (!OCA.Files) {
		OCA.Files = {};
	}

	function decodeQuery(query) {
		return query.replace(/\+/g, ' ');
	}

	function parseHashQuery() {
		var hash = window.location.hash,
			pos = hash.indexOf('?');
		if (pos >= 0) {
			return hash.substr(pos + 1);
		}
		return '';
	}

	function parseCurrentDirFromUrl() {
		var query = parseHashQuery(),
			params;
		// try and parse from URL hash first
		if (query) {
			params = OC.parseQueryString(decodeQuery(query));
		}
		// else read from query attributes
		if (!params) {
			params = OC.parseQueryString(decodeQuery(location.search));
		}
		return (params && params.dir) || '/';
	}

	var dir = parseCurrentDirFromUrl();
	var App = {
		navigation: null,

		initialize: function() {
			this.navigation = new OCA.Files.Navigation($('#app-navigation ul'));
			this.navigation.setSelectedItem('files');

			this.fileList = OCA.Files.FileList;
			this.fileActions = OCA.Files.FileActions;
			this.files = OCA.Files.Files;

			this.fileList = new OCA.Files.FileList($('#app-content-files'));
			this.files.initialize();
			this.fileActions.registerDefaultActions(this.fileList);
			this.fileList.setFileActions(this.fileActions);

			// for backward compatibility, the global FileList will
			// refer to the one of the "files" view
			window.FileList = this.fileList;

			this._initUrl();
		},

		_initUrl: function() {
			// disable ajax/history API for public app (TODO: until it gets ported)
			// fallback to hashchange when no history support
			if (!window.history.pushState) {
				$(window).on('hashchange', function() {
					App.fileList.changeDirectory(parseCurrentDirFromUrl(), false);
				});
			}
			window.onpopstate = function(e) {
				var targetDir;
				if (e.state && e.state.dir) {
					targetDir = e.state.dir;
				}
				else{
					// read from URL
					targetDir = parseCurrentDirFromUrl();
				}
				if (targetDir) {
					App.fileList.changeDirectory(targetDir, false);
				}
			};

			// trigger ajax load, deferred to let sub-apps do their overrides first
			setTimeout(function() {
				App.fileList.changeDirectory(dir, false, true);
			}, 0);
		}
	};
	OCA.Files.App = App;
})();

$(document).ready(function() {
	OCA.Files.App.initialize();
});

