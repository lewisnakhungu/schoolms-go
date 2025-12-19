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
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupAttendanceTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	db.AutoMigrate(
		&models.User{}, &models.School{}, &models.Student{}, &models.Class{},
		&models.Attendance{},
	)

	models.DB = db
	return db
}

// ============ Attendance Tests ============

func TestMarkAttendance(t *testing.T) {
	db := setupAttendanceTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	teacher := models.User{Email: "teacher@test.com", Role: "TEACHER", SchoolID: &school.ID}
	db.Create(&teacher)

	class := models.Class{Name: "Form 1", SchoolID: school.ID, TeacherID: &teacher.ID}
	db.Create(&class)

	user := models.User{Email: "student@test.com", Role: "STUDENT", SchoolID: &school.ID}
	db.Create(&user)

	student := models.Student{UserID: user.ID, SchoolID: school.ID, ClassID: &class.ID, Status: "ACTIVE"}
	db.Create(&student)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", teacher.ID)
		c.Set("schoolID", school.ID)
		c.Set("role", "TEACHER")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterAttendanceRoutes(api)

	body := map[string]interface{}{
		"student_id": student.ID,
		"class_id":   class.ID,
		"date":       "2024-01-15",
		"status":     "PRESENT",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/attendance/mark", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify attendance was recorded
	var attendance models.Attendance
	err := db.Where("student_id = ?", student.ID).First(&attendance).Error
	assert.NoError(t, err)
	assert.Equal(t, "PRESENT", attendance.Status)
}

func TestBulkMarkAttendance(t *testing.T) {
	db := setupAttendanceTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	teacher := models.User{Email: "teacher@test.com", Role: "TEACHER", SchoolID: &school.ID}
	db.Create(&teacher)

	class := models.Class{Name: "Form 1", SchoolID: school.ID, TeacherID: &teacher.ID}
	db.Create(&class)

	// Create multiple students
	var students []models.Student
	for i := 0; i < 3; i++ {
		user := models.User{Email: "student" + string(rune('0'+i)) + "@test.com", Role: "STUDENT", SchoolID: &school.ID}
		db.Create(&user)
		s := models.Student{UserID: user.ID, SchoolID: school.ID, ClassID: &class.ID, Status: "ACTIVE"}
		db.Create(&s)
		students = append(students, s)
	}

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", teacher.ID)
		c.Set("schoolID", school.ID)
		c.Set("role", "TEACHER")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterAttendanceRoutes(api)

	body := map[string]interface{}{
		"class_id": class.ID,
		"date":     "2024-01-15",
		"records": []map[string]interface{}{
			{"student_id": students[0].ID, "status": "PRESENT"},
			{"student_id": students[1].ID, "status": "ABSENT"},
			{"student_id": students[2].ID, "status": "LATE"},
		},
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/attendance/bulk", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify all attendance records
	var count int64
	db.Model(&models.Attendance{}).Where("class_id = ?", class.ID).Count(&count)
	assert.Equal(t, int64(3), count)
}

func TestGetClassAttendance(t *testing.T) {
	db := setupAttendanceTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	class := models.Class{Name: "Form 1", SchoolID: school.ID}
	db.Create(&class)

	user := models.User{Email: "student@test.com", Role: "STUDENT", SchoolID: &school.ID}
	db.Create(&user)

	student := models.Student{UserID: user.ID, SchoolID: school.ID, ClassID: &class.ID, Status: "ACTIVE"}
	db.Create(&student)

	date1, _ := time.Parse("2006-01-02", "2024-01-15")
	date2, _ := time.Parse("2006-01-02", "2024-01-16")

	db.Create(&models.Attendance{StudentID: student.ID, ClassID: class.ID, SchoolID: school.ID, Date: date1, Status: "PRESENT"})
	db.Create(&models.Attendance{StudentID: student.ID, ClassID: class.ID, SchoolID: school.ID, Date: date2, Status: "ABSENT"})

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "TEACHER")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterAttendanceRoutes(api)

	req, _ := http.NewRequest("GET", "/api/v1/attendance/class/1?date=2024-01-15", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// ============ Timetable Tests ============

func setupTimetableTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	db.AutoMigrate(
		&models.User{}, &models.School{}, &models.Class{},
		&models.Timetable{},
	)

	models.DB = db
	return db
}

func TestCreateTimetableEntry(t *testing.T) {
	db := setupTimetableTestDB(t)
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
	routes.RegisterTimetableRoutes(api)

	body := map[string]interface{}{
		"class_id":    class.ID,
		"day_of_week": 1, // Monday
		"start_time":  "08:00",
		"end_time":    "09:00",
		"subject":     "Mathematics",
		"room":        "Room 101",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/timetable", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "Mathematics", response["subject"])
	assert.Equal(t, "Room 101", response["room"])
}

func TestGetClassTimetable(t *testing.T) {
	db := setupTimetableTestDB(t)
	defer func() { sqlDB, _ := db.DB(); sqlDB.Close() }()

	school := models.School{Name: "Test School"}
	db.Create(&school)

	class := models.Class{Name: "Form 1", SchoolID: school.ID}
	db.Create(&class)

	// Create timetable entries
	db.Create(&models.Timetable{ClassID: class.ID, SchoolID: school.ID, DayOfWeek: 1, StartTime: "08:00", EndTime: "09:00", Subject: "Math"})
	db.Create(&models.Timetable{ClassID: class.ID, SchoolID: school.ID, DayOfWeek: 1, StartTime: "09:00", EndTime: "10:00", Subject: "English"})
	db.Create(&models.Timetable{ClassID: class.ID, SchoolID: school.ID, DayOfWeek: 2, StartTime: "08:00", EndTime: "09:00", Subject: "Science"})

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Set("schoolID", school.ID)
		c.Set("role", "TEACHER")
		c.Next()
	})

	api := router.Group("/api/v1")
	routes.RegisterTimetableRoutes(api)

	req, _ := http.NewRequest("GET", "/api/v1/timetable/class/1", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var timetable []models.Timetable
	json.Unmarshal(w.Body.Bytes(), &timetable)
	assert.Len(t, timetable, 3)
}
