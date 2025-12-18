package models

import "time"

type FeeStructure struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	ClassID      uint      `gorm:"not null;index" json:"class_id"`
	Amount       float64   `gorm:"type:decimal(10,2);not null" json:"amount"`
	AcademicYear string    `gorm:"not null" json:"academic_year"`
	SchoolID     uint      `gorm:"not null;index" json:"school_id"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	// Relationships
	Class  Class  `gorm:"foreignKey:ClassID"`
	School School `gorm:"foreignKey:SchoolID"`
}

type Payment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	StudentID uint      `gorm:"not null;index" json:"student_id"`
	Amount    float64   `gorm:"type:decimal(10,2);not null" json:"amount"`
	Method    string    `json:"method"` // CASH, MPESA, BANK
	Reference string    `json:"reference"`
	SchoolID  uint      `gorm:"not null;index" json:"school_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relationships
	Student Student `gorm:"foreignKey:StudentID"`
	School  School  `gorm:"foreignKey:SchoolID"`
}
