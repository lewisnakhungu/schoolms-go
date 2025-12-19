// database.go

package models

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

//declare a global variable to use go db anywhere in the app

var DB *gorm.DB

//db function

func ConnectDB() {
	var db *gorm.DB
	var err error

	dbHost := os.Getenv("DB_HOST")

	if dbHost == "" {
		fmt.Println("No DB_HOST found, using SQLite (schoolms.db)")
		db, err = gorm.Open(sqlite.Open("schoolms.db"), &gorm.Config{})
	} else {
		dsn := fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
			dbHost,
			os.Getenv("DB_USER"),
			os.Getenv("DB_PASSWORD"),
			os.Getenv("DB_NAME"),
			os.Getenv("DB_PORT"),
		)
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	}

	if err != nil {
		panic("Failed to connect to database!")
	}

	// AutoMigrate will be called here or in a separate migration script
	// For MVP, we'll keep it here but expand the list of models later
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

	DB = db
}
