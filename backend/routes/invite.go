package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreateInviteInput struct {
	Role string `json:"role" binding:"required,oneof=TEACHER STUDENT"`
}

func RegisterInviteRoutes(router *gin.RouterGroup) {
	// SchoolAdmin only
	invites := router.Group("/invites")
	invites.Use(middleware.AuthMiddleware(), middleware.RoleGuard("SCHOOLADMIN"))
	{
		invites.POST("", createInvite)
		invites.GET("", listInvites)
	}
}

func createInvite(c *gin.Context) {
	// Get SchoolID from context
	schoolIDVal, exists := c.Get("schoolID")
	if !exists {
		c.JSON(http.StatusForbidden, gin.H{"error": "School scope required"})
		return
	}
	schoolID := schoolIDVal.(uint)

	var input CreateInviteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	invite := models.Invite{
		Code:      uuid.New(),
		Role:      input.Role,
		SchoolID:  schoolID,                       // Scoped to creator's school
		ExpiresAt: time.Now().Add(48 * time.Hour), // 2 days expiration
		IsUsed:    false,
	}

	if err := models.DB.Create(&invite).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invite"})
		return
	}

	c.JSON(http.StatusCreated, invite)
}

func listInvites(c *gin.Context) {
	schoolIDVal, exists := c.Get("schoolID")
	if !exists {
		c.JSON(http.StatusForbidden, gin.H{"error": "School scope required"})
		return
	}
	schoolID := schoolIDVal.(uint)

	var invites []models.Invite
	// Tenant isolation mandatory
	models.DB.Where("school_id = ?", schoolID).Find(&invites)

	c.JSON(http.StatusOK, invites)
}
