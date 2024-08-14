BEGIN TRANSACTION;

ALTER TABLE projects ADD COLUMN josm_data_source TEXT;

-- Set default value to "Overpass" since it's the current behavior
UPDATE projects SET josm_data_source='OVERPASS';

INSERT INTO db_versions VALUES ('013');

END TRANSACTION;