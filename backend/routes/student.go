package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"

	"github.com/gin-gonic/gin"
)

// Simplified student creation (direct or link to user?)
// Requirement says "Student: UserID (FK)..."
// This implies Students must be Users first.
// So creating a Student means:
// 1. User exists (Role=STUDENT)
// 2. Link User to Class
// Or does "Create Student" imply creating the user + student record?
// MVP approach: Assume User exists (via Invite), and this endpoint assigns them to a Class and generates Student record?
// Or: SchoolAdmin creates Student profile and generates Invite?
// Let's stick to: User is created via Invite. Once User exists, Admin enrolls them?
// Or: Admin creates Student Record + User Record + Invite?
// Given "Student" table has "UserID", let's assume we link existing users.
// BUT, usually you enroll students before they sign up.
// Let's go with: Admin sees list of "Unenrolled Students" (Users with Role STUDENT but no Student record)?
// OR: When a User signs up with STUDENT role, a Student record is created automatically?
// Let's do the automatic creation in Signup if role is STUDENT.
// So this route is for updating/listing students.

type UpdateStudentInput struct {
	ClassID *uint `json:"class_id"`
}

func RegisterStudentRoutes(router *gin.RouterGroup) {
	students := router.Group("/students")
	students.Use(middleware.AuthMiddleware(), middleware.RoleGuard("SCHOOLADMIN", "TEACHER"))
	{
		students.GET("", listStudents)
		students.GET("/analytics", getStudentAnalytics)
		students.PUT("/:id", updateStudent)
	}
}

func listStudents(c *gin.Context) {
	schoolIDVal, exists := c.Get("schoolID")
	if !exists {
		c.JSON(http.StatusForbidden, gin.H{"error": "School scope required"})
		return
	}
	schoolID := schoolIDVal.(uint)

	var students []models.Student
	// Scope to school
	models.DB.Where("school_id = ?", schoolID).Preload("User").Preload("Class").Find(&students)

	c.JSON(http.StatusOK, students)
}

// getStudentAnalytics returns student counts and stats for dashboard
func getStudentAnalytics(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	// Total students
	var totalStudents int64
	models.DB.Model(&models.Student{}).Where("school_id = ?", schoolID).Count(&totalStudents)

	// Students per class
	type ClassCount struct {
		ClassName string `json:"class_name"`
		ClassID   uint   `json:"class_id"`
		Count     int64  `json:"count"`
	}

	var classCounts []ClassCount
	models.DB.Raw(`
		SELECT c.name as class_name, c.id as class_id, COUNT(s.id) as count
		FROM classes c
		LEFT JOIN students s ON s.class_id = c.id
		WHERE c.school_id = ?
		GROUP BY c.id, c.name
		ORDER BY c.name
	`, schoolID).Scan(&classCounts)

	// Unassigned students (no class)
	var unassignedCount int64
	models.DB.Model(&models.Student{}).Where("school_id = ? AND class_id IS NULL", schoolID).Count(&unassignedCount)

	// Total classes
	var totalClasses int64
	models.DB.Model(&models.Class{}).Where("school_id = ?", schoolID).Count(&totalClasses)

	c.JSON(http.StatusOK, gin.H{
		"total_students":      totalStudents,
		"total_classes":       totalClasses,
		"unassigned_students": unassignedCount,
		"students_by_class":   classCounts,
	})
}

func updateStudent(c *gin.Context) {
	schoolIDVal, exists := c.Get("schoolID")
	if !exists {
		c.JSON(http.StatusForbidden, gin.H{"error": "School scope required"})
		return
	}
	schoolID := schoolIDVal.(uint)
	studentID := c.Param("id")

	var input UpdateStudentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var student models.Student
	if err := models.DB.Where("id = ? AND school_id = ?", studentID, schoolID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	if input.ClassID != nil {
		student.ClassID = input.ClassID
	}

	models.DB.Save(&student)
	c.JSON(http.StatusOK, student)
}
