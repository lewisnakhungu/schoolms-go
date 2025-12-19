package models

import (
	"time"
)

// IntakeGroup - TVET institutions admit students in cohorts (intakes)
// Unlike high schools with traditional Form 1-4, TVET uses intake groups
// Example: "September 2024 Intake", "January 2025 Intake"
type IntakeGroup struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SchoolID  uint      `gorm:"not null;index" json:"school_id"`
	Name      string    `gorm:"not null" json:"name"` // "Sep 2024 Intake"
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	Students []Student `gorm:"foreignKey:IntakeGroupID" json:"students,omitempty"`
}

// Course - TVET programs/courses (Electrical Engineering, ICT, etc.)
// Courses are typically long-term programs spanning 1-3 years
type Course struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	SchoolID       uint      `gorm:"not null;index" json:"school_id"`
	Name           string    `gorm:"not null" json:"name"` // "Electrical Engineering"
	Code           string    `json:"code"`                 // Course code
	DurationMonths int       `json:"duration_months"`      // 24 for 2 years
	Level          string    `json:"level"`                // Certificate, Diploma, Higher Diploma
	IsActive       bool      `gorm:"default:true" json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Relations
	Modules []Module `gorm:"foreignKey:CourseID" json:"modules,omitempty"`
}

// Module - KNEC examinable units within a course
// Each course has multiple modules that students must pass
type Module struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CourseID    uint      `gorm:"not null;index" json:"course_id"`
	SchoolID    uint      `gorm:"not null;index" json:"school_id"`
	Name        string    `gorm:"not null" json:"name"` // "Solar PV Installation"
	Code        string    `json:"code"`                 // Module code
	KNECCode    string    `json:"knec_code"`            // Official KNEC code
	CreditHours int       `json:"credit_hours"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`

	// Relations
	Course Course `gorm:"foreignKey:CourseID" json:"course,omitempty"`
}

// StudentModuleEnrollment - Tracks which modules a student is registered for
type StudentModuleEnrollment struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	StudentID  uint       `gorm:"not null;index" json:"student_id"`
	ModuleID   uint       `gorm:"not null;index" json:"module_id"`
	EnrolledAt time.Time  `json:"enrolled_at"`
	Status     string     `json:"status"`          // ENROLLED, PASSED, FAILED, DROPPED
	Grade      string     `json:"grade,omitempty"` // A, B, C, D, E
	Score      *float64   `json:"score,omitempty"`
	ExamDate   *time.Time `json:"exam_date,omitempty"`

	// Relations
	Student Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Module  Module  `gorm:"foreignKey:ModuleID" json:"module,omitempty"`
}

// IndustrialAttachment - Required industrial training for TVET students
// Students must complete attachment periods at workplaces
type IndustrialAttachment struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	StudentID       uint      `gorm:"not null;index" json:"student_id"`
	SchoolID        uint      `gorm:"not null;index" json:"school_id"`
	CompanyName     string    `gorm:"not null" json:"company_name"`
	CompanyAddress  string    `json:"company_address"`
	SupervisorName  string    `json:"supervisor_name"`
	SupervisorPhone string    `json:"supervisor_phone"`
	SupervisorEmail string    `json:"supervisor_email"`
	StartDate       time.Time `json:"start_date"`
	EndDate         time.Time `json:"end_date"`
	DurationWeeks   int       `json:"duration_weeks"`
	Status          string    `json:"status"`        // PLANNED, ONGOING, COMPLETED, CANCELLED
	LogbookGrade    string    `json:"logbook_grade"` // A, B, C, D, E
	SupervisorGrade string    `json:"supervisor_grade"`
	FinalGrade      string    `json:"final_grade"`
	Notes           string    `json:"notes"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// Relations
	Student Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
}
