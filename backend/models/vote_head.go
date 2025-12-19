package models

import (
	"time"
)

// VoteHead - Kenyan school fee accounting buckets
// Fees are allocated by priority (1 = highest priority)
// Example: Tuition (1), R&MI (2), Activity Fee (3)
type VoteHead struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SchoolID  uint      `gorm:"not null;index" json:"school_id"`
	Name      string    `gorm:"not null" json:"name"`     // "Tuition", "R&MI", "Activity"
	Priority  int       `gorm:"not null" json:"priority"` // Lower number = higher priority
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// FeeItem - Links a FeeStructure to VoteHeads with allocated amounts
// Each fee structure has multiple fee items, one per vote head
type FeeItem struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	FeeStructureID uint      `gorm:"not null;index" json:"fee_structure_id"`
	VoteHeadID     uint      `gorm:"not null;index" json:"vote_head_id"`
	Amount         float64   `gorm:"not null" json:"amount"` // Allocated amount for this vote head
	CreatedAt      time.Time `json:"created_at"`

	// Relations
	FeeStructure FeeStructure `gorm:"foreignKey:FeeStructureID" json:"fee_structure,omitempty"`
	VoteHead     VoteHead     `gorm:"foreignKey:VoteHeadID" json:"vote_head,omitempty"`
}

// VoteHeadBalance - Tracks individual student's balance per vote head
// This enables granular reporting: "Student owes X in Tuition, Y in R&MI"
type VoteHeadBalance struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	StudentID   uint      `gorm:"not null;index" json:"student_id"`
	VoteHeadID  uint      `gorm:"not null;index" json:"vote_head_id"`
	SchoolID    uint      `gorm:"not null;index" json:"school_id"`
	Balance     float64   `json:"balance"` // Outstanding balance (positive = owes)
	LastUpdated time.Time `json:"last_updated"`

	// Relations
	Student  Student  `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	VoteHead VoteHead `gorm:"foreignKey:VoteHeadID" json:"vote_head,omitempty"`
}

// PaymentAllocation - Records how a payment was distributed across vote heads
// This is the audit trail for Vote Head accounting
type PaymentAllocation struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	PaymentID  uint      `gorm:"not null;index" json:"payment_id"`
	VoteHeadID uint      `gorm:"not null;index" json:"vote_head_id"`
	Amount     float64   `json:"amount"`     // Amount allocated to this vote head
	BalBefore  float64   `json:"bal_before"` // Balance before allocation
	BalAfter   float64   `json:"bal_after"`  // Balance after allocation
	CreatedAt  time.Time `json:"created_at"`

	// Relations
	Payment  Payment  `gorm:"foreignKey:PaymentID" json:"payment,omitempty"`
	VoteHead VoteHead `gorm:"foreignKey:VoteHeadID" json:"vote_head,omitempty"`
}

// MPESATransaction - Logs all M-PESA C2B transactions
type MPESATransaction struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	SchoolID          uint      `gorm:"not null;index" json:"school_id"`
	TransactionType   string    `json:"transaction_type"`            // C2B
	TransID           string    `gorm:"uniqueIndex" json:"trans_id"` // M-PESA transaction ID
	TransTime         string    `json:"trans_time"`
	TransAmount       float64   `json:"trans_amount"`
	BusinessShortCode string    `json:"business_short_code"`
	BillRefNumber     string    `gorm:"index" json:"bill_ref_number"` // Student Admission Number
	InvoiceNumber     string    `json:"invoice_number"`
	OrgAccountBalance float64   `json:"org_account_balance"`
	ThirdPartyTransID string    `json:"third_party_trans_id"`
	MSISDN            string    `json:"msisdn"` // Phone number
	FirstName         string    `json:"first_name"`
	MiddleName        string    `json:"middle_name"`
	LastName          string    `json:"last_name"`
	Status            string    `json:"status"`     // PENDING, MATCHED, FAILED
	PaymentID         *uint     `json:"payment_id"` // Linked payment after matching
	MatchedStudentID  *uint     `json:"matched_student_id"`
	ErrorMessage      string    `json:"error_message,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
}
