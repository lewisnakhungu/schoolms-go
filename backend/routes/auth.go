package routes

import (
	"fmt"
	"net/http"
	"schoolms-go/models"
	"schoolms-go/utils"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Login request body
type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Signup request body
type SignupInput struct {
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=6"`
	InviteCode string `json:"invite_code" binding:"required"`
	// Role and SchoolID are determined by the invite
}

func RegisterAuthRoutes(router *gin.RouterGroup) {
	auth := router.Group("/auth")
	{
		auth.POST("/signup", signup)
		auth.POST("/login", login)
	}
}

func signup(c *gin.Context) {
	var input SignupInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Validate Invite Code
	var invite models.Invite
	if err := models.DB.Where("code = ? AND is_used = ?", input.InviteCode, false).First(&invite).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or used invite code"})
		return
	}

	if invite.ExpiresAt.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invite code expired"})
		return
	}

	// 2. Check if email exists
	var existing models.User
	if result := models.DB.Where("email = ?", input.Email).First(&existing); result.RowsAffected > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already registered"})
		return
	}

	// 3. Hash Password
	hashedPassword, err := models.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// 4. Create User (Atomic transaction with invite update)
	err = models.DB.Transaction(func(tx *gorm.DB) error {
		user := models.User{
			Email:        input.Email,
			PasswordHash: hashedPassword,
			Role:         invite.Role,
			SchoolID:     &invite.SchoolID,
			// FullName logic if needed
		}

		if err := tx.Create(&user).Error; err != nil {
			return err
		}

		// Mark invite as used
		invite.IsUsed = true
		if err := tx.Save(&invite).Error; err != nil {
			return err
		}

		// If Role is STUDENT, create Student record automatically
		if user.Role == "STUDENT" {
			student := models.Student{
				UserID:           user.ID,
				SchoolID:         *user.SchoolID,
				EnrollmentNumber: "PENDING", // Update later
			}
			if err := tx.Create(&student).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Signup failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": fmt.Sprintf("%s created successfully!", invite.Role),
		"email":   input.Email,
		"role":    invite.Role,
	})
}

func login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if result := models.DB.Where("email = ?", input.Email).First(&user); result.RowsAffected == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if !models.CheckPasswordHash(input.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, err := utils.GenerateToken(user.ID, user.Role, user.SchoolID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": token,
		"token_type":   "Bearer",
		"user": gin.H{
			"id":        user.ID,
			"email":     user.Email,
			"role":      user.Role,
			"school_id": user.SchoolID,
		},
	})
}
