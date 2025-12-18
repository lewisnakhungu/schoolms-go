package models

import "time"

type Class struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	SchoolID  uint      `gorm:"not null;index" json:"school_id"`
	TeacherID *uint     `gorm:"index" json:"teacher_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	School   School    `gorm:"foreignKey:SchoolID"`
	Teacher  *User     `gorm:"foreignKey:TeacherID"`
	Students []Student `gorm:"foreignKey:ClassID"`
}

type Student struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	UserID           uint      `gorm:"not null;uniqueIndex" json:"user_id"`
	ClassID          *uint     `gorm:"index" json:"class_id"`
	SchoolID         uint      `gorm:"not null;index" json:"school_id"`
	EnrollmentNumber string    `json:"enrollment_number"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	// Relations
	User   User   `gorm:"foreignKey:UserID"`
	Class  *Class `gorm:"foreignKey:ClassID"`
	School School `gorm:"foreignKey:SchoolID"`
}
