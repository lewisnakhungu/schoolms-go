package models

import "time"

// Ticket represents a support ticket submitted by SchoolAdmin
type Ticket struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	SchoolID    uint      `gorm:"index;not null" json:"school_id"`
	UserID      uint      `gorm:"not null" json:"user_id"`
	Subject     string    `gorm:"not null" json:"subject"`
	Description string    `gorm:"type:text" json:"description"`
	Category    string    `gorm:"not null" json:"category"`       // PASSWORD_RESET, TECHNICAL, BILLING, OTHER
	Status      string    `gorm:"default:OPEN" json:"status"`     // OPEN, IN_PROGRESS, RESOLVED, CLOSED
	Priority    string    `gorm:"default:MEDIUM" json:"priority"` // LOW, MEDIUM, HIGH
	Response    string    `gorm:"type:text" json:"response,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relations
	School School `gorm:"foreignKey:SchoolID" json:"school,omitempty"`
	User   User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
