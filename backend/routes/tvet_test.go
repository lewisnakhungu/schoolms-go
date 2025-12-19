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

func setupTVETTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	db.AutoMigrate(
		&models.User{}, &models.School{}, &models.Student{},
		&models.IntakeGroup{}, &models.Course{}, &models.Module{}, &models.IndustrialAttachment{},
	)

	models.DB = db
	return db
}

// ============ Intake Group Tests ============

func TestCreateIntakeGroup(t *testing.T) {
	db := setupTVETTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test TVET"}
	db.Create(&school)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterTVETRoutes(api)

	body := map[string]interface{}{
		"name": "September 2024 Intake",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/tvet/intakes", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "September 2024 Intake", response["name"])
}

func TestListIntakeGroups(t *testing.T) {
	db := setupTVETTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test TVET"}
	db.Create(&school)

	db.Create(&models.IntakeGroup{SchoolID: school.ID, Name: "Sep 2024", IsActive: true})
	db.Create(&models.IntakeGroup{SchoolID: school.ID, Name: "Jan 2025", IsActive: true})

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterTVETRoutes(api)

	req, _ := http.NewRequest("GET", "/api/v1/tvet/intakes", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var intakes []models.IntakeGroup
	json.Unmarshal(w.Body.Bytes(), &intakes)
	assert.Len(t, intakes, 2)
}

// ============ Course Tests ============

func TestCreateCourse(t *testing.T) {
	db := setupTVETTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test TVET"}
	db.Create(&school)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterTVETRoutes(api)

	body := map[string]interface{}{
		"name":            "Electrical Engineering",
		"code":            "EE",
		"duration_months": 24,
		"level":           "Diploma",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/tvet/courses", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "Electrical Engineering", response["name"])
	assert.Equal(t, "Diploma", response["level"])
}

func TestListCourses(t *testing.T) {
	db := setupTVETTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test TVET"}
	db.Create(&school)

	db.Create(&models.Course{SchoolID: school.ID, Name: "Electrical", Code: "EE", IsActive: true})
	db.Create(&models.Course{SchoolID: school.ID, Name: "ICT", Code: "ICT", IsActive: true})

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterTVETRoutes(api)

	req, _ := http.NewRequest("GET", "/api/v1/tvet/courses", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var courses []models.Course
	json.Unmarshal(w.Body.Bytes(), &courses)
	assert.Len(t, courses, 2)
}

// ============ Module Tests ============

func TestCreateModule(t *testing.T) {
	db := setupTVETTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test TVET"}
	db.Create(&school)

	course := models.Course{SchoolID: school.ID, Name: "Electrical", IsActive: true}
	db.Create(&course)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterTVETRoutes(api)

	body := map[string]interface{}{
		"course_id":    course.ID,
		"name":         "Solar PV Installation",
		"knec_code":    "EE/M/01",
		"credit_hours": 45,
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/tvet/modules", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "Solar PV Installation", response["name"])
	assert.Equal(t, "EE/M/01", response["knec_code"])
}

// ============ Industrial Attachment Tests ============

func TestCreateIndustrialAttachment(t *testing.T) {
	db := setupTVETTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test TVET"}
	db.Create(&school)

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
	routes.RegisterTVETRoutes(api)

	body := map[string]interface{}{
		"student_id":       student.ID,
		"company_name":     "Kenya Power",
		"company_address":  "Nairobi",
		"supervisor_name":  "John Doe",
		"supervisor_phone": "0722000000",
		"duration_weeks":   12,
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/tvet/attachments", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "Kenya Power", response["company_name"])
	assert.Equal(t, "PLANNED", response["status"])
}

func TestUpdateAttachmentStatus(t *testing.T) {
	db := setupTVETTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test TVET"}
	db.Create(&school)

	user := models.User{Email: "student@test.com", Role: "STUDENT", SchoolID: &school.ID}
	db.Create(&user)

	student := models.Student{UserID: user.ID, SchoolID: school.ID, Status: "ACTIVE"}
	db.Create(&student)

	attachment := models.IndustrialAttachment{
		StudentID:   student.ID,
		SchoolID:    school.ID,
		CompanyName: "Kenya Power",
		Status:      "PLANNED",
	}
	db.Create(&attachment)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterTVETRoutes(api)

	body := map[string]interface{}{
		"status":        "ONGOING",
		"logbook_grade": "B",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("PUT", "/api/v1/tvet/attachments/1", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var updated models.IndustrialAttachment
	db.First(&updated, attachment.ID)
	assert.Equal(t, "ONGOING", updated.Status)
	assert.Equal(t, "B", updated.LogbookGrade)
}

func TestListAttachmentsByStatus(t *testing.T) {
	db := setupTVETTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test TVET"}
	db.Create(&school)

	user := models.User{Email: "student@test.com", Role: "STUDENT", SchoolID: &school.ID}
	db.Create(&user)

	student := models.Student{UserID: user.ID, SchoolID: school.ID, Status: "ACTIVE"}
	db.Create(&student)

	db.Create(&models.IndustrialAttachment{StudentID: student.ID, SchoolID: school.ID, CompanyName: "Company 1", Status: "PLANNED"})
	db.Create(&models.IndustrialAttachment{StudentID: student.ID, SchoolID: school.ID, CompanyName: "Company 2", Status: "ONGOING"})
	db.Create(&models.IndustrialAttachment{StudentID: student.ID, SchoolID: school.ID, CompanyName: "Company 3", Status: "COMPLETED"})

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterTVETRoutes(api)

	// Filter by ONGOING status
	req, _ := http.NewRequest("GET", "/api/v1/tvet/attachments?status=ONGOING", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var attachments []models.IndustrialAttachment
	json.Unmarshal(w.Body.Bytes(), &attachments)
	assert.Len(t, attachments, 1)
	assert.Equal(t, "Company 2", attachments[0].CompanyName)
}
