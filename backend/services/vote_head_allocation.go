package services

import (
	"errors"
	"schoolms-go/models"
	"time"
)

// AllocatePaymentToVoteHeads - Allocates a payment across vote heads by priority
// Kenya school accounting: Fees are cleared in order of priority
// Priority 1 (e.g., Tuition) gets paid first, then Priority 2, etc.
func AllocatePaymentToVoteHeads(payment *models.Payment, studentID, schoolID uint) ([]models.PaymentAllocation, error) {
	if payment.Amount <= 0 {
		return nil, errors.New("payment amount must be positive")
	}

	// Get student's vote head balances ordered by vote head priority (only active vote heads)
	var balances []models.VoteHeadBalance
	err := models.DB.
		Joins("JOIN vote_heads ON vote_heads.id = vote_head_balances.vote_head_id").
		Where("vote_head_balances.student_id = ? AND vote_head_balances.school_id = ?", studentID, schoolID).
		Where("vote_heads.is_active = ?", true).
		Order("vote_heads.priority ASC").
		Preload("VoteHead").
		Find(&balances).Error

	if err != nil {
		return nil, err
	}

	// If no balances exist, initialize them from fee structure
	if len(balances) == 0 {
		if err := initializeStudentVoteHeadBalances(studentID, schoolID); err != nil {
			return nil, err
		}
		// Re-fetch (also filter by active vote heads)
		models.DB.
			Joins("JOIN vote_heads ON vote_heads.id = vote_head_balances.vote_head_id").
			Where("vote_head_balances.student_id = ? AND vote_head_balances.school_id = ?", studentID, schoolID).
			Where("vote_heads.is_active = ?", true).
			Order("vote_heads.priority ASC").
			Preload("VoteHead").
			Find(&balances)
	}

	// Allocate payment across vote heads
	remainingAmount := payment.Amount
	allocations := []models.PaymentAllocation{}

	for i := range balances {
		if remainingAmount <= 0 {
			break
		}

		balance := &balances[i]
		if balance.Balance <= 0 {
			continue // Already cleared
		}

		allocationAmount := balance.Balance
		if remainingAmount < allocationAmount {
			allocationAmount = remainingAmount
		}

		// Create allocation record
		allocation := models.PaymentAllocation{
			PaymentID:  payment.ID,
			VoteHeadID: balance.VoteHeadID,
			Amount:     allocationAmount,
			BalBefore:  balance.Balance,
			BalAfter:   balance.Balance - allocationAmount,
			CreatedAt:  time.Now(),
		}
		allocations = append(allocations, allocation)

		// Update balance
		balance.Balance -= allocationAmount
		balance.LastUpdated = time.Now()
		models.DB.Save(balance)

		remainingAmount -= allocationAmount
	}

	// Save allocations
	for i := range allocations {
		models.DB.Create(&allocations[i])
	}

	// If there's overpayment, it stays as credit (negative balance on last vote head)
	if remainingAmount > 0 && len(balances) > 0 {
		lastBalance := &balances[len(balances)-1]
		lastBalance.Balance -= remainingAmount
		lastBalance.LastUpdated = time.Now()
		models.DB.Save(lastBalance)
	}

	return allocations, nil
}

// initializeStudentVoteHeadBalances - Sets up vote head balances from fee structure
func initializeStudentVoteHeadBalances(studentID, schoolID uint) error {
	// Get student's class
	var student models.Student
	if err := models.DB.Where("id = ? AND school_id = ?", studentID, schoolID).First(&student).Error; err != nil {
		return err
	}

	if student.ClassID == nil {
		return errors.New("student not assigned to a class")
	}

	// Get fee structure for the class
	var feeStructure models.FeeStructure
	if err := models.DB.Where("class_id = ? AND school_id = ?", *student.ClassID, schoolID).
		Order("created_at DESC").First(&feeStructure).Error; err != nil {
		return err
	}

	// Get fee items (vote head allocations)
	var feeItems []models.FeeItem
	models.DB.Where("fee_structure_id = ?", feeStructure.ID).Preload("VoteHead").Find(&feeItems)

	// Create vote head balances
	now := time.Now()
	for _, item := range feeItems {
		balance := models.VoteHeadBalance{
			StudentID:   studentID,
			VoteHeadID:  item.VoteHeadID,
			SchoolID:    schoolID,
			Balance:     item.Amount,
			LastUpdated: now,
		}
		models.DB.Create(&balance)
	}

	return nil
}

// GetStudentVoteHeadBreakdown - Returns detailed balance breakdown per vote head
func GetStudentVoteHeadBreakdown(studentID, schoolID uint) ([]map[string]interface{}, float64, error) {
	var balances []models.VoteHeadBalance
	err := models.DB.
		Joins("JOIN vote_heads ON vote_heads.id = vote_head_balances.vote_head_id").
		Where("vote_head_balances.student_id = ? AND vote_head_balances.school_id = ?", studentID, schoolID).
		Order("vote_heads.priority ASC").
		Preload("VoteHead").
		Find(&balances).Error

	if err != nil {
		return nil, 0, err
	}

	var totalBalance float64
	breakdown := make([]map[string]interface{}, len(balances))

	for i, b := range balances {
		breakdown[i] = map[string]interface{}{
			"vote_head_id":   b.VoteHeadID,
			"vote_head_name": b.VoteHead.Name,
			"priority":       b.VoteHead.Priority,
			"balance":        b.Balance,
		}
		totalBalance += b.Balance
	}

	return breakdown, totalBalance, nil
}
