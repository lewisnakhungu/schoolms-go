package routes_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"schoolms-go/models"
	"schoolms-go/routes"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupAuthTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	db.AutoMigrate(
		&models.User{}, &models.School{}, &models.Student{}, &models.Invite{},
	)

	models.DB = db
	return db
}

// ============ Auth Tests ============

func TestLogin_Success(t *testing.T) {
	db := setupAuthTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	user := models.User{
		Email:        "admin@test.com",
		PasswordHash: string(hashedPassword),
		Role:         "SCHOOLADMIN",
		SchoolID:     &school.ID,
	}
	db.Create(&user)

	router := gin.New()
	api := router.Group("/api/v1")
	routes.RegisterAuthRoutes(api)

	body := map[string]interface{}{
		"email":    "admin@test.com",
		"password": "password123",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.NotEmpty(t, response["token"])
	assert.Equal(t, "SCHOOLADMIN", response["user"].(map[string]interface{})["role"])
}

func TestLogin_InvalidPassword(t *testing.T) {
	db := setupAuthTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	user := models.User{
		Email:        "admin@test.com",
		PasswordHash: string(hashedPassword),
		Role:         "SCHOOLADMIN",
	}
	db.Create(&user)

	router := gin.New()
	api := router.Group("/api/v1")
	routes.RegisterAuthRoutes(api)

	body := map[string]interface{}{
		"email":    "admin@test.com",
		"password": "wrongpassword",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestLogin_UserNotFound(t *testing.T) {
	db := setupAuthTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	router := gin.New()
	api := router.Group("/api/v1")
	routes.RegisterAuthRoutes(api)

	body := map[string]interface{}{
		"email":    "nonexistent@test.com",
		"password": "password123",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestSignup_WithValidInviteCode(t *testing.T) {
	db := setupAuthTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	inviteCode := uuid.New()

	invite := models.Invite{
		Code:      inviteCode,
		Role:      "STUDENT",
		SchoolID:  school.ID,
		IsUsed:    false,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}
	db.Create(&invite)

	router := gin.New()
	api := router.Group("/api/v1")
	routes.RegisterAuthRoutes(api)

	body := map[string]interface{}{
		"email":       "newstudent@test.com",
		"password":    "password123",
		"invite_code": inviteCode.String(),
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/auth/signup", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	// Verify user was created
	var user models.User
	err := db.Where("email = ?", "newstudent@test.com").First(&user).Error
	assert.NoError(t, err)
	assert.Equal(t, "STUDENT", user.Role)

	// Verify invite was marked as used
	var usedInvite models.Invite
	db.First(&usedInvite, invite.ID)
	assert.True(t, usedInvite.IsUsed)
}

func TestSignup_InvalidInviteCode(t *testing.T) {
	db := setupAuthTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	router := gin.New()
	api := router.Group("/api/v1")
	routes.RegisterAuthRoutes(api)

	body := map[string]interface{}{
		"email":       "newstudent@test.com",
		"password":    "password123",
		"invite_code": "INVALID",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/auth/signup", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSignup_UsedInviteCode(t *testing.T) {
	db := setupAuthTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	usedCode := uuid.New()

	invite := models.Invite{
		Code:      usedCode,
		Role:      "STUDENT",
		SchoolID:  school.ID,
		IsUsed:    true, // Already used
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}
	db.Create(&invite)

	router := gin.New()
	api := router.Group("/api/v1")
	routes.RegisterAuthRoutes(api)

	body := map[string]interface{}{
		"email":       "newstudent@test.com",
		"password":    "password123",
		"invite_code": usedCode.String(),
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/auth/signup", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}
