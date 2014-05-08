<?php
$l = OC_L10N::get('files_trashbin');

// register hooks
\OCA\Files_Trashbin\Trashbin::registerHooks();

\OCA\Files\App::getNavigationManager()->add(
	array(
		"appname" => 'files_trashbin',
		"path" => 'index.php',
		"order" => 1,
		"href" => OCP\Util::linkTo("files_trashbin", "index.php"),
		"name" => $l->t('Deleted files')
	)
);
