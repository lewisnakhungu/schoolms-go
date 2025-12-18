package models

import "time"

// Notification represents a message sent to students
type Notification struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	SchoolID   uint      `gorm:"index;not null" json:"school_id"`
	SenderID   uint      `gorm:"not null" json:"sender_id"`   // Who sent it
	TargetType string    `gorm:"not null" json:"target_type"` // ALL, CLASS, STUDENT
	TargetID   *uint     `json:"target_id,omitempty"`         // ClassID or StudentID if targeted
	Title      string    `gorm:"not null" json:"title"`
	Message    string    `gorm:"type:text;not null" json:"message"`
	Category   string    `gorm:"not null" json:"category"` // FEE_REMINDER, ANNOUNCEMENT, ALERT
	CreatedAt  time.Time `json:"created_at"`

	// Relations
	School School `gorm:"foreignKey:SchoolID" json:"-"`
	Sender User   `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
}

// NotificationRead tracks which students have read notifications
type NotificationRead struct {
	ID             uint      `gorm:"primaryKey"`
	NotificationID uint      `gorm:"index;not null"`
	StudentID      uint      `gorm:"index;not null"`
	ReadAt         time.Time `json:"read_at"`
}
