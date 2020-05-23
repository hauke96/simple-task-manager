BEGIN TRANSACTION;

ALTER TABLE projects ADD COLUMN task_id_array TEXT[] NOT NULL DEFAULT '{}';

-- Turn every "task_ids" field into an array and store it in "task_id_array"
UPDATE projects SET task_id_array=subquery.regexp_split_to_array FROM (SELECT id,(regexp_split_to_array(task_ids, ',')) FROM projects) AS subquery WHERE projects.id=subquery.id;


-- Remove the old "task_ids" and rename the new column
ALTER TABLE projects DROP COLUMN task_ids;
ALTER TABLE projects RENAME COLUMN task_id_array TO task_ids;

-- Same as above, now for the users:
ALTER TABLE projects ADD COLUMN user_array TEXT[] NOT NULL DEFAULT '{}';
UPDATE projects SET user_array=subquery.regexp_split_to_array FROM (SELECT id,(regexp_split_to_array(users, ',')) FROM projects) AS subquery WHERE projects.id=subquery.id;
ALTER TABLE projects DROP COLUMN users;
ALTER TABLE projects RENAME COLUMN user_array TO users;

INSERT INTO db_versions VALUES('003');

END TRANSACTION;