// models/user.go
package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User model
type User struct {
	ID           uint       `gorm:"primaryKey"`
	Email        string     `gorm:"uniqueIndex;not null" json:"email"`
	FullName     string     `json:"full_name"`
	PasswordHash string     `gorm:"not null" json:"-"`
	Role         string     `gorm:"not null" json:"role"`             // SUPERADMIN, SCHOOLADMIN, TEACHER, STUDENT
	SchoolID     *uint      `gorm:"index" json:"school_id,omitempty"` // Nullable for Superadmin
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
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
