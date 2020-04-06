-- Define tables "projects", "db_version"
CREATE TABLE projects(
    id      SERIAL PRIMARY KEY  NOT NULL,
    name    TEXT                NOT NULL,
    taskIds TEXT                NOT NULL,
    users   TEXT                NOT NULL,
    owner   TEXT                NOT NULL
);

CREATE TABLE db_versions(
    version TEXT NOT NULL
);

-- Store version of the database scheme
INSERT INTO db_versions VALUES('001');