BEGIN TRANSACTION;

ALTER TABLE projects DROP COLUMN task_ids;

INSERT INTO db_versions VALUES('009');

END TRANSACTION;