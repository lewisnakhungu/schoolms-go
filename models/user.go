// models/user.go
package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// THIS IS THE ONLY CORRECT VERSION — NO gorm.Model, NO DeletedAt
type User struct {
	ID        uint      `gorm:"primaryKey"`
	Email     string    `gorm:"uniqueIndex;not null"`
	FullName  string    `json:"full_name"`
	Password  string    `gorm:"not null" json:"-"`
	Role      string    `gorm:"not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
	// NO DeletedAt FIELD AT ALL
}

// Force table name and DISABLE soft deletes completely
func (User) TableName() string {
	return "users"
}

// This disables soft deletes globally for this model
func (u *User) BeforeCreate(tx *gorm.DB) error {
	return nil
}

// Hash password
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// Verify password
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}