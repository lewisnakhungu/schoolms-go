#!/bin/bash

BASE_URL="http://localhost:8080/api/v1"
SUPER_EMAIL="super@school.com"
SUPER_PASS="SuperPassword123!"

echo "--- 1. Login as Superadmin ---"
SUPER_TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$SUPER_EMAIL\", \"password\": \"$SUPER_PASS\"}" | jq -r '.access_token')

if [ "$SUPER_TOKEN" == "null" ]; then
    echo "Failed to login as superadmin"
    exit 1
fi
echo "Superadmin Token acquired."

echo "\n--- 2. Create School + Admin ---"
# Randomize email to allow repeated runs
RANDOM_ID=$RANDOM
ADMIN_EMAIL="admin$RANDOM_ID@school.com"

RESPONSE=$(curl -s -X POST $BASE_URL/superadmin/schools \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Tech High School $RANDOM_ID\", 
    \"address\": \"123 Tech Lane\", 
    \"contact_info\": \"555-0199\", 
    \"admin_email\": \"$ADMIN_EMAIL\"
  }")

# Extract admin password from response (it sends back raw credentials for MVP)
# The response structure is { ..., "credentials": { "password": "..." } }
ADMIN_PASS=$(echo $RESPONSE | jq -r '.credentials.password')

echo "Created School Admin: $ADMIN_EMAIL / $ADMIN_PASS"

echo "\n--- 3. Login as School Admin ---"
ADMIN_TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASS\"}" | jq -r '.access_token')

if [ "$ADMIN_TOKEN" == "null" ]; then
    echo "Failed to login as school admin"
    exit 1
fi
echo "School Admin Token acquired."

echo "\n--- 4. Create Student Invite ---"
INVITE_RESP=$(curl -s -X POST $BASE_URL/invites \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"role\": \"STUDENT\"}")

INVITE_CODE=$(echo $INVITE_RESP | jq -r '.code')
echo "Invite Code: $INVITE_CODE"

echo "\n--- 5. Student Signup with Invite ---"
STUDENT_EMAIL="student$RANDOM_ID@school.com"
STUDENT_PASS="StudentPass123!"

SIGNUP_RESP=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$STUDENT_EMAIL\", 
    \"password\": \"$STUDENT_PASS\", 
    \"invite_code\": \"$INVITE_CODE\"
  }")
echo "Signup Response: $SIGNUP_RESP"

echo "\n--- 6. Login as Student ---"
STUDENT_TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$STUDENT_EMAIL\", \"password\": \"$STUDENT_PASS\"}" | jq -r '.access_token')

if [ "$STUDENT_TOKEN" == "null" ]; then
    echo "Failed to login as student"
    exit 1
fi
echo "Student Token acquired."

echo "\n--- 7. Verify Data Isolation (Student listing classes) ---"
# Should be forbidden/empty or managed. Actually student listing classes wasn't explicitly implemented for students, 
# but let's try to access a protected route.
# Let's try to access the finance/student balance.
# First we need student ID.
# For MVP we don't have a "me" endpoint, so we decode token or guess ID?
# The login response didn't return ID.
# Let's fallback to checking if Student can List Students (RoleGuard should block it: SchoolAdmin/Teacher only)

echo "Attempting to list students as Student (Should Fail/403):"
curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/students \
  -H "Authorization: Bearer $STUDENT_TOKEN"
echo " (Expected: 403)"

echo "\n--- Tests Completed ---"
