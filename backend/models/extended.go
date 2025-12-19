package models

import (
	"time"
)

// Attendance - Daily student attendance
type Attendance struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	StudentID uint      `gorm:"not null;index" json:"student_id"`
	ClassID   uint      `gorm:"not null;index" json:"class_id"`
	SchoolID  uint      `gorm:"not null;index" json:"school_id"`
	Date      time.Time `gorm:"not null;index" json:"date"`
	Status    string    `gorm:"not null" json:"status"` // PRESENT, ABSENT, LATE, EXCUSED
	Notes     string    `json:"notes,omitempty"`
	MarkedBy  uint      `json:"marked_by"` // Teacher user ID
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	Student Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Class   Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Teacher User    `gorm:"foreignKey:MarkedBy" json:"teacher,omitempty"`
}

// Timetable - Class schedule
type Timetable struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ClassID   uint      `gorm:"not null;index" json:"class_id"`
	SchoolID  uint      `gorm:"not null;index" json:"school_id"`
	DayOfWeek int       `gorm:"not null" json:"day_of_week"` // 0=Sunday, 1=Monday, etc.
	StartTime string    `gorm:"not null" json:"start_time"`  // "08:00"
	EndTime   string    `gorm:"not null" json:"end_time"`    // "09:00"
	Subject   string    `gorm:"not null" json:"subject"`
	TeacherID *uint     `json:"teacher_id,omitempty"`
	Room      string    `json:"room,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	Class   Class `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Teacher User  `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
}

// ParentStudent - Links parents to students
type ParentStudent struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	ParentID  uint   `gorm:"not null;index" json:"parent_id"`
	StudentID uint   `gorm:"not null;index" json:"student_id"`
	Relation  string `json:"relation"` // FATHER, MOTHER, GUARDIAN

	// Relations
	Parent  User    `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Student Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
}

// Exam - Exam/Test definitions
type Exam struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	SchoolID    uint      `gorm:"not null;index" json:"school_id"`
	ClassID     uint      `gorm:"not null;index" json:"class_id"`
	Name        string    `gorm:"not null" json:"name"`
	Subject     string    `gorm:"not null" json:"subject"`
	MaxScore    float64   `gorm:"default:100" json:"max_score"`
	ExamDate    time.Time `json:"exam_date"`
	Term        string    `json:"term"`
	Year        int       `json:"year"`
	Description string    `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`

	// Relations
	Class Class `gorm:"foreignKey:ClassID" json:"class,omitempty"`
}

// ExamResult - Student exam scores
type ExamResult struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ExamID    uint      `gorm:"not null;index" json:"exam_id"`
	StudentID uint      `gorm:"not null;index" json:"student_id"`
	Score     float64   `json:"score"`
	Comment   string    `json:"comment,omitempty"`
	CreatedAt time.Time `json:"created_at"`

	// Relations
	Exam    Exam    `gorm:"foreignKey:ExamID" json:"exam,omitempty"`
	Student Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
}
