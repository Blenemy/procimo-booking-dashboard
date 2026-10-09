-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `sport_type` ENUM('PADEL', 'TENNIS', 'SQUASH', 'PICKLEBALL') NOT NULL,
    `hourly_price_cents` INTEGER NOT NULL,
    `open_hour` INTEGER NOT NULL,
    `close_hour` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `court_id` INTEGER NOT NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `duration_hours` INTEGER NOT NULL,
    `status` ENUM('CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    `total_price_cents` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cancelled_at` DATETIME(3) NULL,

    INDEX `bookings_user_id_starts_at_idx`(`user_id`, `starts_at`),
    INDEX `bookings_court_id_starts_at_idx`(`court_id`, `starts_at`),
    INDEX `bookings_starts_at_idx`(`starts_at`),
    UNIQUE INDEX `bookings_id_court_id_key`(`id`, `court_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_slots` (
    `court_id` INTEGER NOT NULL,
    `slot_start` DATETIME(3) NOT NULL,
    `booking_id` INTEGER NOT NULL,

    INDEX `booking_slots_booking_id_court_id_idx`(`booking_id`, `court_id`),
    PRIMARY KEY (`court_id`, `slot_start`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_court_id_fkey` FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_slots` ADD CONSTRAINT `booking_slots_booking_id_court_id_fkey` FOREIGN KEY (`booking_id`, `court_id`) REFERENCES `bookings`(`id`, `court_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE `courts`
    ADD CONSTRAINT `courts_opening_hours_check` CHECK (`open_hour` >= 0 AND `open_hour` < `close_hour` AND `close_hour` <= 24),
    ADD CONSTRAINT `courts_hourly_price_check` CHECK (`hourly_price_cents` >= 0);

-- AddCheckConstraint
ALTER TABLE `bookings`
    ADD CONSTRAINT `bookings_duration_check` CHECK (`duration_hours` IN (1, 2)),
    ADD CONSTRAINT `bookings_ends_at_check` CHECK (`ends_at` = `starts_at` + INTERVAL `duration_hours` HOUR),
    ADD CONSTRAINT `bookings_total_price_check` CHECK (`total_price_cents` >= 0),
    ADD CONSTRAINT `bookings_cancelled_at_check` CHECK ((`status` = 'CANCELLED') = (`cancelled_at` IS NOT NULL));

-- AddCheckConstraint
ALTER TABLE `booking_slots`
    ADD CONSTRAINT `booking_slots_hour_aligned_check` CHECK (MINUTE(`slot_start`) = 0 AND SECOND(`slot_start`) = 0 AND MICROSECOND(`slot_start`) = 0);
