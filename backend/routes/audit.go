package routes

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func RegisterAuditRoutes(router *gin.RouterGroup) {
	audit := router.Group("/audit-logs")
	audit.Use(middleware.AuthMiddleware())
	audit.Use(middleware.RoleGuard("SCHOOLADMIN", "SUPERADMIN"))
	{
		audit.GET("", listAuditLogs)
		audit.GET("/export", exportAuditLogs)
	}
}

type AuditLogFilter struct {
	UserID   uint   `form:"user_id"`
	Action   string `form:"action"`
	Entity   string `form:"entity"`
	FromDate string `form:"from_date"`
	ToDate   string `form:"to_date"`
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
}

func listAuditLogs(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	role := c.MustGet("role").(string)

	var filter AuditLogFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Default pagination
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 || filter.PageSize > 100 {
		filter.PageSize = 50
	}

	query := models.DB.Model(&models.AuditLog{})

	// SuperAdmin can see all schools, SchoolAdmin only their school
	if role != "SUPERADMIN" {
		query = query.Where("school_id = ?", schoolID)
	}

	// Apply filters
	if filter.UserID > 0 {
		query = query.Where("user_id = ?", filter.UserID)
	}
	if filter.Action != "" {
		query = query.Where("action = ?", filter.Action)
	}
	if filter.Entity != "" {
		query = query.Where("entity = ?", filter.Entity)
	}
	if filter.FromDate != "" {
		if t, err := time.Parse("2006-01-02", filter.FromDate); err == nil {
			query = query.Where("created_at >= ?", t)
		}
	}
	if filter.ToDate != "" {
		if t, err := time.Parse("2006-01-02", filter.ToDate); err == nil {
			query = query.Where("created_at <= ?", t.Add(24*time.Hour))
		}
	}

	var total int64
	query.Count(&total)

	var logs []models.AuditLog
	offset := (filter.Page - 1) * filter.PageSize
	query.Order("created_at DESC").Offset(offset).Limit(filter.PageSize).Find(&logs)

	// Get user emails for display
	var userIDs []uint
	for _, log := range logs {
		userIDs = append(userIDs, log.UserID)
	}

	var users []models.User
	models.DB.Select("id, email").Where("id IN ?", userIDs).Find(&users)

	userMap := make(map[uint]string)
	for _, u := range users {
		userMap[u.ID] = u.Email
	}

	// Get unique actions for filter dropdown
	var actions []string
	models.DB.Model(&models.AuditLog{}).Distinct("action").Pluck("action", &actions)

	c.JSON(http.StatusOK, gin.H{
		"data":    logs,
		"users":   userMap,
		"actions": actions,
		"pagination": gin.H{
			"page":      filter.Page,
			"page_size": filter.PageSize,
			"total":     total,
			"pages":     (total + int64(filter.PageSize) - 1) / int64(filter.PageSize),
		},
	})
}

func exportAuditLogs(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	role := c.MustGet("role").(string)

	var filter AuditLogFilter
	c.ShouldBindQuery(&filter)

	query := models.DB.Model(&models.AuditLog{})

	if role != "SUPERADMIN" {
		query = query.Where("school_id = ?", schoolID)
	}

	// Apply date filters
	if filter.FromDate != "" {
		if t, err := time.Parse("2006-01-02", filter.FromDate); err == nil {
			query = query.Where("created_at >= ?", t)
		}
	}
	if filter.ToDate != "" {
		if t, err := time.Parse("2006-01-02", filter.ToDate); err == nil {
			query = query.Where("created_at <= ?", t.Add(24*time.Hour))
		}
	}

	var logs []models.AuditLog
	query.Order("created_at DESC").Limit(10000).Find(&logs)

	// Get user emails
	var userIDs []uint
	for _, log := range logs {
		userIDs = append(userIDs, log.UserID)
	}
	var users []models.User
	models.DB.Select("id, email").Where("id IN ?", userIDs).Find(&users)
	userMap := make(map[uint]string)
	for _, u := range users {
		userMap[u.ID] = u.Email
	}

	// Generate CSV
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=audit_logs_%s.csv", time.Now().Format("2006-01-02")))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Header
	writer.Write([]string{"ID", "Date", "User", "Action", "Entity", "Entity ID", "Old Value", "New Value", "IP Address"})

	// Data rows
	for _, log := range logs {
		writer.Write([]string{
			strconv.Itoa(int(log.ID)),
			log.CreatedAt.Format("2006-01-02 15:04:05"),
			userMap[log.UserID],
			log.Action,
			log.Entity,
			strconv.Itoa(int(log.EntityID)),
			log.OldValue,
			log.NewValue,
			log.IPAddress,
		})
	}
}
