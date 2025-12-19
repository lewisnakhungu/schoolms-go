package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"
	"schoolms-go/services"

	"github.com/gin-gonic/gin"
)

func RegisterVoteHeadRoutes(router *gin.RouterGroup) {
	vh := router.Group("/vote-heads")
	vh.Use(middleware.AuthMiddleware(), middleware.RoleGuard("SCHOOLADMIN", "FINANCE"))
	{
		vh.POST("", createVoteHead)
		vh.GET("", listVoteHeads)
		vh.PUT("/:id", updateVoteHead)
		vh.DELETE("/:id", deleteVoteHead)
		vh.PUT("/reorder", reorderVoteHeads)
	}

	// Fee items (vote head breakdown in fee structures)
	router.Group("/fee-structures").Use(middleware.AuthMiddleware(), middleware.RoleGuard("SCHOOLADMIN", "FINANCE")).
		POST("/:id/items", addFeeItem).
		GET("/:id/items", getFeeItems)

	// Student vote head balances
	students := router.Group("/students")
	students.Use(middleware.AuthMiddleware())
	{
		students.GET("/:id/vote-head-balances", middleware.RoleGuard("SCHOOLADMIN", "FINANCE", "PARENT"), getStudentVoteHeadBalances)
		students.POST("/:id/initialize-balances", middleware.RoleGuard("SCHOOLADMIN"), initializeBalances)
	}
}

// VoteHead CRUD

type CreateVoteHeadInput struct {
	Name     string `json:"name" binding:"required"`
	Priority int    `json:"priority"`
}

func createVoteHead(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var input CreateVoteHeadInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Auto-assign priority if not provided
	if input.Priority == 0 {
		var maxPriority int
		models.DB.Model(&models.VoteHead{}).Where("school_id = ?", schoolID).
			Select("COALESCE(MAX(priority), 0)").Scan(&maxPriority)
		input.Priority = maxPriority + 1
	}

	voteHead := models.VoteHead{
		SchoolID: schoolID,
		Name:     input.Name,
		Priority: input.Priority,
		IsActive: true,
	}

	if err := models.DB.Create(&voteHead).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create vote head"})
		return
	}

	c.JSON(http.StatusCreated, voteHead)
}

func listVoteHeads(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var voteHeads []models.VoteHead
	models.DB.Where("school_id = ?", schoolID).Order("priority ASC").Find(&voteHeads)

	c.JSON(http.StatusOK, voteHeads)
}

func updateVoteHead(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	id := c.Param("id")

	var voteHead models.VoteHead
	if err := models.DB.Where("id = ? AND school_id = ?", id, schoolID).First(&voteHead).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vote head not found"})
		return
	}

	var input struct {
		Name     string `json:"name"`
		Priority int    `json:"priority"`
		IsActive *bool  `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Name != "" {
		voteHead.Name = input.Name
	}
	if input.Priority > 0 {
		voteHead.Priority = input.Priority
	}
	if input.IsActive != nil {
		voteHead.IsActive = *input.IsActive
	}

	models.DB.Save(&voteHead)
	c.JSON(http.StatusOK, voteHead)
}

func deleteVoteHead(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	id := c.Param("id")

	// Soft delete - just deactivate
	result := models.DB.Model(&models.VoteHead{}).
		Where("id = ? AND school_id = ?", id, schoolID).
		Update("is_active", false)

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vote head not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vote head deactivated"})
}

type ReorderInput struct {
	Order []struct {
		ID       uint `json:"id"`
		Priority int  `json:"priority"`
	} `json:"order"`
}

func reorderVoteHeads(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var input ReorderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for _, item := range input.Order {
		models.DB.Model(&models.VoteHead{}).
			Where("id = ? AND school_id = ?", item.ID, schoolID).
			Update("priority", item.Priority)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reordered"})
}

// Fee Items

type AddFeeItemInput struct {
	VoteHeadID uint    `json:"vote_head_id" binding:"required"`
	Amount     float64 `json:"amount" binding:"required"`
}

func addFeeItem(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	feeStructureID := c.Param("id")

	// Verify fee structure belongs to school
	var fs models.FeeStructure
	if err := models.DB.Where("id = ? AND school_id = ?", feeStructureID, schoolID).First(&fs).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Fee structure not found"})
		return
	}

	var input AddFeeItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	feeItem := models.FeeItem{
		FeeStructureID: fs.ID,
		VoteHeadID:     input.VoteHeadID,
		Amount:         input.Amount,
	}

	if err := models.DB.Create(&feeItem).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add fee item"})
		return
	}

	c.JSON(http.StatusCreated, feeItem)
}

func getFeeItems(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	feeStructureID := c.Param("id")

	// Verify fee structure belongs to school
	var fs models.FeeStructure
	if err := models.DB.Where("id = ? AND school_id = ?", feeStructureID, schoolID).First(&fs).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Fee structure not found"})
		return
	}

	var items []models.FeeItem
	models.DB.Where("fee_structure_id = ?", fs.ID).Preload("VoteHead").Find(&items)

	c.JSON(http.StatusOK, items)
}

// Student Vote Head Balances

func getStudentVoteHeadBalances(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	studentID := c.Param("id")

	// Convert studentID to uint
	var sid uint
	if _, err := c.GetQuery("id"); err {
		// Parsing from param
	}
	models.DB.Raw("SELECT CAST(? AS INTEGER)", studentID).Scan(&sid)

	breakdown, total, err := services.GetStudentVoteHeadBreakdown(sid, schoolID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"student_id":    studentID,
		"breakdown":     breakdown,
		"total_balance": total,
	})
}

func initializeBalances(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	studentID := c.Param("id")

	var sid uint
	models.DB.Raw("SELECT CAST(? AS INTEGER)", studentID).Scan(&sid)

	// Delete existing balances
	models.DB.Where("student_id = ? AND school_id = ?", sid, schoolID).Delete(&models.VoteHeadBalance{})

	// Re-fetch from fee structure (service will do this)
	breakdown, total, err := services.GetStudentVoteHeadBreakdown(sid, schoolID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Balances initialized",
		"breakdown":     breakdown,
		"total_balance": total,
	})
}
