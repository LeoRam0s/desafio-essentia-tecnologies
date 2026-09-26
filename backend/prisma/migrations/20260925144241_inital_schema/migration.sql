-- CreateTable
CREATE TABLE `tb_users` (
    `pk_user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(60) NOT NULL,

    UNIQUE INDEX `tb_users_pk_user_id_key`(`pk_user_id`),
    UNIQUE INDEX `tb_users_email_key`(`email`),
    PRIMARY KEY (`pk_user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_tasks` (
    `pk_task_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) NULL,
    `fk_user_id` VARCHAR(191) NOT NULL,
    `fk_priority_id` SMALLINT NOT NULL,
    `fk_status_id` SMALLINT NOT NULL,
    `due_date` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tb_tasks_pk_task_id_key`(`pk_task_id`),
    PRIMARY KEY (`pk_task_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_task_priority` (
    `pk_task_priority_id` SMALLINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `tb_task_priority_pk_task_priority_id_key`(`pk_task_priority_id`),
    PRIMARY KEY (`pk_task_priority_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_task_status` (
    `pk_task_status_id` SMALLINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `tb_task_status_pk_task_status_id_key`(`pk_task_status_id`),
    PRIMARY KEY (`pk_task_status_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tb_tasks` ADD CONSTRAINT `tb_tasks_fk_user_id_fkey` FOREIGN KEY (`fk_user_id`) REFERENCES `tb_users`(`pk_user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_tasks` ADD CONSTRAINT `tb_tasks_fk_priority_id_fkey` FOREIGN KEY (`fk_priority_id`) REFERENCES `tb_task_priority`(`pk_task_priority_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_tasks` ADD CONSTRAINT `tb_tasks_fk_status_id_fkey` FOREIGN KEY (`fk_status_id`) REFERENCES `tb_task_status`(`pk_task_status_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
