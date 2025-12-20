// database.go

package models

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Declare a global variable to use db anywhere in the app
var DB *gorm.DB

// ConnectDB establishes database connection
func ConnectDB() {
	var db *gorm.DB
	var err error

	// Railway provides DATABASE_URL or individual vars
	databaseURL := os.Getenv("DATABASE_URL")
	dbHost := os.Getenv("DB_HOST")

	if databaseURL != "" {
		// Railway PostgreSQL format
		log.Println("Connecting to PostgreSQL via DATABASE_URL...")
		db, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
		if err != nil {
			log.Printf("PostgreSQL connection error: %v", err)
			log.Fatal("Failed to connect to PostgreSQL database!")
		}
		log.Println("PostgreSQL connection successful!")
	} else if dbHost != "" {
		dsn := fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
			dbHost,
			os.Getenv("DB_USER"),
			os.Getenv("DB_PASSWORD"),
			os.Getenv("DB_NAME"),
			os.Getenv("DB_PORT"),
		)
		log.Println("Connecting to PostgreSQL via DB_HOST...")
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Printf("PostgreSQL connection error: %v", err)
			log.Fatal("Failed to connect to PostgreSQL database!")
		}
		log.Println("PostgreSQL connection successful!")
	} else {
		// Local development only - SQLite requires CGO
		log.Println("No DATABASE_URL or DB_HOST found, using SQLite (schoolms.db)")
		db, err = gorm.Open(sqlite.Open("schoolms.db"), &gorm.Config{})
		if err != nil {
			log.Printf("SQLite error: %v", err)
			log.Fatal("Failed to connect to SQLite database!")
		}
		log.Println("SQLite connection successful!")
	}

	// AutoMigrate
	log.Println("Running database migrations...")
	db.AutoMigrate(
		&User{}, &School{}, &Invite{},
		&Class{}, &Student{},
		&FeeStructure{}, &Payment{},
		&Ticket{}, &Notification{}, &NotificationRead{},
		&ClassContent{}, &Grade{},
		&Attendance{}, &Timetable{}, &ParentStudent{}, &Exam{}, &ExamResult{},
		&VoteHead{}, &FeeItem{}, &VoteHeadBalance{}, &PaymentAllocation{}, &MPESATransaction{},
		&IntakeGroup{}, &Course{}, &Module{}, &StudentModuleEnrollment{}, &IndustrialAttachment{},
		&AuditLog{},
	)
	log.Println("Database migrations complete!")

	DB = db
}
