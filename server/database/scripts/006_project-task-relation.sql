BEGIN TRANSACTION;

CREATE TABLE project_tasks(
    project_id  INT,
    task_id		INT,
    PRIMARY KEY (project_id, task_id),
    CONSTRAINT  fk_task
        FOREIGN KEY (task_id)
            REFERENCES tasks(id)
            ON DELETE CASCADE
);

INSERT INTO db_versions VALUES('006');

END TRANSACTION;