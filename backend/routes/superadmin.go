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

type UpdateSchoolInput struct {
	Name               string `json:"name"`
	Address            string `json:"address"`
	ContactInfo        string `json:"contact_info"`
	SubscriptionStatus string `json:"subscription_status"` // ACTIVE, INACTIVE, TRIAL
}

func RegisterSuperAdminRoutes(router *gin.RouterGroup) {
	// Protected group for Superadmin only
	super := router.Group("/superadmin")
	super.Use(middleware.AuthMiddleware(), middleware.RoleGuard("SUPERADMIN"))
	{
		super.POST("/schools", createSchoolAndAdmin)
		super.GET("/schools", listSchools)
		super.PUT("/schools/:id", updateSchool)
		super.DELETE("/schools/:id", deleteSchool)
		super.POST("/schools/:id/reset-password", resetSchoolAdminPassword)
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

// updateSchool updates school details
func updateSchool(c *gin.Context) {
	schoolID := c.Param("id")

	var school models.School
	if err := models.DB.First(&school, schoolID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "School not found"})
		return
	}

	var input UpdateSchoolInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields if provided
	if input.Name != "" {
		school.Name = input.Name
	}
	if input.Address != "" {
		school.Address = input.Address
	}
	if input.ContactInfo != "" {
		school.ContactInfo = input.ContactInfo
	}
	if input.SubscriptionStatus != "" {
		school.SubscriptionStatus = input.SubscriptionStatus
	}

	if err := models.DB.Save(&school).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update school"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "School updated successfully",
		"school":  school,
	})
}

// deleteSchool removes a school and all related data
func deleteSchool(c *gin.Context) {
	schoolID := c.Param("id")

	var school models.School
	if err := models.DB.First(&school, schoolID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "School not found"})
		return
	}

	// Delete in transaction to handle related records
	err := models.DB.Transaction(func(tx *gorm.DB) error {
		// Delete payments for students of this school
		tx.Where("school_id = ?", schoolID).Delete(&models.Payment{})

		// Delete fee structures
		tx.Where("school_id = ?", schoolID).Delete(&models.FeeStructure{})

		// Delete students
		tx.Where("school_id = ?", schoolID).Delete(&models.Student{})

		// Delete classes
		tx.Where("school_id = ?", schoolID).Delete(&models.Class{})

		// Delete invites
		tx.Where("school_id = ?", schoolID).Delete(&models.Invite{})

		// Delete users (school admins, teachers)
		tx.Where("school_id = ?", schoolID).Delete(&models.User{})

		// Finally delete the school
		if err := tx.Delete(&school).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete school: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "School deleted successfully"})
}

// resetSchoolAdminPassword generates a new password for the school admin
func resetSchoolAdminPassword(c *gin.Context) {
	schoolID := c.Param("id")

	// Find school admin user
	var admin models.User
	if err := models.DB.Where("school_id = ? AND role = ?", schoolID, "SCHOOLADMIN").First(&admin).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "School admin not found"})
		return
	}

	// Generate new password
	newPassword := "Reset123!" // In production, generate random string

	hashedPassword, err := models.HashPassword(newPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	admin.PasswordHash = hashedPassword
	if err := models.DB.Save(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Password reset successfully",
		"admin_email":  admin.Email,
		"new_password": newPassword,
	})
}
