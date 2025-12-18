package utils

import (
	"log"
	"os"
	"schoolms-go/models"
)

func SeedSuperAdmin() {
	email := os.Getenv("SUPERADMIN_EMAIL")
	password := os.Getenv("SUPERADMIN_PASSWORD")

	if email == "" || password == "" {
		log.Println("SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set to seed superadmin.")
		return
	}

	var count int64
	models.DB.Model(&models.User{}).Where("role = ?", "SUPERADMIN").Count(&count)
	if count > 0 {
		log.Println("Superadmin already exists.")
		return
	}

	hash, err := models.HashPassword(password)
	if err != nil {
		log.Fatal("Failed to hash superadmin password:", err)
	}

	admin := models.User{
		Email:        email,
		PasswordHash: hash,
		Role:         "SUPERADMIN",
		SchoolID:     nil, // Explicitly nil
	}

	if err := models.DB.Create(&admin).Error; err != nil {
		log.Fatal("Failed to create superadmin:", err)
	}

	log.Println("Superadmin created successfully.")
}
