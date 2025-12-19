package services_test

import (
	"schoolms-go/models"
	"schoolms-go/services"
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	db.AutoMigrate(
		&models.User{}, &models.School{}, &models.Student{}, &models.Class{},
		&models.VoteHead{}, &models.FeeItem{}, &models.VoteHeadBalance{},
		&models.FeeStructure{}, &models.Payment{}, &models.PaymentAllocation{},
	)

	models.DB = db
	return db
}

// ============ Vote Head Allocation Tests ============

func TestAllocatePaymentToVoteHeads_SingleVoteHead(t *testing.T) {
	db := setupTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	// Setup
	school := models.School{Name: "Test School"}
	db.Create(&school)

	user := models.User{Email: "student@test.com", Role: "STUDENT", SchoolID: &school.ID}
	db.Create(&user)

	class := models.Class{Name: "Form 1", SchoolID: school.ID}
	db.Create(&class)

	student := models.Student{UserID: user.ID, SchoolID: school.ID, ClassID: &class.ID, Status: "ACTIVE"}
	db.Create(&student)

	voteHead := models.VoteHead{SchoolID: school.ID, Name: "Tuition", Priority: 1, IsActive: true}
	db.Create(&voteHead)

	// Create initial balance
	balance := models.VoteHeadBalance{StudentID: student.ID, VoteHeadID: voteHead.ID, SchoolID: school.ID, Balance: 10000}
	db.Create(&balance)

	// Create payment
	payment := models.Payment{StudentID: student.ID, SchoolID: school.ID, Amount: 5000, Method: "MPESA"}
	db.Create(&payment)

	// Test allocation
	allocations, err := services.AllocatePaymentToVoteHeads(&payment, student.ID, school.ID)

	assert.NoError(t, err)
	assert.Len(t, allocations, 1)
	assert.Equal(t, 5000.0, allocations[0].Amount)
	assert.Equal(t, 10000.0, allocations[0].BalBefore)
	assert.Equal(t, 5000.0, allocations[0].BalAfter)
}

func TestAllocatePaymentToVoteHeads_MultipleVoteHeads(t *testing.T) {
	db := setupTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	user := models.User{Email: "student@test.com", Role: "STUDENT", SchoolID: &school.ID}
	db.Create(&user)

	class := models.Class{Name: "Form 1", SchoolID: school.ID}
	db.Create(&class)

	student := models.Student{UserID: user.ID, SchoolID: school.ID, ClassID: &class.ID, Status: "ACTIVE"}
	db.Create(&student)

	// Create vote heads with priorities
	tuition := models.VoteHead{SchoolID: school.ID, Name: "Tuition", Priority: 1, IsActive: true}
	rmi := models.VoteHead{SchoolID: school.ID, Name: "R&MI", Priority: 2, IsActive: true}
	activity := models.VoteHead{SchoolID: school.ID, Name: "Activity", Priority: 3, IsActive: true}
	db.Create(&tuition)
	db.Create(&rmi)
	db.Create(&activity)

	// Create balances: Tuition 5000, R&MI 3000, Activity 2000
	db.Create(&models.VoteHeadBalance{StudentID: student.ID, VoteHeadID: tuition.ID, SchoolID: school.ID, Balance: 5000})
	db.Create(&models.VoteHeadBalance{StudentID: student.ID, VoteHeadID: rmi.ID, SchoolID: school.ID, Balance: 3000})
	db.Create(&models.VoteHeadBalance{StudentID: student.ID, VoteHeadID: activity.ID, SchoolID: school.ID, Balance: 2000})

	// Payment of 7000 should clear Tuition (5000) and partially pay R&MI (2000)
	payment := models.Payment{StudentID: student.ID, SchoolID: school.ID, Amount: 7000, Method: "MPESA"}
	db.Create(&payment)

	allocations, err := services.AllocatePaymentToVoteHeads(&payment, student.ID, school.ID)

	assert.NoError(t, err)
	assert.Len(t, allocations, 2)

	// First allocation should be Tuition (priority 1)
	assert.Equal(t, tuition.ID, allocations[0].VoteHeadID)
	assert.Equal(t, 5000.0, allocations[0].Amount)

	// Second allocation should be R&MI (priority 2)
	assert.Equal(t, rmi.ID, allocations[1].VoteHeadID)
	assert.Equal(t, 2000.0, allocations[1].Amount)

	// Verify remaining balances
	var tuitionBal, rmiBal, activityBal models.VoteHeadBalance
	db.Where("vote_head_id = ?", tuition.ID).First(&tuitionBal)
	db.Where("vote_head_id = ?", rmi.ID).First(&rmiBal)
	db.Where("vote_head_id = ?", activity.ID).First(&activityBal)

	assert.Equal(t, 0.0, tuitionBal.Balance)     // Fully paid
	assert.Equal(t, 1000.0, rmiBal.Balance)      // 3000 - 2000 = 1000
	assert.Equal(t, 2000.0, activityBal.Balance) // Untouched
}

func TestAllocatePaymentToVoteHeads_Overpayment(t *testing.T) {
	db := setupTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	user := models.User{Email: "student@test.com", Role: "STUDENT", SchoolID: &school.ID}
	db.Create(&user)

	class := models.Class{Name: "Form 1", SchoolID: school.ID}
	db.Create(&class)

	student := models.Student{UserID: user.ID, SchoolID: school.ID, ClassID: &class.ID, Status: "ACTIVE"}
	db.Create(&student)

	voteHead := models.VoteHead{SchoolID: school.ID, Name: "Tuition", Priority: 1, IsActive: true}
	db.Create(&voteHead)

	db.Create(&models.VoteHeadBalance{StudentID: student.ID, VoteHeadID: voteHead.ID, SchoolID: school.ID, Balance: 5000})

	// Overpay by 3000
	payment := models.Payment{StudentID: student.ID, SchoolID: school.ID, Amount: 8000, Method: "MPESA"}
	db.Create(&payment)

	allocations, err := services.AllocatePaymentToVoteHeads(&payment, student.ID, school.ID)

	assert.NoError(t, err)
	assert.Len(t, allocations, 1)
	assert.Equal(t, 5000.0, allocations[0].Amount)

	// Balance should be negative (credit)
	var balance models.VoteHeadBalance
	db.Where("student_id = ?", student.ID).First(&balance)
	assert.Equal(t, -3000.0, balance.Balance)
}

func TestGetStudentVoteHeadBreakdown(t *testing.T) {
	db := setupTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	user := models.User{Email: "student@test.com", Role: "STUDENT", SchoolID: &school.ID}
	db.Create(&user)

	student := models.Student{UserID: user.ID, SchoolID: school.ID, Status: "ACTIVE"}
	db.Create(&student)

	tuition := models.VoteHead{SchoolID: school.ID, Name: "Tuition", Priority: 1, IsActive: true}
	rmi := models.VoteHead{SchoolID: school.ID, Name: "R&MI", Priority: 2, IsActive: true}
	db.Create(&tuition)
	db.Create(&rmi)

	db.Create(&models.VoteHeadBalance{StudentID: student.ID, VoteHeadID: tuition.ID, SchoolID: school.ID, Balance: 5000})
	db.Create(&models.VoteHeadBalance{StudentID: student.ID, VoteHeadID: rmi.ID, SchoolID: school.ID, Balance: 3000})

	breakdown, total, err := services.GetStudentVoteHeadBreakdown(student.ID, school.ID)

	assert.NoError(t, err)
	assert.Len(t, breakdown, 2)
	assert.Equal(t, 8000.0, total)
	assert.Equal(t, "Tuition", breakdown[0]["vote_head_name"])
}
