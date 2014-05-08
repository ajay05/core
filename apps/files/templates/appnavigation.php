<div id="app-navigation">
	<ul>
		<li class="nav-allfiles"><a href="<?php p(OC_Helper::linkTo('files', '')) ?>"><?php p($l->t('All Files'));?></a></li>
		<li class="sep"></li>
		<?php foreach ($_['navigationItems'] as $item) { ?>
		<li class="nav-<?php p($item['appname']) ?>"><a href="<?php p(OC_Helper::linkTo($item['appname'], $item['path'])) ?>"><?php p($item['name']);?></a></li>
		<?php } ?>
	</ul>
	<div id="app-settings">
		<div id="app-settings-header">
			<button class="settings-button"></button>
		</div>
		<div id="app-settings-content">
				<h2><?php p($l->t('WebDAV'));?></h2>
				<div><input id="webdavurl" type="text" readonly="readonly" value="<?php p(OC_Helper::linkToRemote('webdav')); ?>"></input></div>
				<em><?php print_unescaped($l->t('Use this address to <a href="%s" target="_blank">access your Files via WebDAV</a>', array(link_to_docs('user-webdav'))));?></em>
		</div>
	</div>
</div>
