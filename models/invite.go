package models

import (
	"time"

	"github.com/google/uuid"
)

type Invite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Code      uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"code"`
	Role      string    `gorm:"not null" json:"role"`
	SchoolID  uint      `gorm:"not null;index" json:"school_id"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	IsUsed    bool      `gorm:"default:false" json:"is_used"`
	CreatedAt time.Time `json:"created_at"`

	// Relations
	School School `gorm:"foreignKey:SchoolID"`
}
