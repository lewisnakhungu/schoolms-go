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
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// TestSuite is the main test suite for all routes
type TestSuite struct {
	suite.Suite
	db     *gorm.DB
	router *gin.Engine
	school *models.School
	admin  *models.User
	token  string
}

// SetupSuite runs once before all tests
func (s *TestSuite) SetupSuite() {
	gin.SetMode(gin.TestMode)

	// Use in-memory SQLite for testing
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	s.Require().NoError(err)

	// Migrate all models
	db.AutoMigrate(
		&models.User{}, &models.School{}, &models.Invite{},
		&models.Class{}, &models.Student{},
		&models.FeeStructure{}, &models.Payment{},
		&models.Ticket{}, &models.Notification{}, &models.NotificationRead{},
		&models.ClassContent{}, &models.Grade{},
		&models.Attendance{}, &models.Timetable{}, &models.ParentStudent{},
		&models.VoteHead{}, &models.FeeItem{}, &models.VoteHeadBalance{}, &models.PaymentAllocation{}, &models.MPESATransaction{},
		&models.IntakeGroup{}, &models.Course{}, &models.Module{}, &models.IndustrialAttachment{},
		&models.AuditLog{},
	)

	models.DB = db
	s.db = db

	// Create test school
	s.school = &models.School{
		Name:    "Test School",
		Address: "123 Test Street",
	}
	db.Create(s.school)

	// Create admin user
	s.admin = &models.User{
		Email:        "admin@test.com",
		PasswordHash: "$2a$10$test",
		Role:         "SCHOOLADMIN",
		SchoolID:     &s.school.ID,
	}
	db.Create(s.admin)

	// Setup router
	s.router = gin.New()
	api := s.router.Group("/api/v1")

	// Register all routes
	routes.RegisterAuthRoutes(api)
	routes.RegisterClassRoutes(api)
	routes.RegisterStudentRoutes(api)
	routes.RegisterFinanceRoutes(api)
	routes.RegisterVoteHeadRoutes(api)
	routes.RegisterTVETRoutes(api)
	routes.RegisterAttendanceRoutes(api)
	routes.RegisterTimetableRoutes(api)
}

// TearDownSuite runs once after all tests
func (s *TestSuite) TearDownSuite() {
	sqlDB, _ := s.db.DB()
	sqlDB.Close()
}

// Helper to make authenticated requests
func (s *TestSuite) request(method, path string, body interface{}) *httptest.ResponseRecorder {
	var req *http.Request
	if body != nil {
		jsonBody, _ := json.Marshal(body)
		req, _ = http.NewRequest(method, path, bytes.NewBuffer(jsonBody))
	} else {
		req, _ = http.NewRequest(method, path, nil)
	}
	req.Header.Set("Content-Type", "application/json")
	// In real tests, add JWT token here
	// req.Header.Set("Authorization", "Bearer "+s.token)

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)
	return w
}

func TestRoutesSuite(t *testing.T) {
	suite.Run(t, new(TestSuite))
}
