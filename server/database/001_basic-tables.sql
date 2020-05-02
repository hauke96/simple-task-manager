BEGIN TRANSACTION;

-- Define tables "projects", "tasks", "db_version"
CREATE TABLE projects(
    id          SERIAL PRIMARY KEY  NOT NULL,
    name        TEXT                NOT NULL,
    task_ids    TEXT                NOT NULL,
    users       TEXT                NOT NULL,
    owner       TEXT                NOT NULL
);

CREATE TABLE tasks(
    id                  SERIAL PRIMARY KEY NOT NULL,
    process_points      INT,
    max_process_points  INT,
    geometry            TEXT,
    assigned_user       TEXT
);

INSERT INTO db_versions VALUES('001');

END TRANSACTION;