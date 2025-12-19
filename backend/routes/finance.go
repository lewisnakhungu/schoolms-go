package routes

import (
	"fmt"
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
			adminFinance.GET("/receipts/:id", getReceipt)
			adminFinance.GET("/receipts/:id/print", getReceiptPrint)
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

// getReceipt - Returns receipt data as JSON
func getReceipt(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	paymentID := c.Param("id")

	var payment models.Payment
	if err := models.DB.Where("id = ? AND school_id = ?", paymentID, schoolID).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// Get student info
	var student models.Student
	models.DB.Where("id = ?", payment.StudentID).Preload("User").First(&student)

	// Get school info
	var school models.School
	models.DB.Where("id = ?", schoolID).First(&school)

	// Get vote head allocations if available
	var allocations []models.PaymentAllocation
	models.DB.Where("payment_id = ?", payment.ID).Preload("VoteHead").Find(&allocations)

	c.JSON(http.StatusOK, gin.H{
		"receipt_number": fmt.Sprintf("RCP-%06d", payment.ID),
		"payment":        payment,
		"student": gin.H{
			"id":     student.ID,
			"name":   student.User.Email,
			"adm_no": student.EnrollmentNumber,
		},
		"school": gin.H{
			"id":   school.ID,
			"name": school.Name,
		},
		"allocations": allocations,
		"date":        payment.CreatedAt.Format("2006-01-02 15:04:05"),
	})
}

// getReceiptPrint - Returns printable HTML receipt
func getReceiptPrint(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	paymentID := c.Param("id")
	format := c.DefaultQuery("format", "a4") // a4 or thermal

	var payment models.Payment
	if err := models.DB.Where("id = ? AND school_id = ?", paymentID, schoolID).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// Get student info
	var student models.Student
	models.DB.Where("id = ?", payment.StudentID).Preload("User").First(&student)

	// Get school info
	var school models.School
	models.DB.Where("id = ?", schoolID).First(&school)

	// Get vote head allocations
	var allocations []models.PaymentAllocation
	models.DB.Where("payment_id = ?", payment.ID).Preload("VoteHead").Find(&allocations)

	// Build vote head breakdown HTML
	voteHeadRows := ""
	for _, alloc := range allocations {
		voteHeadRows += fmt.Sprintf("<tr><td>%s</td><td style='text-align:right'>KES %.2f</td></tr>",
			alloc.VoteHead.Name, alloc.Amount)
	}

	var width, padding string
	if format == "thermal" {
		width = "80mm"
		padding = "5px"
	} else {
		width = "210mm"
		padding = "20px"
	}

	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Receipt #RCP-%06d</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: %s; width: %s; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 1.5em; }
        .header p { margin: 5px 0; color: #666; }
        table { width: 100%%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: left; }
        .total { font-weight: bold; font-size: 1.2em; }
        .footer { margin-top: 30px; text-align: center; font-size: 0.9em; color: #666; }
        .signature { margin-top: 50px; border-top: 1px solid #000; width: 200px; text-align: center; }
        @media print { body { width: auto; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>%s</h1>
        <p>Official Fee Receipt</p>
    </div>
    
    <table>
        <tr><th>Receipt No:</th><td>RCP-%06d</td></tr>
        <tr><th>Date:</th><td>%s</td></tr>
        <tr><th>Student:</th><td>%s (%s)</td></tr>
        <tr><th>Payment Method:</th><td>%s</td></tr>
        <tr><th>Reference:</th><td>%s</td></tr>
    </table>

    <h3>Vote Head Breakdown</h3>
    <table>
        <thead><tr><th>Vote Head</th><th style='text-align:right'>Amount</th></tr></thead>
        <tbody>%s</tbody>
    </table>

    <table>
        <tr class="total"><td>TOTAL PAID</td><td style='text-align:right'>KES %.2f</td></tr>
    </table>

    <div class="footer">
        <p>Thank you for your payment!</p>
        <div class="signature">Served By: _____________</div>
    </div>
</body>
</html>`,
		payment.ID, padding, width,
		school.Name,
		payment.ID,
		payment.CreatedAt.Format("2006-01-02 15:04"),
		student.User.Email, student.EnrollmentNumber,
		payment.Method,
		payment.Reference,
		voteHeadRows,
		payment.Amount)

	c.Header("Content-Type", "text/html")
	c.String(http.StatusOK, html)
}
