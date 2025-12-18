package models

import "time"

type School struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	Name               string    `gorm:"not null" json:"name"`
	Address            string    `json:"address"`
	ContactInfo        string    `json:"contact_info"`
	SubscriptionStatus string    `json:"subscription_status"` // ACTIVE, INACTIVE, TRIAL
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`

	// Relationships
	Users    []User    `gorm:"foreignKey:SchoolID"`
	Classes  []Class   `gorm:"foreignKey:SchoolID"`
	Students []Student `gorm:"foreignKey:SchoolID"`
}
