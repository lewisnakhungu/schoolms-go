package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"

	"github.com/gin-gonic/gin"
)

type CreateFeeInput struct {
	ClassID      uint    `json:"class_id" binding:"required"`
	Amount       float64 `json:"amount" binding:"required"`
	AcademicYear string  `json:"academic_year" binding:"required"`
}

type CreatePaymentInput struct {
	StudentID uint    `json:"student_id" binding:"required"`
	Amount    float64 `json:"amount" binding:"required"`
	Method    string  `json:"method" binding:"required"`
	Reference string  `json:"reference"`
}

func RegisterFinanceRoutes(router *gin.RouterGroup) {
	finance := router.Group("/finance")
	finance.Use(middleware.AuthMiddleware())
	{
		// Admin/Teacher only routes
		adminFinance := finance.Group("")
		adminFinance.Use(middleware.RoleGuard("SCHOOLADMIN", "TEACHER"))
		{
			adminFinance.POST("/fees", createFeeStructure)
			adminFinance.POST("/payments", recordPayment)
			adminFinance.GET("/students/:id/balance", getStudentBalance)
		}

		// Student can view their own balance
		finance.GET("/my-balance", middleware.RoleGuard("STUDENT"), getMyBalance)
	}
}

func createFeeStructure(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var input CreateFeeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fee := models.FeeStructure{
		ClassID:      input.ClassID,
		Amount:       input.Amount,
		AcademicYear: input.AcademicYear,
		SchoolID:     schoolID,
	}

	if err := models.DB.Create(&fee).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create fee structure"})
		return
	}

	c.JSON(http.StatusCreated, fee)
}

func recordPayment(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var input CreatePaymentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	payment := models.Payment{
		StudentID: input.StudentID,
		Amount:    input.Amount,
		Method:    input.Method,
		Reference: input.Reference,
		SchoolID:  schoolID,
	}

	if err := models.DB.Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record payment"})
		return
	}

	c.JSON(http.StatusCreated, payment)
}

func getStudentBalance(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	studentID := c.Param("id")

	// 1. Get Student to find ClassID
	var student models.Student
	if err := models.DB.Where("id = ? AND school_id = ?", studentID, schoolID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	if student.ClassID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Student is not assigned to a class"})
		return
	}

	// 2. Calculate Total Fees for Class
	var totalFees float64
	models.DB.Model(&models.FeeStructure{}).
		Where("class_id = ? AND school_id = ?", *student.ClassID, schoolID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalFees)

	// 3. Calculate Total Payments
	var totalPayments float64
	models.DB.Model(&models.Payment{}).
		Where("student_id = ? AND school_id = ?", studentID, schoolID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalPayments)

	balance := totalFees - totalPayments

	c.JSON(http.StatusOK, gin.H{
		"student_id":     student.ID,
		"total_fees":     totalFees,
		"total_payments": totalPayments,
		"balance":        balance,
	})
}

// getMyBalance allows a student to see their own balance using their user_id from JWT
func getMyBalance(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)

	// Find student by user_id
	var student models.Student
	if err := models.DB.Where("user_id = ? AND school_id = ?", userID, schoolID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student profile not found"})
		return
	}

	if student.ClassID == nil {
		c.JSON(http.StatusOK, gin.H{
			"student_id":     student.ID,
			"total_fees":     0,
			"total_payments": 0,
			"balance":        0,
			"message":        "Not assigned to a class yet",
		})
		return
	}

	// Calculate Total Fees for Class
	var totalFees float64
	models.DB.Model(&models.FeeStructure{}).
		Where("class_id = ? AND school_id = ?", *student.ClassID, schoolID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalFees)

	// Calculate Total Payments
	var totalPayments float64
	models.DB.Model(&models.Payment{}).
		Where("student_id = ? AND school_id = ?", student.ID, schoolID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalPayments)

	balance := totalFees - totalPayments

	c.JSON(http.StatusOK, gin.H{
		"student_id":     student.ID,
		"total_fees":     totalFees,
		"total_payments": totalPayments,
		"balance":        balance,
	})
}
