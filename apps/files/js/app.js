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

	var App = {
		navigation: null,

		initialize: function() {
			this.navigation = new OCA.Files.Navigation($('#app-navigation'));

			// TODO: ideally these should be in a separate class / app (the embedded "all files" app)
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

			this._setupEvents();
			// trigger URL change event handlers
			this._onPopState();
		},

		/**
		 * Returns the container of the currently visible app.
		 *
		 * @return app container
		 */
		getCurrentAppContainer: function() {
			return this.navigation.getActiveContainer();
		},

		/**
		 * Setup events based on URL changes
		 */
		_setupEvents: function() {
			var self = this;

			// fallback to hashchange when no history support
			if (window.history.pushState) {
				window.onpopstate = _.bind(this._onPopState, this);
			}
			else {
				$(window).on('hashchange', _.bind(this._onPopState, this));
			}

			// detect when app changed their current directory
			$('#app-content>div').on('directoryChanged', _.bind(this._onDirectoryChanged, this));

			$('#app-navigation').on('itemChanged', _.bind(this._onNavigationChanged, this));
		},

		/**
		 * Event handler for when the current navigation item has changed
		 */
		_onNavigationChanged: function(e) {
			var params;
			if (e && e.itemId) {
				params = {
					view: e.itemId,
					dir: '/'
				};
				this._changeUrl(params.view, params.dir);
				this.navigation.getActiveContainer().trigger(new $.Event('urlChanged', params));
			}
		},

		/**
		 * Event handler for when an app notified that its directory changed
		 */
		_onDirectoryChanged: function(e) {
			if (e.dir) {
				this._changeUrl(this.navigation.getActiveItem(), e.dir);
			}
		},

		/**
		 * Parse the query/search part of the URL.
		 * Also try and parse it from the URL hash (for IE8)
		 *
		 * @return map of parameters
		 */
		_parseUrlQuery: function() {
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
			return params || {};
		},

		/**
		 * Event handler for when the URL changed
		 */
		_onPopState: function(e) {
			var params = _.extend({
				dir: '/',
				view: 'files'
			}, (e && e.state) || this._parseUrlQuery());

			var lastId = this.navigation.getActiveItem();
			this.navigation.setActiveItem(params.view, {silent: true});
			if (lastId !== this.navigation.getActiveItem()) {
				this.navigation.getActiveContainer().trigger(new $.Event('show'));
			}
			this.navigation.getActiveContainer().trigger(new $.Event('urlChanged', params));
		},

		/**
		 * Change the URL to point to the given dir and view
		 */
		_changeUrl: function(view, dir) {
			if (window.history.pushState) {
				var url = OC.linkTo('files', 'index.php') + '?dir=' + encodeURIComponent(dir).replace(/%2F/g, '/');
				if (view !== 'files') {
					url += '&view=' + encodeURIComponent(view);
				}
				window.history.pushState({dir: dir, view: view}, '', url);
			}
			// use URL hash for IE8
			else {
				var hash = '?dir='+ encodeURIComponent(dir).replace(/%2F/g, '/');
				if (view !== 'files') {
					hash += '&view=' + encodeURIComponent(view);
				}
				window.location.hash = hash;
			}
		}
	};
	OCA.Files.App = App;
})();

$(document).ready(function() {
	// wait for other apps/extensions to register their event handlers
	// in the "ready" close
	_.defer(function() {
		OCA.Files.App.initialize();
	});
});

