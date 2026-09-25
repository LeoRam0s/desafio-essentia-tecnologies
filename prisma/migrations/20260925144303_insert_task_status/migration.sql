-- This is an empty migration.
INSERT INTO `tb_task_status`
    (`pk_task_status_id`, `name`, `description`)
VALUES
    (1, 'To do', 'Task waiting to be started'),
    (2, 'Doing', 'Task currently in progress'),
    (3, 'Completed', 'Task has been completed');
