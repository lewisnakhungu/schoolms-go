package routes

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"schoolms-go/middleware"
	"schoolms-go/models"
	"schoolms-go/services"
	"time"

	"github.com/gin-gonic/gin"
)

// MPESA Configuration - loaded from environment
type MPESAConfig struct {
	ConsumerKey    string
	ConsumerSecret string
	Shortcode      string
	Passkey        string
	CallbackURL    string
	Environment    string // "sandbox" or "production"
}

var mpesaConfig MPESAConfig

func init() {
	// Load from env - these should be set in production
	mpesaConfig = MPESAConfig{
		ConsumerKey:    getEnv("MPESA_CONSUMER_KEY", ""),
		ConsumerSecret: getEnv("MPESA_CONSUMER_SECRET", ""),
		Shortcode:      getEnv("MPESA_SHORTCODE", "174379"), // Sandbox default
		Passkey:        getEnv("MPESA_PASSKEY", ""),
		CallbackURL:    getEnv("MPESA_CALLBACK_URL", ""),
		Environment:    getEnv("MPESA_ENV", "sandbox"),
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func RegisterMpesaRoutes(router *gin.RouterGroup) {
	mpesa := router.Group("/mpesa")
	{
		// C2B Webhooks - these are called by Safaricom, no auth required
		mpesa.POST("/c2b/validation", c2bValidation)
		mpesa.POST("/c2b/confirmation", c2bConfirmation)

		// Internal endpoints - require auth
		mpesa.Use(middleware.AuthMiddleware())
		mpesa.GET("/transactions", middleware.RoleGuard("SCHOOLADMIN", "FINANCE"), listMpesaTransactions)
		mpesa.POST("/transactions/:id/match", middleware.RoleGuard("SCHOOLADMIN", "FINANCE"), manualMatchTransaction)
	}
}

// C2B Validation - Called by Safaricom before accepting payment
// We validate that the student exists and the account is active
type C2BValidationRequest struct {
	TransactionType   string  `json:"TransactionType"`
	TransID           string  `json:"TransID"`
	TransTime         string  `json:"TransTime"`
	TransAmount       float64 `json:"TransAmount"`
	BusinessShortCode string  `json:"BusinessShortCode"`
	BillRefNumber     string  `json:"BillRefNumber"` // Student Admission Number
	InvoiceNumber     string  `json:"InvoiceNumber"`
	MSISDN            string  `json:"MSISDN"` // Phone number
	FirstName         string  `json:"FirstName"`
	MiddleName        string  `json:"MiddleName"`
	LastName          string  `json:"LastName"`
}

func c2bValidation(c *gin.Context) {
	var req C2BValidationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Safaricom expects specific response format
		c.JSON(http.StatusOK, gin.H{
			"ResultCode": 1,
			"ResultDesc": "Invalid request format",
		})
		return
	}

	// Log the incoming request for audit
	fmt.Printf("[M-PESA Validation] TransID: %s, Amount: %.2f, BillRef: %s, Phone: %s\n",
		req.TransID, req.TransAmount, req.BillRefNumber, req.MSISDN)

	// Look up student by admission number
	var student models.Student
	err := models.DB.Where("enrollment_number = ?", req.BillRefNumber).First(&student).Error

	if err != nil {
		// Student not found - reject transaction
		c.JSON(http.StatusOK, gin.H{
			"ResultCode": 1,
			"ResultDesc": fmt.Sprintf("Student with admission number %s not found", req.BillRefNumber),
		})
		return
	}

	// Accept the transaction
	c.JSON(http.StatusOK, gin.H{
		"ResultCode": 0,
		"ResultDesc": "Accepted",
	})
}

// C2B Confirmation - Called after payment is confirmed
// We create the payment record and run vote head allocation
func c2bConfirmation(c *gin.Context) {
	var req C2BValidationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"ResultCode": 1,
			"ResultDesc": "Invalid request format",
		})
		return
	}

	fmt.Printf("[M-PESA Confirmation] TransID: %s, Amount: %.2f, BillRef: %s\n",
		req.TransID, req.TransAmount, req.BillRefNumber)

	// Check for duplicate transaction
	var existing models.MPESATransaction
	if err := models.DB.Where("trans_id = ?", req.TransID).First(&existing).Error; err == nil {
		// Transaction already processed
		c.JSON(http.StatusOK, gin.H{
			"ResultCode": 0,
			"ResultDesc": "Already processed",
		})
		return
	}

	// Find student
	var student models.Student
	err := models.DB.Where("enrollment_number = ?", req.BillRefNumber).First(&student).Error

	// Create M-PESA transaction record
	mpesaTx := models.MPESATransaction{
		SchoolID:          student.SchoolID,
		TransactionType:   req.TransactionType,
		TransID:           req.TransID,
		TransTime:         req.TransTime,
		TransAmount:       req.TransAmount,
		BusinessShortCode: req.BusinessShortCode,
		BillRefNumber:     req.BillRefNumber,
		InvoiceNumber:     req.InvoiceNumber,
		MSISDN:            req.MSISDN,
		FirstName:         req.FirstName,
		MiddleName:        req.MiddleName,
		LastName:          req.LastName,
		Status:            "PENDING",
		CreatedAt:         time.Now(),
	}

	if err != nil {
		// Student not found - log for manual matching
		mpesaTx.Status = "UNMATCHED"
		mpesaTx.ErrorMessage = "Student not found by admission number"
		models.DB.Create(&mpesaTx)

		c.JSON(http.StatusOK, gin.H{
			"ResultCode": 0,
			"ResultDesc": "Logged for manual matching",
		})
		return
	}

	// Create payment record
	payment := models.Payment{
		StudentID: student.ID,
		SchoolID:  student.SchoolID,
		Amount:    req.TransAmount,
		Method:    "MPESA",
		Reference: req.TransID,
	}

	if err := models.DB.Create(&payment).Error; err != nil {
		mpesaTx.Status = "FAILED"
		mpesaTx.ErrorMessage = "Failed to create payment record"
		models.DB.Create(&mpesaTx)

		c.JSON(http.StatusOK, gin.H{
			"ResultCode": 0,
			"ResultDesc": "Error logged",
		})
		return
	}

	// Allocate to vote heads
	allocations, err := services.AllocatePaymentToVoteHeads(&payment, student.ID, student.SchoolID)
	if err != nil {
		fmt.Printf("[M-PESA] Vote head allocation failed: %v\n", err)
	} else {
		fmt.Printf("[M-PESA] Allocated to %d vote heads\n", len(allocations))
	}

	// Update M-PESA transaction
	mpesaTx.Status = "MATCHED"
	mpesaTx.PaymentID = &payment.ID
	mpesaTx.MatchedStudentID = &student.ID
	models.DB.Create(&mpesaTx)

	// TODO: Send SMS confirmation
	// sendSMSConfirmation(req.MSISDN, student.Name, req.TransAmount)

	c.JSON(http.StatusOK, gin.H{
		"ResultCode": 0,
		"ResultDesc": "Success",
	})
}

// List M-PESA transactions for admin review
func listMpesaTransactions(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	status := c.Query("status") // PENDING, MATCHED, UNMATCHED, FAILED

	query := models.DB.Where("school_id = ?", schoolID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var transactions []models.MPESATransaction
	query.Order("created_at DESC").Limit(100).Find(&transactions)

	c.JSON(http.StatusOK, transactions)
}

// Manual match for unmatched transactions
func manualMatchTransaction(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	txID := c.Param("id")

	var tx models.MPESATransaction
	if err := models.DB.Where("id = ? AND school_id = ?", txID, schoolID).First(&tx).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	if tx.Status == "MATCHED" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already matched"})
		return
	}

	var input struct {
		StudentID uint `json:"student_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create payment
	payment := models.Payment{
		StudentID: input.StudentID,
		SchoolID:  schoolID,
		Amount:    tx.TransAmount,
		Method:    "MPESA",
		Reference: tx.TransID,
	}
	models.DB.Create(&payment)

	// Allocate
	services.AllocatePaymentToVoteHeads(&payment, input.StudentID, schoolID)

	// Update transaction
	tx.Status = "MATCHED"
	tx.PaymentID = &payment.ID
	tx.MatchedStudentID = &input.StudentID
	models.DB.Save(&tx)

	c.JSON(http.StatusOK, gin.H{"message": "Transaction matched and payment created"})
}

// --- Utility: Get OAuth Token ---
func getMPESAAccessToken() (string, error) {
	baseURL := "https://sandbox.safaricom.co.ke"
	if mpesaConfig.Environment == "production" {
		baseURL = "https://api.safaricom.co.ke"
	}

	url := baseURL + "/oauth/v1/generate?grant_type=client_credentials"

	auth := base64.StdEncoding.EncodeToString(
		[]byte(mpesaConfig.ConsumerKey + ":" + mpesaConfig.ConsumerSecret))

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", "Basic "+auth)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result struct {
		AccessToken string `json:"access_token"`
	}
	json.Unmarshal(body, &result)

	return result.AccessToken, nil
}
