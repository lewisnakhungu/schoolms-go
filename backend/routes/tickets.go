package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"

	"github.com/gin-gonic/gin"
)

type CreateTicketInput struct {
	Subject     string `json:"subject" binding:"required"`
	Description string `json:"description" binding:"required"`
	Category    string `json:"category" binding:"required,oneof=PASSWORD_RESET TECHNICAL BILLING OTHER"`
	Priority    string `json:"priority" binding:"omitempty,oneof=LOW MEDIUM HIGH"`
}

type UpdateTicketInput struct {
	Status   string `json:"status" binding:"omitempty,oneof=OPEN IN_PROGRESS RESOLVED CLOSED"`
	Response string `json:"response"`
}

func RegisterTicketRoutes(router *gin.RouterGroup) {
	tickets := router.Group("/tickets")
	tickets.Use(middleware.AuthMiddleware())
	{
		// SchoolAdmin and Students can create tickets
		tickets.POST("", middleware.RoleGuard("SCHOOLADMIN", "STUDENT"), createTicket)

		// Students can view their own tickets
		tickets.GET("/my", middleware.RoleGuard("STUDENT"), getMyTickets)

		// Admin roles can list all
		tickets.GET("", middleware.RoleGuard("SCHOOLADMIN", "SUPERADMIN"), listTickets)
		tickets.GET("/:id", getTicket)

		// SuperAdmin can update tickets
		tickets.PUT("/:id", middleware.RoleGuard("SUPERADMIN"), updateTicket)
	}
}

// createTicket - SchoolAdmin creates a support ticket
func createTicket(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)

	var input CreateTicketInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	priority := input.Priority
	if priority == "" {
		priority = "MEDIUM"
	}

	ticket := models.Ticket{
		SchoolID:    schoolID,
		UserID:      userID,
		Subject:     input.Subject,
		Description: input.Description,
		Category:    input.Category,
		Priority:    priority,
		Status:      "OPEN",
	}

	if err := models.DB.Create(&ticket).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create ticket"})
		return
	}

	c.JSON(http.StatusCreated, ticket)
}

// listTickets - List tickets (filtered by role)
func listTickets(c *gin.Context) {
	role := c.MustGet("role").(string)

	var tickets []models.Ticket
	query := models.DB.Preload("School").Preload("User").Order("created_at DESC")

	if role == "SUPERADMIN" {
		// SuperAdmin sees all tickets
		query.Find(&tickets)
	} else {
		// SchoolAdmin sees only their school's tickets
		schoolID := c.MustGet("schoolID").(uint)
		query.Where("school_id = ?", schoolID).Find(&tickets)
	}

	c.JSON(http.StatusOK, tickets)
}

// getMyTickets - Student sees only their own tickets
func getMyTickets(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	schoolID := c.MustGet("schoolID").(uint)

	var tickets []models.Ticket
	models.DB.Where("user_id = ? AND school_id = ?", userID, schoolID).
		Order("created_at DESC").Find(&tickets)

	c.JSON(http.StatusOK, tickets)
}

// getTicket - Get single ticket details
func getTicket(c *gin.Context) {
	ticketID := c.Param("id")
	role := c.MustGet("role").(string)

	var ticket models.Ticket
	if err := models.DB.Preload("School").Preload("User").First(&ticket, ticketID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ticket not found"})
		return
	}

	// Check access
	if role != "SUPERADMIN" {
		schoolID := c.MustGet("schoolID").(uint)
		if ticket.SchoolID != schoolID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}
	}

	c.JSON(http.StatusOK, ticket)
}

// updateTicket - SuperAdmin updates ticket status/response
func updateTicket(c *gin.Context) {
	ticketID := c.Param("id")

	var ticket models.Ticket
	if err := models.DB.First(&ticket, ticketID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ticket not found"})
		return
	}

	var input UpdateTicketInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Status != "" {
		ticket.Status = input.Status
	}
	if input.Response != "" {
		ticket.Response = input.Response
	}

	if err := models.DB.Save(&ticket).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ticket"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Ticket updated successfully",
		"ticket":  ticket,
	})
}
