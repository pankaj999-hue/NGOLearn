CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`publicCode` varchar(32) NOT NULL,
	`payload` json,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_publicCode_unique` UNIQUE(`publicCode`)
);
--> statement-breakpoint
CREATE TABLE `learnerProfiles` (
	`userId` int NOT NULL,
	`timezone` varchar(64) NOT NULL DEFAULT 'UTC',
	`xp` int NOT NULL DEFAULT 0,
	`streak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastActiveDate` date,
	`freezes` int NOT NULL DEFAULT 1,
	`weeklyGoal` int NOT NULL DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learnerProfiles_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `lessonProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` varchar(64) NOT NULL,
	`lessonId` varchar(64) NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lessonProgress_id` PRIMARY KEY(`id`),
	CONSTRAINT `lessonProgress_user_lesson` UNIQUE(`userId`,`courseId`,`lessonId`)
);
--> statement-breakpoint
CREATE TABLE `userBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` varchar(64) NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userBadges_id` PRIMARY KEY(`id`),
	CONSTRAINT `userBadges_user_badge` UNIQUE(`userId`,`badgeId`)
);
--> statement-breakpoint
CREATE TABLE `xpEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(48) NOT NULL,
	`sourceKey` varchar(190) NOT NULL,
	`amount` int NOT NULL DEFAULT 0,
	`meta` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xpEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `xpEvents_user_event_source` UNIQUE(`userId`,`eventType`,`sourceKey`)
);
--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learnerProfiles` ADD CONSTRAINT `learnerProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lessonProgress` ADD CONSTRAINT `lessonProgress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userBadges` ADD CONSTRAINT `userBadges_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `xpEvents` ADD CONSTRAINT `xpEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;