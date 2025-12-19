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
		// Finance, Admin, and Teacher routes
		adminFinance := finance.Group("")
		adminFinance.Use(middleware.RoleGuard("SCHOOLADMIN", "TEACHER", "FINANCE"))
		{
			adminFinance.POST("/fees", createFeeStructure)
			adminFinance.GET("/fees", listFeeStructures)
			adminFinance.POST("/payments", recordPayment)
			adminFinance.GET("/payments", listPayments)
			adminFinance.GET("/students/:id/balance", getStudentBalance)
			adminFinance.GET("/dashboard-stats", getFinanceDashboardStats)
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

// listFeeStructures - List all fee structures for school
func listFeeStructures(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var fees []models.FeeStructure
	models.DB.Where("school_id = ?", schoolID).
		Preload("Class").
		Order("academic_year DESC").
		Find(&fees)

	c.JSON(http.StatusOK, fees)
}

// listPayments - List all payments for school
func listPayments(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	studentID := c.Query("student_id")

	query := models.DB.Where("school_id = ?", schoolID).
		Preload("Student").Preload("Student.User")

	if studentID != "" {
		query = query.Where("student_id = ?", studentID)
	}

	var payments []models.Payment
	query.Order("created_at DESC").Find(&payments)

	c.JSON(http.StatusOK, payments)
}

// getFinanceDashboardStats - Get finance overview stats
func getFinanceDashboardStats(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	// Total fees expected
	var totalFeesExpected float64
	models.DB.Model(&models.FeeStructure{}).
		Where("school_id = ?", schoolID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalFeesExpected)

	// Total students with fees
	var studentsWithFees int64
	models.DB.Model(&models.Student{}).
		Where("school_id = ? AND class_id IS NOT NULL AND status = ?", schoolID, "ENROLLED").
		Count(&studentsWithFees)

	// Total amount collected
	var totalCollected float64
	models.DB.Model(&models.Payment{}).
		Where("school_id = ?", schoolID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalCollected)

	// Number of payments
	var paymentCount int64
	models.DB.Model(&models.Payment{}).
		Where("school_id = ?", schoolID).
		Count(&paymentCount)

	// Recent payments (last 10)
	var recentPayments []models.Payment
	models.DB.Where("school_id = ?", schoolID).
		Preload("Student").Preload("Student.User").
		Order("created_at DESC").
		Limit(10).
		Find(&recentPayments)

	// Defaulters count (students with balance > 0)
	// This is complex, so we'll do it with a subquery approach
	var defaultersCount int64
	rows, _ := models.DB.Raw(`
		SELECT COUNT(DISTINCT s.id) 
		FROM students s
		JOIN fee_structures f ON s.class_id = f.class_id AND s.school_id = f.school_id
		LEFT JOIN (
			SELECT student_id, COALESCE(SUM(amount), 0) as paid
			FROM payments WHERE school_id = ?
			GROUP BY student_id
		) p ON s.id = p.student_id
		WHERE s.school_id = ? 
		AND s.status = 'ENROLLED'
		AND f.amount > COALESCE(p.paid, 0)
	`, schoolID, schoolID).Rows()
	if rows != nil {
		if rows.Next() {
			rows.Scan(&defaultersCount)
		}
		rows.Close()
	}

	// Collection rate
	var collectionRate float64
	totalExpected := totalFeesExpected * float64(studentsWithFees)
	if totalExpected > 0 {
		collectionRate = (totalCollected / totalExpected) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"total_fees_expected": totalExpected,
		"total_collected":     totalCollected,
		"outstanding_balance": totalExpected - totalCollected,
		"collection_rate":     collectionRate,
		"total_students":      studentsWithFees,
		"total_payments":      paymentCount,
		"defaulters_count":    defaultersCount,
		"recent_payments":     recentPayments,
	})
}
