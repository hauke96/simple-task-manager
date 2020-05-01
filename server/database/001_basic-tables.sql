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

CREATE TABLE db_versions(
    version TEXT NOT NULL
);

-- Store version of the database scheme
INSERT INTO db_versions VALUES('001');