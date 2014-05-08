/*
 * Copyright (c) 2014
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {

	var Files = _.extend({}, OCA.Files.Files, {
		updateStorageStatistics: function() {
			// no op because the trashbin doesn't have
			// storage info like free space / used space
		},

		generatePreviewUrl: function(urlSpec) {
			return OC.generateUrl('/apps/files_trashbin/ajax/preview.php?') + $.param(urlSpec);
		},

		getDownloadUrl: function(action, params) {
			// no downloads
			return '#';
		}
	});

	OCA.Trashbin.Files = Files;
})();

