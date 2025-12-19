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

func setupFinanceTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	db.AutoMigrate(
		&models.User{}, &models.School{}, &models.Student{}, &models.Class{},
		&models.FeeStructure{}, &models.Payment{},
		&models.VoteHead{}, &models.VoteHeadBalance{}, &models.PaymentAllocation{},
	)

	models.DB = db
	return db
}

// ============ Fee Structure Tests ============

func TestCreateFeeStructure(t *testing.T) {
	db := setupFinanceTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	class := models.Class{Name: "Form 1", SchoolID: school.ID}
	db.Create(&class)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterFinanceRoutes(api)

	body := map[string]interface{}{
		"class_id":      class.ID,
		"amount":        50000,
		"academic_year": "2024",
		"term":          "Term 1",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/finance/fees", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(50000), response["amount"])
}

func TestListFeeStructures(t *testing.T) {
	db := setupFinanceTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	class := models.Class{Name: "Form 1", SchoolID: school.ID}
	db.Create(&class)

	db.Create(&models.FeeStructure{ClassID: class.ID, SchoolID: school.ID, Amount: 50000, AcademicYear: "2024"})
	db.Create(&models.FeeStructure{ClassID: class.ID, SchoolID: school.ID, Amount: 45000, AcademicYear: "2023"})

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterFinanceRoutes(api)

	req, _ := http.NewRequest("GET", "/api/v1/finance/fees", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var fees []models.FeeStructure
	json.Unmarshal(w.Body.Bytes(), &fees)
	assert.Len(t, fees, 2)
}

// ============ Payment Tests ============

func TestRecordPayment(t *testing.T) {
	db := setupFinanceTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	user := models.User{Email: "student@test.com", Role: "STUDENT", SchoolID: &school.ID}
	db.Create(&user)

	class := models.Class{Name: "Form 1", SchoolID: school.ID}
	db.Create(&class)

	student := models.Student{UserID: user.ID, SchoolID: school.ID, ClassID: &class.ID, Status: "ACTIVE"}
	db.Create(&student)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterFinanceRoutes(api)

	body := map[string]interface{}{
		"student_id": student.ID,
		"amount":     10000,
		"method":     "CASH",
		"reference":  "REC001",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/finance/payments", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	// Verify payment was created
	var payment models.Payment
	err := db.Where("student_id = ?", student.ID).First(&payment).Error
	assert.NoError(t, err)
	assert.Equal(t, 10000.0, payment.Amount)
	assert.Equal(t, "CASH", payment.Method)
}

func TestGetStudentBalance(t *testing.T) {
	db := setupFinanceTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	user := models.User{Email: "student@test.com", Role: "STUDENT", SchoolID: &school.ID}
	db.Create(&user)

	class := models.Class{Name: "Form 1", SchoolID: school.ID}
	db.Create(&class)

	student := models.Student{UserID: user.ID, SchoolID: school.ID, ClassID: &class.ID, Status: "ACTIVE"}
	db.Create(&student)

	// Create fee structure and vote head balances
	voteHead := models.VoteHead{SchoolID: school.ID, Name: "Tuition", Priority: 1, IsActive: true}
	db.Create(&voteHead)

	db.Create(&models.VoteHeadBalance{StudentID: student.ID, VoteHeadID: voteHead.ID, SchoolID: school.ID, Balance: 10000})

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterFinanceRoutes(api)

	req, _ := http.NewRequest("GET", "/api/v1/finance/students/1/balance", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// ============ Student Tests ============

func setupStudentTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	db.AutoMigrate(
		&models.User{}, &models.School{}, &models.Student{}, &models.Class{},
	)

	models.DB = db
	return db
}

func TestListStudents(t *testing.T) {
	db := setupStudentTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	class := models.Class{Name: "Form 1", SchoolID: school.ID}
	db.Create(&class)

	for i := 0; i < 5; i++ {
		user := models.User{Email: "student" + string(rune('0'+i)) + "@test.com", Role: "STUDENT", SchoolID: &school.ID}
		db.Create(&user)
		db.Create(&models.Student{UserID: user.ID, SchoolID: school.ID, ClassID: &class.ID, Status: "ACTIVE"})
	}

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterStudentRoutes(api)

	req, _ := http.NewRequest("GET", "/api/v1/students", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var students []models.Student
	json.Unmarshal(w.Body.Bytes(), &students)
	assert.Len(t, students, 5)
}

func TestAssignStudentToClass(t *testing.T) {
	db := setupStudentTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	class := models.Class{Name: "Form 1", SchoolID: school.ID}
	db.Create(&class)

	user := models.User{Email: "student@test.com", Role: "STUDENT", SchoolID: &school.ID}
	db.Create(&user)

	student := models.Student{UserID: user.ID, SchoolID: school.ID, Status: "ACTIVE"}
	db.Create(&student)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterStudentRoutes(api)

	body := map[string]interface{}{
		"class_id": class.ID,
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("PUT", "/api/v1/students/1", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify class was assigned
	var updated models.Student
	db.First(&updated, student.ID)
	assert.NotNil(t, updated.ClassID)
	assert.Equal(t, class.ID, *updated.ClassID)
}
