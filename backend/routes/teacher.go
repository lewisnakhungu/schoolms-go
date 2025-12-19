package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"

	"github.com/gin-gonic/gin"
)

func RegisterTeacherRoutes(router *gin.RouterGroup) {
	teachers := router.Group("/teachers")
	teachers.Use(middleware.AuthMiddleware(), middleware.RoleGuard("TEACHER"))
	{
		teachers.GET("/me", getTeacherProfile)
		teachers.GET("/my-classes", getMyClasses)
		teachers.GET("/my-students", getMyStudents)
	}
}

// getTeacherProfile - Get teacher's profile with assigned classes
func getTeacherProfile(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)

	// Get user info
	var user models.User
	if err := models.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get school info
	var school models.School
	models.DB.First(&school, schoolID)

	// Get assigned classes
	var classes []models.Class
	models.DB.Where("teacher_id = ? AND school_id = ?", userID, schoolID).Find(&classes)

	// Count total students in my classes
	var totalStudents int64
	if len(classes) > 0 {
		classIDs := make([]uint, len(classes))
		for i, c := range classes {
			classIDs[i] = c.ID
		}
		models.DB.Model(&models.Student{}).
			Where("class_id IN ? AND status = ?", classIDs, "ENROLLED").
			Count(&totalStudents)
	}

	c.JSON(http.StatusOK, gin.H{
		"teacher": gin.H{
			"id":        user.ID,
			"email":     user.Email,
			"full_name": user.FullName,
		},
		"school": gin.H{
			"id":   school.ID,
			"name": school.Name,
		},
		"classes":        classes,
		"total_classes":  len(classes),
		"total_students": totalStudents,
	})
}

// getMyClasses - List classes assigned to teacher
func getMyClasses(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)

	type ClassWithCount struct {
		models.Class
		StudentCount int64 `json:"student_count"`
	}

	var classes []models.Class
	models.DB.Where("teacher_id = ? AND school_id = ?", userID, schoolID).Find(&classes)

	result := make([]ClassWithCount, len(classes))
	for i, class := range classes {
		var count int64
		models.DB.Model(&models.Student{}).
			Where("class_id = ? AND status = ?", class.ID, "ENROLLED").
			Count(&count)
		result[i] = ClassWithCount{
			Class:        class,
			StudentCount: count,
		}
	}

	c.JSON(http.StatusOK, result)
}

// getMyStudents - List students in teacher's classes
func getMyStudents(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)
	classID := c.Query("class_id") // Optional filter by class

	// Get teacher's class IDs
	var classes []models.Class
	models.DB.Where("teacher_id = ? AND school_id = ?", userID, schoolID).Find(&classes)

	if len(classes) == 0 {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}

	classIDs := make([]uint, len(classes))
	for i, c := range classes {
		classIDs[i] = c.ID
	}

	query := models.DB.Where("class_id IN ? AND school_id = ?", classIDs, schoolID).
		Preload("User").Preload("Class")

	if classID != "" {
		query = query.Where("class_id = ?", classID)
	}

	var students []models.Student
	query.Order("created_at DESC").Find(&students)

	c.JSON(http.StatusOK, students)
}
