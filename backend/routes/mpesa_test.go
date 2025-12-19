package routes_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"schoolms-go/models"
	"schoolms-go/routes"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupMpesaTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	db.AutoMigrate(
		&models.User{}, &models.School{}, &models.Student{}, &models.Class{},
		&models.Payment{}, &models.MPESATransaction{},
		&models.VoteHead{}, &models.VoteHeadBalance{}, &models.PaymentAllocation{},
	)

	models.DB = db
	return db
}

// ============ M-PESA C2B Validation Tests ============

func TestC2BValidation_StudentExists(t *testing.T) {
	db := setupMpesaTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	user := models.User{Email: "student@test.com", Role: "STUDENT", SchoolID: &school.ID}
	db.Create(&user)

	student := models.Student{
		UserID:           user.ID,
		SchoolID:         school.ID,
		EnrollmentNumber: "ADM001",
		Status:           "ACTIVE",
	}
	db.Create(&student)

	router := gin.New()
	api := router.Group("/api/v1")
	routes.RegisterMpesaRoutes(api)

	// Simulate Safaricom C2B validation request
	body := map[string]interface{}{
		"TransactionType":   "Pay Bill",
		"TransID":           "NLJ7RT61SV",
		"TransTime":         "20191122063845",
		"TransAmount":       5000.0,
		"BusinessShortCode": "174379",
		"BillRefNumber":     "ADM001", // Student admission number
		"InvoiceNumber":     "",
		"MSISDN":            "254708374149",
		"FirstName":         "John",
		"MiddleName":        "",
		"LastName":          "Doe",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/mpesa/c2b/validation", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["ResultCode"]) // 0 = Accepted
	assert.Equal(t, "Accepted", response["ResultDesc"])
}

func TestC2BValidation_StudentNotFound(t *testing.T) {
	db := setupMpesaTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	router := gin.New()
	api := router.Group("/api/v1")
	routes.RegisterMpesaRoutes(api)

	body := map[string]interface{}{
		"TransactionType": "Pay Bill",
		"TransID":         "NLJ7RT61SV",
		"TransAmount":     5000.0,
		"BillRefNumber":   "INVALID001", // Non-existent student
		"MSISDN":          "254708374149",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/mpesa/c2b/validation", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(1), response["ResultCode"]) // 1 = Rejected
}

// ============ M-PESA C2B Confirmation Tests ============

func TestC2BConfirmation_CreatesPayment(t *testing.T) {
	db := setupMpesaTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	user := models.User{Email: "student@test.com", Role: "STUDENT", SchoolID: &school.ID}
	db.Create(&user)

	class := models.Class{Name: "Form 1", SchoolID: school.ID}
	db.Create(&class)

	student := models.Student{
		UserID:           user.ID,
		SchoolID:         school.ID,
		EnrollmentNumber: "ADM001",
		ClassID:          &class.ID,
		Status:           "ACTIVE",
	}
	db.Create(&student)

	// Create vote head for allocation
	voteHead := models.VoteHead{SchoolID: school.ID, Name: "Tuition", Priority: 1, IsActive: true}
	db.Create(&voteHead)

	db.Create(&models.VoteHeadBalance{StudentID: student.ID, VoteHeadID: voteHead.ID, SchoolID: school.ID, Balance: 10000})

	router := gin.New()
	api := router.Group("/api/v1")
	routes.RegisterMpesaRoutes(api)

	body := map[string]interface{}{
		"TransactionType":   "Pay Bill",
		"TransID":           "NLJ7RT61SV",
		"TransTime":         "20191122063845",
		"TransAmount":       5000.0,
		"BusinessShortCode": "174379",
		"BillRefNumber":     "ADM001",
		"MSISDN":            "254708374149",
		"FirstName":         "John",
		"LastName":          "Doe",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/mpesa/c2b/confirmation", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify payment was created
	var payment models.Payment
	err := db.Where("student_id = ?", student.ID).First(&payment).Error
	assert.NoError(t, err)
	assert.Equal(t, 5000.0, payment.Amount)
	assert.Equal(t, "MPESA", payment.Method)
	assert.Equal(t, "NLJ7RT61SV", payment.Reference)

	// Verify M-PESA transaction was logged
	var mpesaTx models.MPESATransaction
	err = db.Where("trans_id = ?", "NLJ7RT61SV").First(&mpesaTx).Error
	assert.NoError(t, err)
	assert.Equal(t, "MATCHED", mpesaTx.Status)
}

func TestC2BConfirmation_DuplicateTransaction(t *testing.T) {
	db := setupMpesaTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	// Create existing transaction
	existingTx := models.MPESATransaction{
		SchoolID:    school.ID,
		TransID:     "NLJ7RT61SV",
		TransAmount: 5000,
		Status:      "MATCHED",
	}
	db.Create(&existingTx)

	router := gin.New()
	api := router.Group("/api/v1")
	routes.RegisterMpesaRoutes(api)

	body := map[string]interface{}{
		"TransID":       "NLJ7RT61SV", // Duplicate
		"TransAmount":   5000.0,
		"BillRefNumber": "ADM001",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/mpesa/c2b/confirmation", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "Already processed", response["ResultDesc"])

	// Verify no new payment was created
	var count int64
	db.Model(&models.Payment{}).Count(&count)
	assert.Equal(t, int64(0), count)
}

func TestC2BConfirmation_UnmatchedStudent(t *testing.T) {
	db := setupMpesaTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	router := gin.New()
	api := router.Group("/api/v1")
	routes.RegisterMpesaRoutes(api)

	body := map[string]interface{}{
		"TransID":       "NLJ7RT61XX",
		"TransAmount":   3000.0,
		"BillRefNumber": "INVALID999", // Non-existent student
		"MSISDN":        "254708374149",
		"FirstName":     "Jane",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/mpesa/c2b/confirmation", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify transaction was logged as UNMATCHED
	var mpesaTx models.MPESATransaction
	err := db.Where("trans_id = ?", "NLJ7RT61XX").First(&mpesaTx).Error
	assert.NoError(t, err)
	assert.Equal(t, "UNMATCHED", mpesaTx.Status)
	assert.Contains(t, mpesaTx.ErrorMessage, "not found")
}
