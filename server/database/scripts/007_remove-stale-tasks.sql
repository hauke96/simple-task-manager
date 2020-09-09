BEGIN TRANSACTION;

DELETE FROM tasks WHERE NOT
(
    id = ANY
    (
        (
            SELECT array_agg(c) FROM
            (
                SELECT unnest(task_ids) FROM projects
            ) AS dt(c)
        )::INT[]
    )
);

INSERT INTO db_versions VALUES('007');

END TRANSACTION;