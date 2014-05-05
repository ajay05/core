/*
 * Copyright (c) 2014 Vincent Petry <pvince81@owncloud.com>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */
/* global FileList, FileActions, FileSummary */
(function() {

	function initModule() {
		// for now until we have real inheritance...
		var FileList = window.FileList;
		var oldCreateRow = FileList._createRow;

		var SharedFileList = function($el) {
			this.initialize($el);
		}

		SharedFileList.prototype = _.extend({}, FileList, {
			appName: 'Shares',

			SHARE_TYPE_TEXT: [
				t('files_sharing', 'User'),
				t('files_sharing', 'Group'),
				t('files_sharing', 'Unknown'),
				t('files_sharing', 'Public')
			],

			_sharedWithUser: false,

			initialize: function($el) {
				if (this.initialized) {
					return;
				}

				// remove the default actions from the files app...
				FileActions.clear();

				this._sharedWithUser = false;

				this.$el = $el;
				this.files = [];
				// dummy for now as the parent class expects this
				this.breadcrumb = {
					setDirectory: function(){}
				};
				this._selectedFiles = {};
				this._selectionSummary = new FileSummary();

				this.fileSummary = this._createSummary();
			},

			/**
			 * Compare two shares
			 * @param share1 first share
			 * @param share2 second share
			 * @return 1 if share2 should come before share1, -1
			 * if share1 should come before share2, 0 if they
			 * are identical.
			 */
			_shareCompare: function(share1, share2) {
				var result = SharedFileList.protoype._fileInfoCompare(share1, share2);
				if (result === 0) {
					return share2.shareType - share1.shareType;
				}
				return result;
			},

			_createRow: function(fileData) {
				// TODO: hook earlier and render the whole row here
				var $tr = oldCreateRow.apply(this, arguments);
				$tr.find('.filesize').remove();
				var $sharedWith = $('<td class="sharedWith"></td>').text(fileData.shareWithDisplayName);
				var $shareType = $('<td class="shareType"></td>').text(this.SHARE_TYPE_TEXT[fileData.shareType] ||
					t('files_sharing', 'Unkown'));
				$tr.find('td.date').before($sharedWith).before($shareType);
				$tr.find('td.filename input:checkbox').remove();
				$tr.attr('data-path', fileData.path);
				return $tr;
			},

			/**
			 * Set whether the list should contain outgoing shares
			 * or incoming shares.
			 *
			 * @param state true for incoming shares, false otherwise
			 */
			setSharedWithUser: function(state) {
				this._sharedWithUser = !!state;
			},

			reload: function() {
				var self = this;
				this.showMask();
				if (this._reloadCall) {
					this._reloadCall.abort();
				}
				this._reloadCall = $.ajax({
					url: OC.linkToOCS('apps/files_sharing/api/v1') + 'shares',
					/* jshint camelcase: false */
					data: {
						format: 'json',
						shared_with_me: !!this._sharedWithUser
					},
					type: 'GET',
					beforeSend: function(xhr) {
						xhr.setRequestHeader('OCS-APIREQUEST', 'true');
					},
					error: function(result) {
						self.reloadCallback(result);
					},
					success: function(result) {
						self.reloadCallback(result);
					}
				});
			},

			reloadCallback: function(result) {
				delete this._reloadCall;
				this.hideMask();

				this.$el.find('#headerSharedWith').text(
					t('files_sharing', this._sharedWithUser ? 'Shared by' : 'Shared with')
				);
				if (result.ocs && result.ocs.data) {
					this.setFiles(this._makeFilesFromShares(result.ocs.data));
				}
				else {
					// TODO: error handling
				}
			},

			render: function() {
				var $el = $('<thead><tr>' +
						'<th>' + t('files', 'Name') + '</th>' +
						'<th>' + t('files', 'Shared with') + '</th>' +
						'<th>' + t('files', 'Type') + '</th>' +
						'<th>' + t('files', 'Shared since') + '</th>' +
						'</tr></thead>' +
						'<tbody class="fileList"></tbody>' +
						'<tfoot></tfoot>');

				this.$el.empty().append($el);
				this.$fileList = this.$el.find('tbody');
			},

			/**
			 * Converts the OCS API share response data to a file info
			 * list
			 * @param OCS API share array
			 * @return array of file info maps
			 */
			_makeFilesFromShares: function(data) {
				var self = this;
				// OCS API uses non-camelcased names
				/* jshint camelcase: false */
				var files = _.map(data, function(share) {
					var file = {
						id: share.id,
						mtime: share.stime * 1000,
						permissions: share.permissions
					};
					if (share.item_type === 'folder') {
						file.type = 'dir';
					}
					else {
						file.type = 'file';
						// force preview retrieval as we don't have mime types,
						// the preview endpoint will fall back to the mime type
						// icon if no preview exists
						file.isPreviewAvailable = true;
						file.icon = true;
					}
					file.shareType = share.share_type;
					file.shareWith = share.share_with;
					if (self._sharedWithUser) {
						file.shareWithDisplayName = share.displayname_owner;
						file.name = OC.basename(share.file_target);
						file.path = OC.dirname(share.file_target);
					}
					else {
						file.shareWithDisplayName = share.share_with_displayname;
						file.name = OC.basename(share.path);
						file.path = OC.dirname(share.path);
					}
					return file;
				});
				return files.sort(this._shareCompare);
			}
		});

		window.SharedFileList = SharedFileList;

		// TODO: move this to a separate file
		function initSharedList(sharedWithUser) {
			var list = new SharedFileList($('#filestable').empty());
			list.setSharedWithUser(sharedWithUser);
			list.render();
			list.reload();
			$('#controls').empty();
		}

		$('#filestable').on('initialized', function() {
			var $sharedButtons = $('<div class="sharedbuttons">' +
				'<input type="button" value="' + t('files_sharing', 'Shared with others') + '">' +
				'<input type="button" value="' + t('files_sharing', 'Shared with you') + '">' +
				'</div>'
			);
			// TODO: move to CSS file
			$sharedButtons.css('float', 'right');
			$('#controls .actions').append($sharedButtons);
			$sharedButtons.eq(0).on('click', function() {
				initSharedList(false);
			});
			$sharedButtons.eq(1).on('click', function() {
				initSharedList(true);
			});
		});
	}

	$(document).ready(function() {
		initModule();
	});

})();

