package models

import (
	"time"
)

// AuditLog - Tracks critical operations for compliance and debugging
type AuditLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SchoolID  uint      `gorm:"index" json:"school_id"`
	UserID    uint      `gorm:"index" json:"user_id"`
	Action    string    `gorm:"not null" json:"action"` // UPDATE_FEE_STRUCTURE, DELETE_PAYMENT, etc.
	Entity    string    `json:"entity"`                 // Table/Model name
	EntityID  uint      `json:"entity_id"`
	OldValue  string    `gorm:"type:text" json:"old_value"` // JSON
	NewValue  string    `gorm:"type:text" json:"new_value"` // JSON
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
	CreatedAt time.Time `json:"created_at"`
}

// Audit action constants
const (
	AuditUpdateFeeStructure      = "UPDATE_FEE_STRUCTURE"
	AuditDeletePayment           = "DELETE_PAYMENT"
	AuditChangeStudentGrade      = "CHANGE_STUDENT_GRADE"
	AuditManualBalanceAdjustment = "MANUAL_BALANCE_ADJUSTMENT"
	AuditExportData              = "EXPORT_DATA"
	AuditImportData              = "IMPORT_DATA"
	AuditDeleteStudent           = "DELETE_STUDENT"
	AuditMPESAMatch              = "MPESA_MANUAL_MATCH"
)

// CreateAuditLog - Helper to create audit log entries
func CreateAuditLog(schoolID, userID uint, action, entity string, entityID uint, oldVal, newVal, ip, ua string) {
	log := AuditLog{
		SchoolID:  schoolID,
		UserID:    userID,
		Action:    action,
		Entity:    entity,
		EntityID:  entityID,
		OldValue:  oldVal,
		NewValue:  newVal,
		IPAddress: ip,
		UserAgent: ua,
		CreatedAt: time.Now(),
	}
	DB.Create(&log)
}
