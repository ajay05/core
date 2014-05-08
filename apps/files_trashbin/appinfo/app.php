<?php
$l = OC_L10N::get('files_trashbin');

// register hooks
\OCA\Files_Trashbin\Trashbin::registerHooks();

\OCA\Files\App::getNavigationManager()->add(
	array(
		"appname" => 'files_trashbin',
		"script" => 'index.php',
		"order" => 1,
		"name" => $l->t('Deleted files')
	)
);
