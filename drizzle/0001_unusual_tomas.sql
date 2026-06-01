CREATE TABLE `cartItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cartItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `discountCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`type` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
	`value` decimal(10,2) NOT NULL,
	`minOrderAmount` decimal(10,2),
	`maxUses` int,
	`currentUses` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`appliesToAll` boolean NOT NULL DEFAULT true,
	`productId` int,
	`startsAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discountCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `discountCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`userId` int,
	`guestEmail` varchar(320),
	`guestName` varchar(255),
	`status` enum('pending','paid','processing','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`shippingName` varchar(255),
	`shippingAddress` text,
	`shippingCity` varchar(100),
	`shippingState` varchar(100),
	`shippingZip` varchar(20),
	`shippingCountry` varchar(100),
	`trackingNumber` varchar(255),
	`trackingCarrier` varchar(100),
	`paymentMethod` varchar(50) DEFAULT 'nowpayments',
	`paymentId` varchar(255),
	`paymentStatus` varchar(50),
	`subtotal` decimal(10,2) NOT NULL,
	`discountAmount` decimal(10,2) DEFAULT '0.00',
	`shippingCost` decimal(10,2) DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL,
	`discountCode` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `productCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`categoryId` int NOT NULL,
	CONSTRAINT `productCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productResearch` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`overview` text,
	`chemicalMakeup` text,
	`researchContent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productResearch_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`shortDescription` text,
	`price` decimal(10,2) NOT NULL,
	`compareAtPrice` decimal(10,2),
	`sku` varchar(50),
	`imageUrl` text,
	`size` varchar(100),
	`contents` varchar(255),
	`form` varchar(100),
	`purity` varchar(50),
	`molecularFormula` varchar(255),
	`molecularWeight` varchar(100),
	`otherNames` text,
	`stockQuantity` int NOT NULL DEFAULT 100,
	`lowStockThreshold` int NOT NULL DEFAULT 10,
	`inStock` boolean NOT NULL DEFAULT true,
	`discountPercent` decimal(5,2),
	`discountActive` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `researchCitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`citationNumber` int NOT NULL,
	`title` text NOT NULL,
	`authors` text,
	`journal` varchar(255),
	`year` varchar(10),
	`url` text,
	`summary` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `researchCitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`settingType` enum('text','image','boolean','json','html') NOT NULL DEFAULT 'text',
	`label` varchar(255),
	`description` text,
	`groupName` varchar(100) DEFAULT 'general',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `siteSettings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `shippingAddress` text;