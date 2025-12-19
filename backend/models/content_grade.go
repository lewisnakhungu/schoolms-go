package models

import "time"

// ClassContent represents course materials uploaded by teachers
type ClassContent struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ClassID     uint      `gorm:"not null;index" json:"class_id"`
	TeacherID   uint      `gorm:"not null" json:"teacher_id"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `json:"description"`
	ContentType string    `gorm:"not null" json:"content_type"` // NOTE, PDF, VIDEO, DOCUMENT, LINK
	FileURL     string    `json:"file_url,omitempty"`           // For uploaded files
	TextContent string    `json:"text_content,omitempty"`       // For text notes
	FileName    string    `json:"file_name,omitempty"`          // Original filename
	FileSize    int64     `json:"file_size,omitempty"`          // File size in bytes
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relationships
	Class   *Class `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Teacher *User  `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
}

// Grade represents student academic scores
type Grade struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	StudentID uint      `gorm:"not null;index" json:"student_id"`
	ClassID   uint      `gorm:"not null;index" json:"class_id"`
	SchoolID  uint      `gorm:"not null;index" json:"school_id"`
	Subject   string    `gorm:"not null" json:"subject"`
	Score     float64   `gorm:"not null" json:"score"`
	MaxScore  float64   `gorm:"default:100" json:"max_score"`
	Term      string    `json:"term"`              // Term 1, Term 2, Term 3
	Year      int       `json:"year"`              // Academic year
	Comment   string    `json:"comment,omitempty"` // Teacher comment
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relationships
	Student *Student `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Class   *Class   `gorm:"foreignKey:ClassID" json:"class,omitempty"`
}
