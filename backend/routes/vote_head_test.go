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

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	return r
}

// ============ Vote Head Tests ============

func TestCreateVoteHead(t *testing.T) {
	db := setupTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	// Create test school
	school := models.School{Name: "Test School"}
	db.Create(&school)

	// Create admin user
	admin := models.User{
		Email:    "admin@test.com",
		Role:     "SCHOOLADMIN",
		SchoolID: &school.ID,
	}
	db.Create(&admin)

	router := setupTestRouter()

	// Mock auth middleware for testing
	router.Use(func(c *gin.Context) {
		c.Set("userID", admin.ID)
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterVoteHeadRoutes(api)

	// Test creating a vote head
	body := map[string]interface{}{
		"name": "Tuition",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/vote-heads", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "Tuition", response["name"])
	assert.Equal(t, float64(1), response["priority"])
}

func TestListVoteHeads(t *testing.T) {
	db := setupTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	// Create vote heads
	db.Create(&models.VoteHead{SchoolID: school.ID, Name: "Tuition", Priority: 1, IsActive: true})
	db.Create(&models.VoteHead{SchoolID: school.ID, Name: "R&MI", Priority: 2, IsActive: true})
	db.Create(&models.VoteHead{SchoolID: school.ID, Name: "Activity", Priority: 3, IsActive: true})

	router := setupTestRouter()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterVoteHeadRoutes(api)

	req, _ := http.NewRequest("GET", "/api/v1/vote-heads", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var voteHeads []models.VoteHead
	json.Unmarshal(w.Body.Bytes(), &voteHeads)
	assert.Len(t, voteHeads, 3)
	assert.Equal(t, "Tuition", voteHeads[0].Name)
}

func TestReorderVoteHeads(t *testing.T) {
	db := setupTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	vh1 := models.VoteHead{SchoolID: school.ID, Name: "Tuition", Priority: 1, IsActive: true}
	vh2 := models.VoteHead{SchoolID: school.ID, Name: "R&MI", Priority: 2, IsActive: true}
	db.Create(&vh1)
	db.Create(&vh2)

	router := setupTestRouter()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "SCHOOLADMIN")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterVoteHeadRoutes(api)

	// Swap priorities
	body := map[string]interface{}{
		"order": []map[string]interface{}{
			{"id": vh1.ID, "priority": 2},
			{"id": vh2.ID, "priority": 1},
		},
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("PUT", "/api/v1/vote-heads/reorder", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify priorities changed
	var updatedVH1 models.VoteHead
	db.First(&updatedVH1, vh1.ID)
	assert.Equal(t, 2, updatedVH1.Priority)
}
