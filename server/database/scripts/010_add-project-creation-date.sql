BEGIN TRANSACTION;

-- Can be null for old data before adding this column
ALTER TABLE projects ADD COLUMN creation_date TIMESTAMP;

INSERT INTO db_versions VALUES('010');

END TRANSACTION;