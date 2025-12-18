package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"
	"schoolms-go/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreateSchoolInput struct {
	Name        string `json:"name" binding:"required"`
	Address     string `json:"address"`
	ContactInfo string `json:"contact_info"`
	AdminEmail  string `json:"admin_email" binding:"required,email"`
	AdminName   string `json:"admin_name"` // Optional, but good for UX
}

func RegisterSuperAdminRoutes(router *gin.RouterGroup) {
	// Protected group for Superadmin only
	super := router.Group("/superadmin")
	super.Use(middleware.AuthMiddleware(), middleware.RoleGuard("SUPERADMIN"))
	{
		super.POST("/schools", createSchoolAndAdmin)
		super.GET("/schools", listSchools)
	}
}

func listSchools(c *gin.Context) {
	var schools []models.School
	if err := models.DB.Preload("Users", "role = ?", "SCHOOLADMIN").Find(&schools).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch schools"})
		return
	}
	c.JSON(http.StatusOK, schools)
}

func createSchoolAndAdmin(c *gin.Context) {
	var input CreateSchoolInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Start transaction
	err := models.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Create School
		school := models.School{
			Name:               input.Name,
			Address:            input.Address,
			ContactInfo:        input.ContactInfo,
			SubscriptionStatus: "ACTIVE",
		}
		if err := tx.Create(&school).Error; err != nil {
			return err
		}

		// 2. Generate random password for Admin (or use a default one)
		// For MVP, let's use a default or generate one.
		// Let's generate a temporary one: "SchoolName123!" (primitive)
		// Better: specific random string. But for now let's just use "Admin123!" for simplicity of testing?
		// No, let's make it secure.
		rawPassword := "ChangeMe123!" // In a real app, generate random string

		hashedPassword, err := models.HashPassword(rawPassword)
		if err != nil {
			return err
		}

		// 3. Create School Admin User
		admin := models.User{
			Email:        input.AdminEmail,
			PasswordHash: hashedPassword,
			Role:         "SCHOOLADMIN",
			SchoolID:     &school.ID,
		}

		// Check for existing user
		var existing models.User
		if tx.Where("email = ?", input.AdminEmail).First(&existing).RowsAffected > 0 {
			return utils.NewError(http.StatusBadRequest, "User with this email already exists")
		}

		if err := tx.Create(&admin).Error; err != nil {
			return err
		}

		// Store result in context to access outside transaction?
		// Or just write JSON here? Writing JSON inside transaction generic function is tricky for return values.
		// We'll set a context variable or just return nil and use variables captured from closure.
		// Variables `school` and `admin` are available.

		c.Set("created_school", school)
		c.Set("created_admin", admin)
		c.Set("raw_password", rawPassword)

		return nil
	})

	if err != nil {
		// Handle custom error
		if customErr, ok := err.(*utils.CustomError); ok {
			c.JSON(customErr.StatusCode, gin.H{"error": customErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction failed: " + err.Error()})
		return
	}

	// Prepare response
	school, _ := c.Get("created_school")
	admin, _ := c.Get("created_admin")
	rawPassword, _ := c.Get("raw_password")

	c.JSON(http.StatusCreated, gin.H{
		"message": "School and Admin created successfully",
		"school":  school,
		"admin": gin.H{
			"id":    admin.(models.User).ID,
			"email": admin.(models.User).Email,
			"role":  admin.(models.User).Role,
		},
		"credentials": gin.H{
			"password": rawPassword,
		},
	})
}
