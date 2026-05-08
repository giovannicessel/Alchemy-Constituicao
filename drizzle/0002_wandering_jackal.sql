CREATE TABLE `userFlashcardReview` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`flashcardId` int NOT NULL,
	`easeFactor` int NOT NULL DEFAULT 250,
	`intervalDays` int NOT NULL DEFAULT 0,
	`repetitions` int NOT NULL DEFAULT 0,
	`lapses` int NOT NULL DEFAULT 0,
	`lastGrade` int NOT NULL DEFAULT 0,
	`dueAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userFlashcardReview_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userQuestionAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`chapterId` int NOT NULL,
	`articleNumber` int,
	`examBoard` varchar(64),
	`theme` varchar(120),
	`selectedAnswer` varchar(1) NOT NULL,
	`correctAnswer` varchar(1) NOT NULL,
	`isCorrect` int NOT NULL,
	`elapsedMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userQuestionAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `flashcards` ADD `cardType` varchar(64);--> statement-breakpoint
ALTER TABLE `flashcards` ADD `difficulty` enum('easy','medium','hard') DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE `flashcards` ADD `qualityScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `quizQuestions` ADD `articleNumber` int;--> statement-breakpoint
ALTER TABLE `quizQuestions` ADD `examBoard` varchar(64);--> statement-breakpoint
ALTER TABLE `quizQuestions` ADD `theme` varchar(120);--> statement-breakpoint
ALTER TABLE `quizQuestions` ADD `sourceType` varchar(64);--> statement-breakpoint
ALTER TABLE `quizQuestions` ADD `sourceRef` varchar(255);--> statement-breakpoint
ALTER TABLE `userQuizResults` ADD `correctAnswers` int;--> statement-breakpoint
ALTER TABLE `userQuizResults` ADD `wrongAnswers` int;--> statement-breakpoint
ALTER TABLE `userQuizResults` ADD `avgTimeMs` int;--> statement-breakpoint
ALTER TABLE `userQuizResults` ADD `board` varchar(64);--> statement-breakpoint
ALTER TABLE `userQuizResults` ADD `theme` varchar(120);