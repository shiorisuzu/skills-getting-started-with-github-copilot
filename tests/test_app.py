import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_get_activities():
    """Test GET /activities endpoint"""
    response = client.get("/activities")
    assert response.status_code == 200
    activities = response.json()
    assert isinstance(activities, dict)
    assert "Chess Club" in activities
    assert "Programming Class" in activities

def test_signup_for_activity():
    """Test POST /activities/{activity_name}/signup endpoint"""
    # Test successful signup
    response = client.post("/activities/Chess Club/signup?email=test@mergington.edu")
    assert response.status_code == 200
    assert response.json()["message"] == "Signed up test@mergington.edu for Chess Club"

    # Verify the participant was added
    activities = client.get("/activities").json()
    assert "test@mergington.edu" in activities["Chess Club"]["participants"]

def test_signup_duplicate():
    """Test duplicate signup prevention"""
    # First signup
    client.post("/activities/Programming Class/signup?email=test2@mergington.edu")
    
    # Try to signup again
    response = client.post("/activities/Programming Class/signup?email=test2@mergington.edu")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]

def test_signup_nonexistent_activity():
    """Test signup for non-existent activity"""
    response = client.post("/activities/NonexistentClub/signup?email=test@mergington.edu")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

def test_unregister_participant():
    """Test DELETE /activities/{activity_name}/unregister endpoint"""
    # First sign up a participant
    email = "unregister_test@mergington.edu"
    activity = "Art Club"
    client.post(f"/activities/{activity}/signup?email={email}")

    # Test successful unregistration
    response = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert response.status_code == 200
    assert response.json()["message"] == f"Unregistered {email} from {activity}"

    # Verify the participant was removed
    activities = client.get("/activities").json()
    assert email not in activities[activity]["participants"]

def test_unregister_nonexistent_participant():
    """Test unregistering non-existent participant"""
    response = client.delete("/activities/Chess Club/unregister?email=nonexistent@mergington.edu")
    assert response.status_code == 404
    assert "Participant not found" in response.json()["detail"]

def test_unregister_nonexistent_activity():
    """Test unregistering from non-existent activity"""
    response = client.delete("/activities/NonexistentClub/unregister?email=test@mergington.edu")
    assert response.status_code == 404
    assert "Activity not found" in response.json()["detail"]