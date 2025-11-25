// routes/auth.go
package routes // ← MUST be "routes", not "main"

import (
	"schoolms-go/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// NEVER leave this empty in real life — use a strong 32+ char secret
var jwtSecret = []byte("1c9f8a7b3e5d2f4a6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c")

// Login request body
type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Signup request body
type SignupInput struct {
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

// Register the two routes
func SetupRoutes(app *fiber.App) {
	api := app.Group("/api/v1/auth")

	api.Post("/signup", signup)
	api.Post("/login", login)
}

// ========================
// SIGNUP ENDPOINT
// ========================
func signup(c *fiber.Ctx) error {
	input := new(SignupInput)
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	// Validate role
	validRoles := map[string]bool{
		"superadmin":  true,
		"schooladmin": true,
		"teacher":     true,
		"student":     true,
	}
	if !validRoles[input.Role] {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid role"})
	}

	// Check if email already exists
	var existing models.User
	if models.DB.Where("email = ?", input.Email).First(&existing).RowsAffected > 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Email already registered"})
	}

	// Hash password properly (don't ignore error)
	hashedPassword, err := models.HashPassword(input.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to hash password"})
	}

	// Create user
	user := models.User{
		Email:    input.Email,
		FullName: input.FullName,
		Password: hashedPassword,
		Role:     input.Role,
	}

	// Save to DB
	models.DB.Create(&user)

	// Success
	return c.JSON(fiber.Map{
		"message": input.Role + " created successfully!",
		"email":   user.Email,
	})
}

// ========================
// LOGIN ENDPOINT
// ========================
func login(c *fiber.Ctx) error {
	input := new(LoginInput)
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	var user models.User
	result := models.DB.Where("email = ?", input.Email).First(&user)

	if result.RowsAffected == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid email or password"})
	}

	if !models.CheckPasswordHash(input.Password, user.Password) {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid email or password"})
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not generate token"})
	}

	return c.JSON(fiber.Map{
		"access_token": tokenString,
		"token_type":   "bearer",
		"role":         user.Role,
		"full_name":    user.FullName,
	})
}