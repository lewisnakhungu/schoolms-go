package routes

import (
	"fmt"
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"
	"time"

	"github.com/gin-gonic/gin"
)

type UpdateStudentInput struct {
	ClassID          *uint  `json:"class_id"`
	EnrollmentNumber string `json:"enrollment_number"`
	Status           string `json:"status"`
}

type AdmitStudentInput struct {
	ClassID          *uint  `json:"class_id"`
	EnrollmentNumber string `json:"enrollment_number"`
}

type DischargeStudentInput struct {
	Reason string `json:"reason" binding:"required"`
}

func RegisterStudentRoutes(router *gin.RouterGroup) {
	students := router.Group("/students")
	students.Use(middleware.AuthMiddleware(), middleware.RoleGuard("SCHOOLADMIN", "TEACHER"))
	{
		students.GET("", listStudents)
		students.GET("/analytics", getStudentAnalytics)
		students.GET("/:id", getStudent)
		students.GET("/:id/financial-report", getStudentFinancialReport)
		students.PUT("/:id", updateStudent)
		students.POST("/:id/admit", admitStudent)
		students.POST("/:id/discharge", dischargeStudent)
	}
}

func listStudents(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	status := c.Query("status") // Optional filter: PENDING, ENROLLED, DISCHARGED

	query := models.DB.Where("school_id = ?", schoolID).Preload("User").Preload("Class")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var students []models.Student
	query.Order("created_at DESC").Find(&students)

	c.JSON(http.StatusOK, students)
}

func getStudent(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	studentID := c.Param("id")

	var student models.Student
	if err := models.DB.Where("id = ? AND school_id = ?", studentID, schoolID).
		Preload("User").Preload("Class").First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	c.JSON(http.StatusOK, student)
}

// getStudentAnalytics returns student counts and stats for dashboard
func getStudentAnalytics(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	// Total students by status
	var totalStudents, enrolledCount, pendingCount, dischargedCount int64
	models.DB.Model(&models.Student{}).Where("school_id = ?", schoolID).Count(&totalStudents)
	models.DB.Model(&models.Student{}).Where("school_id = ? AND status = ?", schoolID, "ENROLLED").Count(&enrolledCount)
	models.DB.Model(&models.Student{}).Where("school_id = ? AND status = ?", schoolID, "PENDING").Count(&pendingCount)
	models.DB.Model(&models.Student{}).Where("school_id = ? AND status = ?", schoolID, "DISCHARGED").Count(&dischargedCount)

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
		LEFT JOIN students s ON s.class_id = c.id AND s.status = 'ENROLLED'
		WHERE c.school_id = ?
		GROUP BY c.id, c.name
		ORDER BY c.name
	`, schoolID).Scan(&classCounts)

	// Unassigned students (no class)
	var unassignedCount int64
	models.DB.Model(&models.Student{}).Where("school_id = ? AND class_id IS NULL AND status != ?", schoolID, "DISCHARGED").Count(&unassignedCount)

	// Total classes
	var totalClasses int64
	models.DB.Model(&models.Class{}).Where("school_id = ?", schoolID).Count(&totalClasses)

	c.JSON(http.StatusOK, gin.H{
		"total_students":      totalStudents,
		"enrolled_students":   enrolledCount,
		"pending_students":    pendingCount,
		"discharged_students": dischargedCount,
		"total_classes":       totalClasses,
		"unassigned_students": unassignedCount,
		"students_by_class":   classCounts,
	})
}

func updateStudent(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
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
	if input.EnrollmentNumber != "" {
		student.EnrollmentNumber = input.EnrollmentNumber
	}
	if input.Status != "" {
		student.Status = input.Status
	}

	models.DB.Save(&student)
	models.DB.Preload("User").Preload("Class").First(&student, student.ID)
	c.JSON(http.StatusOK, student)
}

// admitStudent - Admit a pending student (set status to ENROLLED, assign class)
func admitStudent(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	studentID := c.Param("id")

	var input AdmitStudentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var student models.Student
	if err := models.DB.Where("id = ? AND school_id = ?", studentID, schoolID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	if student.Status == "DISCHARGED" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot admit a discharged student"})
		return
	}

	now := time.Now()
	student.Status = "ENROLLED"
	student.AdmissionDate = &now
	if input.ClassID != nil {
		student.ClassID = input.ClassID
	}
	if input.EnrollmentNumber != "" {
		student.EnrollmentNumber = input.EnrollmentNumber
	} else if student.EnrollmentNumber == "" || student.EnrollmentNumber == "PENDING" {
		// Generate enrollment number
		student.EnrollmentNumber = fmt.Sprintf("STU-%d-%d", schoolID, student.ID)
	}

	models.DB.Save(&student)
	models.DB.Preload("User").Preload("Class").First(&student, student.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Student admitted successfully",
		"student": student,
	})
}

// dischargeStudent - Discharge a student from the school
func dischargeStudent(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	studentID := c.Param("id")

	var input DischargeStudentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var student models.Student
	if err := models.DB.Where("id = ? AND school_id = ?", studentID, schoolID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	now := time.Now()
	student.Status = "DISCHARGED"
	student.DischargeDate = &now
	student.DischargeReason = input.Reason

	models.DB.Save(&student)

	c.JSON(http.StatusOK, gin.H{
		"message": "Student discharged successfully",
		"student": student,
	})
}

// getStudentFinancialReport - Get financial summary for a student
func getStudentFinancialReport(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	studentID := c.Param("id")

	var student models.Student
	if err := models.DB.Where("id = ? AND school_id = ?", studentID, schoolID).
		Preload("User").Preload("Class").First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	// Get total fees for the student's class
	var totalFees float64
	if student.ClassID != nil {
		models.DB.Model(&models.FeeStructure{}).
			Where("class_id = ? AND school_id = ?", *student.ClassID, schoolID).
			Select("COALESCE(SUM(amount), 0)").Scan(&totalFees)
	}

	// Get total payments
	var totalPayments float64
	models.DB.Model(&models.Payment{}).
		Where("student_id = ? AND school_id = ?", student.ID, schoolID).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalPayments)

	// Get payment history
	var payments []models.Payment
	models.DB.Where("student_id = ? AND school_id = ?", student.ID, schoolID).
		Order("payment_date DESC").Find(&payments)

	// Get fee structures
	var fees []models.FeeStructure
	if student.ClassID != nil {
		models.DB.Where("class_id = ? AND school_id = ?", *student.ClassID, schoolID).Find(&fees)
	}

	c.JSON(http.StatusOK, gin.H{
		"student":        student,
		"total_fees":     totalFees,
		"total_payments": totalPayments,
		"balance":        totalFees - totalPayments,
		"payments":       payments,
		"fee_structures": fees,
	})
}
