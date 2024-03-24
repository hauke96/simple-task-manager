BEGIN TRANSACTION;

CREATE TABLE comment_lists
(
	id SERIAL PRIMARY KEY NOT NULL
);

CREATE TABLE comments
(
	id              SERIAL PRIMARY KEY NOT NULL,
	comment_list_id INT                NOT NULL,
	text            TEXT               NOT NULL,
	creation_date   TIMESTAMP          NOT NULL,
	author_id       TEXT               NOT NULL
);

ALTER TABLE tasks ADD COLUMN comment_list_id INT;
ALTER TABLE projects ADD COLUMN comment_list_id INT;

ALTER TABLE tasks ADD FOREIGN KEY (comment_list_id) REFERENCES comment_lists;
ALTER TABLE projects ADD FOREIGN KEY (comment_list_id) REFERENCES comment_lists;
ALTER TABLE comments ADD FOREIGN KEY (comment_list_id) REFERENCES comment_lists;

INSERT INTO db_versions VALUES ('011');

END TRANSACTION;